const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sql = 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_documents TEXT;';
    
    // Test common RPC function names for executing SQL
    const rpcNames = ['exec_sql', 'exec', 'run_sql', 'query'];
    
    for (const name of rpcNames) {
        try {
            console.log(`Trying RPC: ${name}...`);
            const { data, error } = await supabase.rpc(name, { query: sql, sql: sql });
            if (!error) {
                console.log(`SUCCESS with RPC [${name}]:`, data);
                return;
            } else {
                console.log(`Error with RPC [${name}]:`, error.message);
            }
        } catch (e) {
            console.log(`Exception with RPC [${name}]:`, e.message);
        }
    }
}
run();
