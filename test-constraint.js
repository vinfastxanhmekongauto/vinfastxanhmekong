const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('leads')
        .insert([{ full_name: 'Test', phone: '0901234567', status: 'Mới' }]);
    console.log("Insert 'Mới':", error);

    const { data: d2, error: e2 } = await supabase
        .from('leads')
        .insert([{ full_name: 'Test', phone: '0901234567', status: 'new' }]);
    console.log("Insert 'new':", e2);

    const { data: d3, error: e3 } = await supabase
        .from('leads')
        .insert([{ full_name: 'Test', phone: '0901234567' }]); // Let DB use default
    console.log("Insert omitted:", e3);
}

check();
