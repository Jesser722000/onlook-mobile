import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Authenticate (Basic) - ideally verify session token, but for now we accept query param or header
    // To match api/generate.js, we should verify the bearer token.
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
    }

    // 2. Fetch Credits - Try RPC first, fallback to 'profiles' table ?
    // We assume the RPC exists since the user mentioned it in the error log.
    // Using Service Role key bypasses RLS issues.
    try {
        const { data, error } = await supabase.rpc('get_credit_balance', {
            p_user_id: user.id
        });

        if (error) {
            console.error('RPC Error:', error);
            // Fallback: If RPC fails, return 0 or try querying a table if we knew the name.
            // For now, return 0 and log it.
            return res.status(200).json({ credits: 0, error: error.message });
        }

        return res.status(200).json({ credits: data });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
