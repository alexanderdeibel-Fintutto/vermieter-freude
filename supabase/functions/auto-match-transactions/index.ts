 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface MatchRequest {
   transactionId: string;
   tenantId?: string;
   leaseId?: string;
   transactionType?: string;
   createRule?: boolean;
   ruleConditions?: Array<{ field: string; operator: string; value: string }>;
 }
 
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
 
     const { transactionId, tenantId, leaseId, transactionType, createRule, ruleConditions } = 
       await req.json() as MatchRequest;
 
     // Get the transaction
     const { data: transaction, error: txError } = await supabase
       .from('bank_transactions')
       .select('*, account:bank_accounts!inner(connection:finapi_connections!inner(organization_id))')
       .eq('id', transactionId)
       .single();
 
     if (txError || !transaction) throw new Error('Transaction not found');
 
     // Verify organization access
     if ((transaction as unknown as { account: { connection: { organization_id: string } } })
       .account.connection.organization_id !== profile.organization_id) {
       throw new Error('Unauthorized access to transaction');
     }
 
     // Update the transaction
     const { error: updateError } = await supabase
       .from('bank_transactions')
       .update({
         matched_tenant_id: tenantId || null,
         matched_lease_id: leaseId || null,
         transaction_type: transactionType || 'other',
         match_status: 'manual',
         match_confidence: 1.0,
         matched_at: new Date().toISOString(),
         matched_by: user.id,
       })
       .eq('id', transactionId);
 
     if (updateError) throw updateError;
 
     // Create rule if requested
     let newRule = null;
     if (createRule && ruleConditions && ruleConditions.length > 0) {
       const { data: rule, error: ruleError } = await supabase
         .from('transaction_rules')
         .insert({
           organization_id: profile.organization_id,
           name: `Regel für ${transaction.counterpart_name || 'Transaktion'}`,
           conditions: ruleConditions,
           action_type: tenantId ? 'assign_tenant' : 'book_as',
           action_config: tenantId
             ? { tenant_id: tenantId, lease_id: leaseId }
             : { type: transactionType },
           match_count: 1,
           last_match_at: new Date().toISOString(),
         })
         .select()
         .single();
 
       if (!ruleError) {
         newRule = rule;
       }
     }
 
     return new Response(JSON.stringify({
       success: true,
       transaction: { id: transactionId },
       rule: newRule,
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error matching transaction:', error);
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