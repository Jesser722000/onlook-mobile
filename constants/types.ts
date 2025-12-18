export type GenerationResponse = {
    success: boolean;
    imageUrl?: string;
    remainingCredits?: number;
    error?: string;
    message?: string;
    debug_upload_error?: string;
    debug_public_url?: string;
    debug_public_data?: string;
};

export type GenerationRequest = {
    userEmail: string;
    baseImage: string; // Base64 Data URL
    productImage: string; // Base64 Data URL
    promptMode?: string;
    aspectRatio?: 'portrait' | 'landscape' | 'square';
};

export type Generation = {
    id: number;
    created_at: string;
    image_url: string; // The public URL from Supabase Storage
    model: string;
    prompt: string;
    status: string;
};
