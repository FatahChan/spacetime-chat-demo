# Deploy to Netlify

## Prerequisites

- Netlify account
- Site linked (run `netlify link` or `netlify init` if not already)

## Deploy with Netlify CLI

```bash
# First-time: link to a Netlify site (or create new)
netlify link

# Deploy to production
bun run netlify:deploy
# or
netlify deploy --prod

# Deploy as draft/preview (no production)
bun run netlify:deploy:preview
```

## Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SPACETIMEDB_HOST` | `https://maincloud.spacetimedb.com` |
| `VITE_SPACETIMEDB_DB_NAME` | `my-spacetime-app-6ali9` |
| `VITE_SPACETIMEDB_AUTH_CLIENT_ID` | Your SpacetimeAuth client ID |

## SpacetimeAuth Redirect URIs

After deploying, add your Netlify URL to SpacetimeAuth:

1. Go to SpacetimeAuth dashboard → **Clients** → Edit your client
2. Add to **Redirect URIs**: `https://YOUR-SITE-NAME.netlify.app/callback`
3. Add to **Post Logout Redirect URIs**: `https://YOUR-SITE-NAME.netlify.app`
4. Click **Save**

Replace `YOUR-SITE-NAME` with your actual Netlify site subdomain.
