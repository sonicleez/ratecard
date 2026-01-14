# AI Quotation Studio

AI-powered professional quotation and rate card generator.

## 🚀 Deployment on Coolify

1. **New Resource**: Choose "Public Repository" (or Private if configured).
2. **Repository**: `https://github.com/sonicleez/ratecard`
3. **Build Pack**: Choose **Docker**.
4. **Environment Variables**: Add these in Coolify settings:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. **Port**: `3000`

## Features

- Gemini 3 Flash/Pro support
- AI-Driven UI Customization (Dynamic CSS)
- Auto-save templates to Supabase
- Export to PDF/PNG/Link
