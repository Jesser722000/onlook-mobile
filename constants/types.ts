export type GenerationResponse = {
    success: boolean;
    imageUrl?: string;
    remainingCredits?: number;
    error?: string;
    message?: string;
};

export type GenerationRequest = {
    userEmail: string;
    baseImage: string; // Base64 Data URL
    productImage: string; // Base64 Data URL
    promptMode?: string;
    aspectRatio?: 'portrait' | 'landscape' | 'square';
};
