# 🔥 Lava — 3D animated login

A highly animated 3D login page in three colours: ink `#0E0E10`, lava `#FF6A1A` and gold `#FFD166`.
Built with React, Three.js (react-three-fiber), Framer Motion, Supabase and Notion.

```bash
npm install
npm run dev      # http://localhost:5173
```

## Features
- **3D scene:** a molten distorting core with orbiting rings and moons that leave trails, floating crystal shards, rising embers, a wavy lava-grid floor, bloom, chromatic aberration and a vignette. The camera follows your mouse.
- **The scene reacts to you:** typing heats up the core, a wrong password glitches and shakes it, and a successful login sets it off with confetti.
- **Card UI:** a glass card that tilts in 3D toward your cursor with a glare, a spinning conic border, faces that flip between views, floating labels, magnetic and ripple buttons, a text-scramble title, a cursor glow, toasts and synth sound effects (toggle in the top right).
- **Auth:**
  - Google OAuth
  - Sign up with email, password and a **username**, with a live availability check
  - Sign in with **username or email**
  - Magic link
  - Forgot / reset password
  - Password strength meter, show/hide password and a Caps Lock warning
- **Save my details:** when this is on, you stay signed in across browser restarts (localStorage) and your username/email is pre-filled next time. When it's off, the session ends when you close the tab. Passwords are never stored by the app; your browser's password manager can save them.
- **Dashboard:** avatar, sign-in count, member since, last sign-in, an editable display name and sign out.
- **Notion:** every new signup is added as a row to the **Lava Login — Signups** database (username, email, provider, name and date; never passwords).

## Backend (already set up)
- Supabase project `lava-3d-login` (`sbfthysjoxndsbjtpxqy`, free tier, ap-south-1)
  - The `profiles` table has Row Level Security, so users can only read and edit their own row.
  - A trigger creates a profile on signup. Google users get an auto-generated username.
  - RPCs: `username_available`, `record_login`
  - Edge function `login-username` signs you in by username without ever revealing the email behind it.
  - Edge function `notion-sync` is called by a database trigger and logs each signup to Notion once.

## ⚠️ Finish setup (needs your accounts)

### 1. Turn on Notion logging
1. Go to https://www.notion.so/profile/integrations → **New integration** (internal) → copy the secret.
2. Open the **Lava Login — Signups** database in Notion → `•••` → **Connections** → add your integration.
3. Supabase dashboard → Project `lava-3d-login` → **Edge Functions → Secrets** → add `NOTION_TOKEN` = your secret.

### 2. Turn on Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web).
   - Authorized redirect URI: `https://sbfthysjoxndsbjtpxqy.supabase.co/auth/v1/callback`
2. Supabase → **Authentication → Sign In / Providers → Google** → paste the Client ID and Secret → enable.
3. Supabase → **Authentication → URL Configuration**: set Site URL `http://localhost:5173` (add your deployed URL later as well).

### Notes
- Supabase's built-in email sender is rate-limited (only a few emails per hour). For real use, add your own SMTP under Authentication → Emails. While testing, you can turn off "Confirm email" under Sign In / Providers → Email.
- `.env` holds the public URL and publishable key only. That's safe to ship to the browser because the data is protected by RLS.
