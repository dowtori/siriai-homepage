# Brand pages

- `/bi`: public brand identity page (`bi.html`), canonical, structured data, homepage footer link and sitemap entry.
- `/bi-member`: password protected team reference. Not included in the sitemap; all responses are private/no-store and noindex.
- The homepage Google Fonts families and weights are reused. Font attribution links point to the official OFL sources. Brand assets have separate usage guidance. No download controls or asset archives are published.

## Editing the member page

Edit `brand-src/member.html` and `brand-src/handler.mjs`, then run:

```sh
node scripts/build-member.mjs
node --test tests/member.test.mjs
```

`member-assets.json` contains only presentation images and the approved logo motion scripts. The build embeds these and the HTML in the server function `api/bi-member.mjs`. `brand-src`, `scripts` and `tests` are excluded by `.vercelignore`; never expose the member source as static files.

The Vercel project needs a sensitive `BI_SESSION_SECRET` of at least 32 characters in preview and production. Authentication uses a signed, 12-hour HttpOnly/Secure/SameSite cookie. Rotating the secret invalidates all sessions. The shared PIN is stored in the sensitive BI_MEMBER_PASSWORD environment variable and checked only on the server. To change it, update that variable and redeploy. Rotate BI_SESSION_SECRET as well to expire existing sessions. Local tests inject a temporary secret and allow local HTTP origins only under `BI_LOCAL_TEST=1`; do not configure that variable in Vercel.

Failed attempts receive per-instance rate limiting (8 attempts per 15 minutes). This is not a distributed account lockout. If stronger protection is needed, use a platform firewall rule or identity provider. The shared PIN is for team reference access, not individual account management.

The public page intentionally presents the same brand imagery. The password gate protects the team catalogue and its routes, not ownership of brand images that are already public.

## Deployment

Linked Vercel project: `siriai-homepage` in `dowtoris-projects`. Production: `https://siriai.co.kr`.
Keep the generated API entry point committed with the source so Git deployments preserve the member route. Never commit `.env.local` or deployment cookies.
