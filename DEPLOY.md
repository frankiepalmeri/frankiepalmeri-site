# Deploy frankiepalmeri.com (static site)

**Recommended host: GitHub Pages** (free, simple, custom domain).  
Folder ready: `/workspace/frankiepalmeri-site/` (`index.html`, `merch/`, `.nojekyll`).

Deploy was **not** completed from this box — `gh` is not logged in, and DNS must be changed by you in GoDaddy.

---

## Option A — GitHub Pages (preferred)

### 1. Create the repo and push

On a machine where you are logged into GitHub:

```bash
cd /path/to/frankiepalmeri-site   # or copy this folder from the box
git init
git add .
git commit -m "Initial Frankie Palmeri all-in-one site"
gh repo create frankiepalmeri-site --public --source=. --remote=origin --push
# or: create empty repo on github.com, then:
# git remote add origin https://github.com/YOUR_USER/frankiepalmeri-site.git
# git branch -M main
# git push -u origin main
```

### 2. Turn on Pages

1. GitHub → repo → **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)` → Save
4. Wait ~1–2 minutes. Preview URL will look like:  
   `https://YOUR_USER.github.io/frankiepalmeri-site/`

### 3. Custom domain

1. Still under **Settings → Pages → Custom domain**, enter: `frankiepalmeri.com`
2. Check **Enforce HTTPS** after DNS propagates (can take minutes–hours)
3. Optionally add `www.frankiepalmeri.com` as well (GitHub will show the records)

GitHub will show the exact DNS targets. Typical values (confirm in the Pages UI):

| Type  | Name | Value |
|-------|------|--------|
| **A** | `@` (apex) | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |
| **CNAME** | `www` | `YOUR_USER.github.io` |

(AAAA for IPv6 may also be listed — add those too if shown.)

---

## Option B — Netlify Drop (no git, fastest manual upload)

1. Zip the site folder (keep `index.html` at zip root, plus `merch/`):
   ```bash
   cd /workspace/frankiepalmeri-site
   zip -r ../frankiepalmeri-site.zip . -x '*.git*'
   ```
2. Go to https://app.netlify.com/drop (sign in free)
3. Drag `frankiepalmeri-site.zip` onto the page
4. You get a `*.netlify.app` URL immediately
5. **Domain management → Add custom domain** → `frankiepalmeri.com`  
   Netlify shows the DNS records to use (usually Netlify DNS or CNAME/`A`/`ALIAS` to Netlify).

---

## Option C — Cloudflare Pages

1. Sign in at https://dash.cloudflare.com → **Workers & Pages → Create → Pages**
2. Upload assets, or connect a GitHub repo
3. Build settings for this static folder: **no build command**, output directory `/` (or leave default for direct upload)
4. **Custom domains** → add `frankiepalmeri.com` (Cloudflare will guide DNS if the domain is on Cloudflare; if DNS stays on GoDaddy, use the CNAME/`A` values Cloudflare shows)

---

## GoDaddy DNS cutover (replace Big Cartel)

Do this **after** Pages/Netlify/Cloudflare shows the site live on a preview URL.

1. GoDaddy → **My Products → DNS** for `frankiepalmeri.com`
2. **Remove / stop pointing at Big Cartel**  
   Delete or edit any records that currently send traffic to Big Cartel (often a `CNAME` on `@` or `www` to something like `*.bigcartel.com`, or Big Cartel–specific `A`/`ALIAS` records).  
   Leave MX / email records alone unless you know you need to change them.
3. **Add the host’s records** from Option A, B, or C above.
4. Save. Propagation is often 5–60 minutes; can take up to 24–48h.
5. Test:
   - `https://frankiepalmeri.com` loads this site
   - Live player + chat work (Twitch embeds need the real hostname as `parent` — the page JS already passes `frankiepalmeri.com` / `www`)
   - Merch images load (`/merch/frankie-anime-head.png`)
   - Printify / PayPal / Amazon links still open correctly
6. Optional: keep `frankiepalmeri.bigcartel.com` as a backup shop URL; it is separate from the apex domain.

### Quick checklist

- [ ] Site live on host preview URL
- [ ] Custom domain added in host dashboard
- [ ] Old Big Cartel DNS records removed on GoDaddy
- [ ] New A / CNAME (and AAAA if listed) saved
- [ ] HTTPS enforced on host
- [ ] Spot-check Live, Merch, Amazon, Donate

---

## What stays external (by design)

- **Merch checkout:** Printify Pop-Up (`frankie-head-shop.printify.me`)
- **Donate:** PayPal (`paypal.me/frankiepalmeri`)
- **Amazon:** tag `frankiepalmer-20`
- **Stream/chat:** Twitch embeds for channel `frankiepalmeri`

No Big Cartel Platinum required for this setup.
