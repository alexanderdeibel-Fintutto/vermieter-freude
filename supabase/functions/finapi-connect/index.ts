 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface ConnectRequest {
   bankId: string;
   bankName: string;
   bankLogo?: string;
   bankBic?: string;
   credentials?: {
     username: string;
     password: string;
   };
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
 
     const { bankId, bankName, bankLogo, bankBic, credentials } = await req.json() as ConnectRequest;
 
     // In production, this would call FinAPI to:
     // 1. Create or get finAPI user
     // 2. Import bank connection
     // 3. Handle 2FA if required
     // 4. Get accounts
 
     // For now, simulate the connection
     const finapiUserId = `finapi_${profile.organization_id.slice(0, 8)}`;
 
     // Create connection record
     const { data: connection, error: connError } = await supabase
       .from('finapi_connections')
       .insert({
         organization_id: profile.organization_id,
         finapi_user_id: finapiUserId,
         bank_id: bankId,
         bank_name: bankName,
         bank_logo_url: bankLogo || null,
         bank_bic: bankBic || null,
         status: 'connected',
         last_sync_at: new Date().toISOString(),
       })
       .select()
       .single();
 
     if (connError) throw connError;
 
     // Simulate account creation (in production, would come from FinAPI)
     const simulatedAccounts = [
       {
         connection_id: connection.id,
         finapi_account_id: `acc_${Date.now()}`,
         iban: `DE89${bankId.slice(0, 8).padEnd(8, '0')}${Math.random().toString().slice(2, 12)}`,
         account_name: 'Geschäftskonto',
         account_type: 'checking',
         balance_cents: Math.floor(Math.random() * 1000000) + 100000, // Random balance
         balance_date: new Date().toISOString(),
       }
     ];
 
     const { data: accounts, error: accError } = await supabase
       .from('bank_accounts')
       .insert(simulatedAccounts)
       .select();
 
     if (accError) throw accError;
 
     return new Response(JSON.stringify({
       success: true,
       connection,
       accounts,
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error connecting bank:', error);
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