const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const payload = {
        id: '9a1e9679-ea50-4a41-9d09-d3e9f111fa70', // VF5 ID
        name: 'VinFast VF5 Test Save',
        slug: 'vinfast-vf5',
        category: 'dong_co_dien',
        tagline: 'Khơi nguồn bản lĩnh, công nghệ tương lai',
        homepage_specs: { range: '326 km', charge_time: '30 phút', segment: 'A-SUV' },
        sale_status: 'booking'
    };

    const { data, error } = await supabase
        .from('products')
        .upsert(payload)
        .select();

    if (error) {
        console.error('Error during upsert:', error);
    } else {
        console.log('Upsert succeeded! Response:', data);
    }
}

test();
