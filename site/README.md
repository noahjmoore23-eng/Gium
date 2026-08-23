# Personal site — Noah Moore

A single static page aimed at sales hiring managers. No build step, no
dependencies, no framework: three files and a few assets.

```
site/
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

## What still needs your input

Open `index.html` and search for `EDIT:` — there are eleven. In priority order:

1. **What you actually sell at RJ Young.** The one gap the résumé leaves. It's
   the first question a sales leader will ask: what's the product, who's the
   buyer, what's the average deal size and cycle. Right now it's a placeholder
   in the RJ Young timeline entry.
2. **Target market**, in the hero's second paragraph. "Mid-market operations
   software" beats "a growth opportunity."
3. **Your LinkedIn URL** — appears in the hero, the contact section, and the
   footer. Search for `linkedin.com/in/` and replace all three.
4. **Your city.** The résumé header says Tuscaloosa; RJ Young put you in
   Chattanooga. The page currently says Chattanooga.
5. **The "How I sell" cards and the second About paragraph.** These are written
   in a plausible voice, but they should be in *yours* — it's the section an
   interviewer will quote back at you, so it needs to sound like you on a
   ride-along, not like a website.
6. **Your CRM**, in the Credentials list — there's a `[Your CRM]` placeholder.
   Only list tools you'd be happy to be questioned about.
7. **Gium's live URL**, once it's deployed (see below).
8. **Your phone number** is published in the contact section. Delete that
   button if you'd rather not have it public.

Search for `[` before publishing — anything still in square brackets is a
placeholder a hiring manager will notice.

## Viewing it locally

Open `site/index.html` in a browser — it works straight off the filesystem. Or:

```bash
python3 -m http.server -d site 8080   # then visit http://localhost:8080
```

## Publishing it

Plain static files, so any host will serve it.

**GitHub Pages** — Settings → Pages, set Source to *Deploy from a branch*, pick
your branch and the `/site` folder. Publishes at
`https://noahjmoore23-eng.github.io/gium/`.

**Netlify or Vercel** — drag the `site/` folder onto the dashboard, or point a
project at this repo with `site` as the publish directory and no build command.

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
