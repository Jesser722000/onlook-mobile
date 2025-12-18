# OnLook Mobile Backend

This directory contains the serverless code for the OnLook Mobile App.
It is a standalone Vercel project to keep mobile traffic separate from the Chrome Extension.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file (or set in Vercel Project Settings) with:
    ```env
    SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
    OPENAI_API_KEY=...
    ```

## Deployment

1.  Input `vercel` in your terminal within this folder:
    ```bash
    cd backend
    npx vercel
    ```

2.  Follow the prompts to create a NEW project (e.g., `onlook-mobile-backend`).

3.  **Important**: Add the Production URL to your Mobile App's `.env` file as `EXPO_PUBLIC_API_URL`.
    Example:
    ```
    EXPO_PUBLIC_API_URL=https://onlook-mobile-backend.vercel.app/api/generate
    ```
