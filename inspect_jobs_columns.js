require('dotenv').config({ path: '.env.local' });
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
