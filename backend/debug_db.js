import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Admin Access
);

async function inspectDB() {
    console.log("--- DEBUGGING DATABASE ---");

    // 1. Check Table Structure / Rows
    const { data: rows, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ DB SELECT Error:", error);
        return;
    }

    console.log(`Found ${rows.length} recent rows.`);

    rows.forEach((row, i) => {
        console.log(`\nRow ${i + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Email: ${row.user_email}`);
        console.log(`  - Status: ${row.status}`);
        console.log(`  - Image URL: ${row.image_url ? row.image_url.substring(0, 50) + "..." : "NULL ❌"}`);
    });
}

inspectDB();
