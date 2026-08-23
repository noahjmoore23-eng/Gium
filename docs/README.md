# Personal site — Noah Moore

A single static page aimed at sales hiring managers. No build step, no
dependencies, no framework: three files and a few assets.

```
docs/
  index.html    the page, content included — editable spots are marked EDIT
  styles.css    all styling; the tokens at the top of the file control everything
  main.js       theme toggle, nav highlighting, footer year
  assets/
    resume.pdf  served by the "Résumé (PDF)" button — replace to update
    favicon.svg browser tab icon
    og.svg      source for the link-preview image
    og.png      what LinkedIn / iMessage / Slack actually show (they don't
                accept SVG). Edit og.svg, then re-export to og.png at 1200x630.
```

The content is real, taken from the résumé: the 2025 quota history, the East
Region ranking, Rookie of the Year, the RJ Young leadership programs, the
Lance Hocutt and Lawnscape roles, the Educate Mpunde fundraising, and the
degrees and certifications.

## Status: publishable as-is

There are no unfilled blanks left — nothing on the page is bracketed or fake.
You can deploy it today. The `EDIT:` comments in `index.html` mark places where
your own input would make it *better*, not places that are broken:

1. **Your buyer, deal size, and cycle length** at RJ Young. The page describes
   what RJ Young sells; it can't describe how *you* sell it. Specifics here beat
   a company description.
2. **Your LinkedIn URL** — appears in the hero, contact section, and footer.
   Search `linkedin.com/in/` and replace all three. This one is worth doing
   before you share the link.
3. **Target market** in the hero — naming one ("mid-market operations software")
   lands harder than the general version currently there.
4. **Your CRM**, in the Credentials list.
5. **The "How I sell" cards and the second About paragraph** are written in a
   plausible voice — they should be in yours, since an interviewer will quote
   them back at you.
6. **Your city.** The résumé header says Tuscaloosa; RJ Young put you in
   Chattanooga. The page says Chattanooga.
7. **Your phone number** is published in the contact section. Delete that button
   if you'd rather it not be public.

Search for `[` before publishing — anything still in square brackets is a
placeholder a hiring manager will notice.

## Viewing it locally

Open `docs/index.html` in a browser — it works straight off the filesystem. Or:

```bash
python3 -m http.server -d docs 8080   # then visit http://localhost:8080
```

## Publishing it

Plain static files, so any host will serve it.

**GitHub Pages** — this is why the folder is named `docs`: when Pages deploys
from a branch it only offers the repository root or `/docs`, no other folder.

Settings → Pages → Source: *Deploy from a branch* → pick the branch and the
`/docs` folder → Save. It goes live in about a minute at
`https://noahjmoore23-eng.github.io/Gium/`, and redeploys on every push.

**Netlify or Vercel** — drag the `docs/` folder onto the dashboard, or point a
project at this repo with `docs` as the publish directory and no build command.

**Worth doing: deploy Gium too.** The case study currently links to the GitHub
repo. A hiring manager clicking a *working demo* is worth far more than one
clicking source code. `npm run build` at the repo root emits `dist/`; drop that
folder on Netlify and put the URL in the "See the app" button.

**A custom domain** — `noahmoore.com` on a business card beats a `github.io`
URL, and both hosts above accept one in their settings.

## Two details worth keeping

- **It prints.** Ctrl-P produces a clean summary with the navigation and buttons
  stripped out — a decent leave-behind after an interview.
- **It has a dark mode.** It follows the visitor's system setting, and the
  toggle in the header overrides it.

## One caution

This repo is public, so `assets/resume.pdf` is publicly downloadable — including
the phone number and address on it. That's usually fine for a job search, but
it's a deliberate choice, not an accident. Remove the file and the button if you'd
rather hand the résumé out directly.
