import { GenerationRequest, GenerationResponse } from '@/constants/types';
import { supabase } from '@/lib/supabase';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-vercel-backend.vercel.app/api/generate_v2';

// Helper: Convert File URI to Base64
export const uriToBase64 = async (uri: string): Promise<string> => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data); // This includes data:image/...;base64, prefix automatically
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting to Base64:', error);
        throw new Error('Failed to process image');
    }
};

export const generateImage = async (
    basePhotoUri: string,
    productImageUri: string
): Promise<GenerationResponse> => {
    console.log('Starting generation...');

    try {
        // 1. Get Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('User not authenticated');
        }

        // 2. Prepare Payload
        const base64Base = await uriToBase64(basePhotoUri);
        const base64Product = await uriToBase64(productImageUri);

        const payload: GenerationRequest = {
            userEmail: session.user.email || '',
            baseImage: base64Base,
            productImage: base64Product,
            promptMode: 'standard', // Hardcoded as per legacy behavior preference?
            aspectRatio: 'portrait' // Default
        };

        // 3. Call API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log("🔍 Raw API Response:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Server returned non-JSON: ${responseText.substring(0, 50)}...`);
        }

        if (!response.ok) {
            // Handle specific error codes if needed (e.g. 402 Payment Required)
            if (response.status === 402) {
                throw new Error(data.message || 'Insufficient credits');
            }
            throw new Error(data.error || 'Generation failed');
        }

        return {
            success: true,
            imageUrl: data.imageUrl,
            remainingCredits: data.remainingCredits
        };

    } catch (error: any) {
        console.error('Generation Error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
};

export const fetchUserGenerations = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('user_email', session.user.email)
            .eq('status', 'success')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching generations:', error);
        return [];
    }
};

export const fetchUserCredits = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) return 0;

        // Call our new backend endpoint to bypass RLS/RPC issues
        const response = await fetch(API_URL.replace('/generate', '/credits'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch credits');
            return 0;
        }

        const data = await response.json();
        return data.credits || 0;
    } catch (error) {
        console.error('Error fetching credits:', error);
        return 0;
    }
};
