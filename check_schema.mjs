import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // Get column info from PostgreSQL view directly using raw query or just fetch one product
    // Actually Supabase API doesn't easily show types. 
    // Just fetch one product and print thumbnail_id typeof.
    const { data: prods } = await supabase.from('products').select('*').limit(3);
    console.log("Products Sample:");
    if (prods) {
        prods.forEach(p => console.log(typeof p.thumbnail_id, p.thumbnail_id));
    }
}
check();
