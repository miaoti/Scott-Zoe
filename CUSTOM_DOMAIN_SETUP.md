# Custom Domain Configuration

This guide explains how to configure custom domains for your Railway deployment.

## Environment Variables

To support multiple custom domains, set these environment variables in your Railway dashboard:

### Required Variables

1. **CUSTOM_DOMAIN** (optional)
   - Set this to your primary custom domain (e.g., `https://www.qimiao.life`)
   - If not set, will fallback to Railway's public domain
   - Example: `https://www.qimiao.life`

2. **ALLOWED_ORIGINS** (optional)
   - Comma-separated list of all allowed origins for CORS
   - Include all your custom domains and development URLs
   - If not set, will default to Railway domain + localhost
   - Example: `https://www.qimiao.life,https://qimiao.life,https://app.qimiao.life,http://localhost:5173,http://localhost:3000`

## Setup Steps

1. **In Railway Dashboard:**
   - Go to your project settings
   - Navigate to "Variables" tab
   - Add the environment variables listed above

2. **For Multiple Domains:**
   ```
   CUSTOM_DOMAIN=https://www.qimiao.life
   ALLOWED_ORIGINS=https://www.qimiao.life,https://qimiao.life,https://app.qimiao.life,http://localhost:5173,http://localhost:3000
   ```

3. **For Single Domain:**
   ```
   CUSTOM_DOMAIN=https://www.qimiao.life
   ALLOWED_ORIGINS=https://www.qimiao.life,http://localhost:5173,http://localhost:3000
   ```

4. **Redeploy** your application after setting the variables

## How It Works

- The frontend build uses `CUSTOM_DOMAIN` for API calls
- The backend uses `ALLOWED_ORIGINS` for CORS configuration
- If variables aren't set, it falls back to Railway's default domain
- This allows you to easily switch between domains or add new ones without code changes

## Troubleshooting

- **403 Forbidden errors**: Check that your domain is included in `ALLOWED_ORIGINS`
- **API calls failing**: Verify `CUSTOM_DOMAIN` is set correctly
- **Multiple domains not working**: Ensure all domains are comma-separated in `ALLOWED_ORIGINS`