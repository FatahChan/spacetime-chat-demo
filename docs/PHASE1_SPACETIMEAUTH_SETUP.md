# Phase 1: SpacetimeAuth + GitHub Setup (Manual Steps)

Complete these steps **before** running the chat app. All steps are done in the SpacetimeAuth dashboard and GitHub—no code changes required.

---

## 1.1 Enable SpacetimeAuth for your module

1. Go to [SpacetimeDB Maincloud](https://spacetimedb.com) and sign in
2. Open your module dashboard: **my-spacetime-app-6ali9**
3. In the left sidebar, click **SpacetimeAuth**
4. Click **Use SpacetimeAuth**

---

## 1.2 Create GitHub OAuth App

1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App** (or "Register a new application" if first time)
3. Fill in:
   - **Application name**: e.g. `My Spacetime Chat`
   - **Homepage URL**: e.g. `http://localhost:5173` (or your app URL)
   - **Authorization callback URL**: **MUST be exactly**
     ```
     https://auth.spacetimedb.com/interactions/federated/callback/github
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy the **Client Secret** (you won't see it again)

---

## 1.3 Configure GitHub in SpacetimeAuth

1. In your SpacetimeAuth dashboard, go to **Identity Providers**
2. Find **GitHub** and click to expand
3. Enable GitHub
4. Paste the **Client ID** from step 1.2
5. Paste the **Client Secret** from step 1.2
6. Click **Save**

---

## 1.4 Configure client redirect URIs in SpacetimeAuth (REQUIRED)

> **Important:** Without this step, you will get `invalid_redirect_uri` / "redirect_uris must contain members" when signing in.

1. In SpacetimeAuth dashboard, go to **Clients**
2. Edit the default client (or create one)
3. Add **Redirect URIs** (must include at least one):
   - `http://localhost:5173/callback` (for local dev)
   - Add your production URL when deploying (e.g. `https://your-app.com/callback`)
4. Add **Post Logout Redirect URIs**:
   - `http://localhost:5173`
   - Add production URL when deploying
5. Click **Save**
6. Copy the **Client ID** of this client—you'll need it for `.env.local`

---

## 1.5 Add Client ID to your app

Add this to your `.env.local`:

```
VITE_SPACETIMEDB_AUTH_CLIENT_ID=client_xxxxxxxxxxxx
```

Replace `client_xxxxxxxxxxxx` with the **SpacetimeAuth Client ID** from step 1.4 (not the GitHub OAuth Client ID).

---

## Checklist

- [ ] SpacetimeAuth enabled for module
- [ ] GitHub OAuth App created with callback `https://auth.spacetimedb.com/interactions/federated/callback/github`
- [ ] GitHub configured in SpacetimeAuth (Identity Providers)
- [ ] Redirect URIs configured in SpacetimeAuth (Clients)
- [ ] `VITE_SPACETIMEDB_AUTH_CLIENT_ID` added to `.env.local`

Once complete, you can run the app and sign in with GitHub.

---

## Troubleshooting

### `invalid_redirect_uri` / "redirect_uris must contain members"

SpacetimeAuth is rejecting the request because the client has no redirect URIs. Try this:

**Option A: Create a new client (recommended)**

1. Go to SpacetimeAuth dashboard → **Clients**
2. Click **Create Client** (do not edit the default client)
3. Set **Name**: e.g. `Web App`
4. In **Redirect URIs**, add exactly: `http://localhost:5173/callback`
5. In **Post Logout Redirect URIs**, add: `http://localhost:5173`
6. Click **Save**
7. Copy the new **Client ID** and update `VITE_SPACETIMEDB_AUTH_CLIENT_ID` in `.env.local`
8. Restart the dev server

**Option B: Fix the existing client**

1. Go to SpacetimeAuth dashboard → **Clients** → Edit your client
2. Clear the **Redirect URIs** field, then add: `http://localhost:5173/callback` (one per line if multiple)
3. Ensure **Post Logout Redirect URIs** includes: `http://localhost:5173`
4. Click **Save** and wait for the page to confirm
5. Restart the dev server
