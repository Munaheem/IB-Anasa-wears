<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d9a72ce4-2bbf-408d-99ed-12ccedd73275

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Add your Paystack public key to `.env.local`:
   `VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key`
4. Run the app:
   `npm run dev`

## Deploy to Netlify

Use these settings when creating the site:

- Build command: `npm run build`
- Publish directory: `dist`

These settings are also included in `netlify.toml`. If checkout payments are enabled, add `VITE_PAYSTACK_PUBLIC_KEY` in Netlify under Site configuration > Environment variables, then trigger a new deploy. Do not commit `.env.local` or secret keys.
