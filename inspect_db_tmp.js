const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('blogs').select('*').limit(1);
    if (error) {
        console.error('Error fetching blogs:', error);
    } else {
        console.log('Sample blog:', data[0]);
        console.log('Columns in blogs table:', Object.keys(data[0] || {}));
    }
}

check();
