import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import pLimit from 'p-limit';

// Concurrency Limit
const limit = pLimit(5);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// INITIALIZE OPENAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 180000 // 3 minutes
});

// HELPER: Parse Data URL
function parseDataUrl(dataUrl) {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
    if (!m) throw new Error("Expected a base64 data URL: data:image/<type>;base64,<...>");
    return { mime: m[1], b64: m[2] };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userEmail, baseImage, productImage, promptMode, aspectRatio } = req.body;

        if (!userEmail || !baseImage || !productImage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // --- STEP 1: AUTHENTICATE USER ---
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return res.status(401).json({ error: 'unauthorized', message: 'Missing session token.' });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired session.' });
        }

        const userId = user.id;
        const secureEmail = user.email || userEmail;

        // --- STEP 2: BILLING ---
        const { data: remainingCredits, error: rpcError } = await supabase.rpc('consume_credit', {
            p_user_id: userId
        });

        if (rpcError || remainingCredits === null) {
            return res.status(402).json({ error: 'payment_required', message: 'Insufficient credits.' });
        }

        console.log(`[Generate] Credits deducted. User: ${secureEmail}`);

        // --- STEP 3: GENERATE WITH OPENAI IMAGES API (EDIT) ---
        const startTime = Date.now();
        let resultBase64;
        let publicUrl = null;

        try {
            // PROMPT LOGIC
            const textPrompt = "Edit Image 1. KEEP the person from Image 1 (face, hair, body shape, skin tone, pose) EXACTLY the same. Do NOT replace the person. Do NOT move the arms or change the pose. Wrap the clothing around their existing body structure. Swap ONLY the clothing to match Image 2. Waist up shot. Match Image 1 lighting. Background: Place them in a beautiful atrium with blurred flowers in the background.";

            console.log("Preparing inputs for OpenAI...");

            // DECODE & CONVERT SCALED IMAGES TO FILES
            const base = parseDataUrl(baseImage);       // Person
            const product = parseDataUrl(productImage); // Product/Clothing/Background

            const baseBuf = Buffer.from(base.b64, "base64");
            const productBuf = Buffer.from(product.b64, "base64");

            // Helper to get extension
            const getExt = (mime) => mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];

            const baseFile = await toFile(baseBuf, `person.${getExt(base.mime)}`, { type: base.mime });
            const productFile = await toFile(productBuf, `product.${getExt(product.mime)}`, { type: product.mime });

            // ORDER MATTERS:
            // User Prompt: "...clothing in Image 2" -> So Image 2 must be Product.
            // Image 1 = Person (Base).
            const images = [baseFile, productFile];

            console.log("Calling OpenAI Images API (Edit)...");

            // CALL API
            let size = "1024x1536"; // Mobile Optimized
            if (aspectRatio === 'square') size = "1024x1024";

            // Note: gpt-image-1.5 supports varying sizes

            const response = await limit(() => openai.images.edit({
                model: "gpt-image-1.5",
                image: images, // Assuming this array signature is correct for the specific model setup user has
                prompt: textPrompt,
                size: size
            }));

            console.log("OpenAI Response Received");

            const item = response.data[0];

            if (item.b64_json) {
                resultBase64 = `data:image/jpeg;base64,${item.b64_json}`;
            } else if (item.url) {
                const imgRes = await fetch(item.url);
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                resultBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
            } else {
                throw new Error("No image data (b64 or url) returned from OpenAI");
            }

            // --- UPLOAD TO STORAGE ---
            const BUCKET_NAME = 'onlook_public';
            let uploadErrorMsg = null;
            try {
                const fileName = `${crypto.randomUUID()}.jpg`;
                const buffer = Buffer.from(resultBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
                const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false });

                if (!uploadError) {
                    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
                    publicUrl = publicData.publicUrl;
                } else {
                    console.error("Upload Error:", uploadError);
                    uploadErrorMsg = JSON.stringify(uploadError);
                }
            } catch (storageErr) {
                console.error(storageErr);
                uploadErrorMsg = storageErr.message;
            }

            // --- LOG SUCCESS ---
            await supabase.from('generations').insert({
                user_email: secureEmail,
                status: 'success',
                cost_in_credits: 1,
                provider: 'openai',
                model: 'gpt-image-1.5',
                duration_ms: Date.now() - startTime,
                image_url: publicUrl // Save the URL!
            });

        } catch (genError) {
            console.error("OPENAI ERROR DETAILS:", genError);

            // REFUND
            await supabase.rpc('refund_credit', { p_user_id: userId });

            await supabase.from('generations').insert({
                user_email: secureEmail,
                status: 'failed',
                error_message: genError.message,
                provider: 'openai',
                duration_ms: Date.now() - startTime
            });

            return res.status(500).json({ error: `DEBUG INFO: ${genError.message}` });
        }


        return res.status(200).json({
            success: true,
            imageUrl: publicUrl || resultBase64,
            remainingCredits: remainingCredits,
            debug_upload_error: uploadErrorMsg
        });

    } catch (error) {
        console.error("Handler Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
