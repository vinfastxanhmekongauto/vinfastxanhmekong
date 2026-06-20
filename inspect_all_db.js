const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            // Table might not exist or we don't have access
            return;
        }
        data.forEach(row => {
            const text = JSON.stringify(row);
            if (text.toLowerCase().includes("toyota") || text.toLowerCase().includes("kiên giang") || text.toLowerCase().includes("kien giang")) {
                console.log(`MATCH FOUND in table [${tableName}]:`, JSON.stringify(row, null, 2));
            }
        });
    } catch (e) {
        // Ignore
    }
}

async function run() {
    console.log("Checking tables...");
    const tables = ['site_settings', 'service_settings', 'products', 'blogs', 'jobs', 'leads'];
    for (const t of tables) {
        await checkTable(t);
    }
    console.log("Search complete.");
}

run();
