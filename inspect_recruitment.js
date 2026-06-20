const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: jobs } = await supabase.from('jobs').select('*');
    let found = false;
    jobs.forEach(job => {
        const text = JSON.stringify(job);
        if (text.toLowerCase().includes("toyota") || text.toLowerCase().includes("kiên giang") || text.toLowerCase().includes("kien giang")) {
            console.log("MATCH FOUND in job:", job.title, job.id);
            found = true;
        }
    });
    if (!found) {
        console.log("No legacy references to Toyota or Kiên Giang found in database.");
    }
}
check();
