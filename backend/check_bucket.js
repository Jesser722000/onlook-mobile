import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    // Ideally we use Service Role to check existence accurately, but let's try Anon first or use the one from backend/.env if we can access it.
    // Actually, let's use the hardcoded/process envs if available.
);

async function checkBucket() {
    console.log("Checking Storage Buckets for URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }

    const bucketName = 'onlook_public';
    const exists = data.find(b => b.name === bucketName);

    if (exists) {
        console.log(`✅ Bucket '${bucketName}' exists.`);
        console.log("Public:", exists.public);
    } else {
        console.log(`❌ Bucket '${bucketName}' DOES NOT exist.`);
        console.log("Existing buckets:", data.map(b => b.name));
    }
}

checkBucket();
