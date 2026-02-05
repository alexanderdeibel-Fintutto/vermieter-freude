 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       throw new Error('Missing authorization header');
     }
 
     // Get user from token
     const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
       global: { headers: { Authorization: authHeader } }
     });
     const { data: { user }, error: userError } = await userClient.auth.getUser();
     if (userError || !user) throw new Error('Unauthorized');
 
     // Get user's organization
     const { data: profile } = await supabase
       .from('profiles')
       .select('organization_id')
       .eq('user_id', user.id)
       .single();
 
     if (!profile?.organization_id) throw new Error('No organization found');
 
     const { connectionId, accountId } = await req.json();
 
     // Get the account(s) to sync
     let accountsQuery = supabase
       .from('bank_accounts')
       .select('*, connection:finapi_connections!inner(organization_id)')
       .eq('is_active', true);
 
     if (accountId) {
       accountsQuery = accountsQuery.eq('id', accountId);
     } else if (connectionId) {
       accountsQuery = accountsQuery.eq('connection_id', connectionId);
     }
 
     const { data: accounts, error: accError } = await accountsQuery;
     if (accError) throw accError;
 
     // Filter to only user's org
     const orgAccounts = accounts?.filter(
       (a: { connection: { organization_id: string } }) => 
         a.connection.organization_id === profile.organization_id
     ) || [];
 
     if (orgAccounts.length === 0) {
       throw new Error('No accounts found to sync');
     }
 
     // Get tenants for matching
     const { data: tenants } = await supabase
       .from('tenants')
       .select('id, first_name, last_name')
       .eq('organization_id', profile.organization_id);
 
     // Get active leases for matching
     const { data: leases } = await supabase
       .from('leases')
       .select('id, tenant_id, rent_amount, utility_advance')
       .eq('is_active', true);
 
     // Get existing rules
     const { data: rules } = await supabase
       .from('transaction_rules')
       .select('*')
       .eq('organization_id', profile.organization_id)
       .eq('is_active', true)
       .order('priority', { ascending: false });
 
     let totalNewTransactions = 0;
     let totalMatched = 0;
 
     for (const account of orgAccounts) {
       // In production, this would call FinAPI to get transactions
       // For now, simulate some transactions
       const simulatedTransactions = generateSimulatedTransactions(account.id, tenants || [], leases || []);
 
       for (const tx of simulatedTransactions) {
         // Check if transaction already exists
         const { data: existing } = await supabase
           .from('bank_transactions')
           .select('id')
           .eq('account_id', account.id)
           .eq('finapi_transaction_id', tx.finapi_transaction_id)
           .single();
 
         if (existing) continue;
 
         // Try to auto-match with rules
         let matchResult = applyRules(tx, rules || [], tenants || [], leases || []);
 
         // If no rule match, try auto-detection
         if (!matchResult.matched && tx.amount_cents > 0) {
           matchResult = autoDetectMatch(tx, tenants || [], leases || []);
         }
 
         // Insert transaction
         const { error: insertError } = await supabase
           .from('bank_transactions')
           .insert({
             ...tx,
             ...matchResult,
             matched_at: matchResult.matched ? new Date().toISOString() : null,
           });
 
         if (!insertError) {
           totalNewTransactions++;
           if (matchResult.match_status !== 'unmatched') {
             totalMatched++;
           }
         }
       }
 
       // Update account balance
       const newBalance = Math.floor(Math.random() * 1000000) + 100000;
       await supabase
         .from('bank_accounts')
         .update({
           balance_cents: newBalance,
           balance_date: new Date().toISOString(),
         })
         .eq('id', account.id);
 
       // Update connection last_sync
       await supabase
         .from('finapi_connections')
         .update({ last_sync_at: new Date().toISOString() })
         .eq('id', account.connection_id);
     }
 
     return new Response(JSON.stringify({
       success: true,
       newTransactions: totalNewTransactions,
       matched: totalMatched,
       accounts: orgAccounts.length,
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error syncing:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(JSON.stringify({ 
       success: false, 
       error: errorMessage 
     }), {
       status: 400,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });
 
 function generateSimulatedTransactions(
   accountId: string,
   tenants: Array<{ id: string; first_name: string; last_name: string }>,
   leases: Array<{ id: string; tenant_id: string; rent_amount: number; utility_advance: number }>
 ) {
   const transactions = [];
   const now = new Date();
   
   // Generate some incoming rent payments
   for (let i = 0; i < Math.min(3, tenants.length); i++) {
     const tenant = tenants[i];
     const lease = leases.find(l => l.tenant_id === tenant.id);
     if (lease) {
       transactions.push({
         account_id: accountId,
         finapi_transaction_id: `tx_${Date.now()}_${i}`,
         booking_date: new Date(now.getTime() - i * 86400000).toISOString().split('T')[0],
         value_date: new Date(now.getTime() - i * 86400000).toISOString().split('T')[0],
         amount_cents: Math.round((lease.rent_amount + (lease.utility_advance || 0)) * 100),
         currency: 'EUR',
         counterpart_name: `${tenant.first_name} ${tenant.last_name}`,
         counterpart_iban: `DE${Math.random().toString().slice(2, 22)}`,
         purpose: `Miete ${now.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}`,
         booking_text: 'SEPA-Überweisung',
       });
     }
   }
 
   // Generate some outgoing expenses
   const expenses = [
     { name: 'Stadtwerke München', purpose: 'Nebenkosten Q4', amount: -45000 },
     { name: 'Handwerker Schmidt', purpose: 'Reparatur Heizung', amount: -28500 },
     { name: 'Versicherung AG', purpose: 'Gebäudeversicherung', amount: -15000 },
   ];
 
   for (let i = 0; i < expenses.length; i++) {
     transactions.push({
       account_id: accountId,
       finapi_transaction_id: `tx_${Date.now()}_exp_${i}`,
       booking_date: new Date(now.getTime() - (i + 3) * 86400000).toISOString().split('T')[0],
       value_date: new Date(now.getTime() - (i + 3) * 86400000).toISOString().split('T')[0],
       amount_cents: expenses[i].amount,
       currency: 'EUR',
       counterpart_name: expenses[i].name,
       counterpart_iban: `DE${Math.random().toString().slice(2, 22)}`,
       purpose: expenses[i].purpose,
       booking_text: 'SEPA-Lastschrift',
     });
   }
 
   return transactions;
 }
 
 function applyRules(
   tx: Record<string, unknown>,
   rules: Array<{
     conditions: unknown[];
     action_type: string;
     action_config: Record<string, unknown>;
   }>,
   _tenants: Array<{ id: string }>,
   _leases: Array<{ id: string; tenant_id: string }>
 ) {
   for (const rule of rules) {
     let matches = true;
     
     for (const condition of rule.conditions as Array<{ field: string; operator: string; value: string }>) {
       const txValue = String(tx[condition.field] || '').toLowerCase();
       const condValue = condition.value.toLowerCase();
       
       switch (condition.operator) {
         case 'equals':
           matches = txValue === condValue;
           break;
         case 'contains':
           matches = txValue.includes(condValue);
           break;
         case 'starts_with':
           matches = txValue.startsWith(condValue);
           break;
       }
       
       if (!matches) break;
     }
     
     if (matches) {
       if (rule.action_type === 'ignore') {
         return { match_status: 'ignored', matched: true };
       }
       if (rule.action_type === 'assign_tenant') {
         return {
           match_status: 'auto',
           matched_tenant_id: rule.action_config.tenant_id,
           matched_lease_id: rule.action_config.lease_id,
           transaction_type: 'rent',
           match_confidence: 1.0,
           matched: true,
         };
       }
       if (rule.action_type === 'book_as') {
         return {
           match_status: 'auto',
           transaction_type: rule.action_config.type,
           matched: true,
         };
       }
     }
   }
   
   return { matched: false, match_status: 'unmatched' };
 }
 
 function autoDetectMatch(
   tx: Record<string, unknown>,
   tenants: Array<{ id: string; first_name: string; last_name: string }>,
   leases: Array<{ id: string; tenant_id: string; rent_amount: number; utility_advance: number }>
 ) {
   const purpose = String(tx.purpose || '').toLowerCase();
   const counterpart = String(tx.counterpart_name || '').toLowerCase();
   const amount = tx.amount_cents as number;
   
   // Try to match by tenant name in counterpart or purpose
   for (const tenant of tenants) {
     const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
     const lastName = tenant.last_name.toLowerCase();
     
     if (counterpart.includes(fullName) || counterpart.includes(lastName) ||
         purpose.includes(fullName) || purpose.includes(lastName)) {
       const lease = leases.find(l => l.tenant_id === tenant.id);
       if (lease) {
         const expectedRent = Math.round((lease.rent_amount + (lease.utility_advance || 0)) * 100);
         const confidence = amount === expectedRent ? 0.95 : 0.7;
         
         return {
           match_status: 'auto',
           matched_tenant_id: tenant.id,
           matched_lease_id: lease.id,
           transaction_type: 'rent',
           match_confidence: confidence,
           matched: true,
         };
       }
     }
   }
   
   // Check for rent-related keywords
   if (purpose.includes('miete') || purpose.includes('rent')) {
     return {
       match_status: 'unmatched',
       transaction_type: 'rent',
       match_confidence: 0.5,
       matched: false,
     };
   }
   
   return { matched: false, match_status: 'unmatched' };
 }