# Personal site — working notes

The site lives in `docs/` and is published by GitHub Pages. This file is
deliberately **outside** `docs/` so it is not served with the site.

```
docs/
  index.html    the page — content included
  styles.css    all styling; the tokens at the top of the file control everything
  main.js       theme toggle, nav highlighting, footer year
  404.html      shown on a mistyped URL
  .nojekyll     tells Pages to copy the files verbatim
  assets/
    resume.pdf  served by the "Résumé (PDF)" button
    favicon.svg browser tab icon
    og.png      what LinkedIn / iMessage / Slack show. Its source is
                ../assets-src/og.svg, kept outside docs/ so it is not served:
                every SVG under docs/ is a same-origin script-execution surface
                if one ever contains script, and this one held a second public
                copy of the email address for no benefit. Re-export at 1200x630
                and LOOK AT THE RESULT before publishing — a failed export
                produces a valid-but-blank PNG that scrapers accept and render
                as a white box.
```

Every fact on the page comes from the résumé. Nothing is invented and nothing is
bracketed — the site is publishable as it stands.

## What would make it stronger

These need information only Noah has. They are improvements, not defects.

1. **What you sell, to whom, at what size.** The page says RJ Young sells office
   technology and managed services. It does not say who you sell to (office
   manager? IT director? CFO?), your average deal size, or your typical cycle
   length. A sales leader asks all three in the first five minutes.

2. **Denominators.** "#12 company-wide", "third in the East Region", and
   "one of 33" all lack the "out of how many". Without them, 456% invites the
   guess that the quota was small — which is the opposite of the intended read.

3. **Something from 2026.** The most recent fact on the page is the January 2026
   promotion. It is now well into the year, and silence about the current year
   is read as bad news whether or not it is.

4. **Why you are looking.** Rookie of the Year, four quarters over quota, and a
   promotion — then a job search. The obvious question has no answer on the page.
   One honest line closes it.

5. **Your CRM.** Salesforce, HubSpot, Sales Navigator — whatever you actually
   use. Its absence is conspicuous on an AE's site. Only list what you would be
   happy to be questioned about.

6. **The Approach cards and the second About paragraph** are written in a
   reasonable voice but not yours. An interviewer may quote them back at you, so
   they should say how you actually run a deal.

7. **A photo of you.** The page has none. For a site whose whole job is getting a
   person to reply to a person, a face helps.

## Decisions already made, worth revisiting

- **Your phone number is published** (contact section, `tel:` link). Machine
  readable, so expect some scraping. Delete that button to undo.
- **The résumé PDF is public**, including its full text. Normal for a job search;
  worth being a deliberate choice.
- **The page publishes your employer's internal quota and ranking data** while
  you still work there. Common on personal sites, but RJ Young can read it.

## Running it locally

Open `docs/index.html` in a browser, or:

```bash
python3 -m http.server -d docs 8080
```

## Publishing

**GitHub Pages** — Settings → Pages → Source: *Deploy from a branch* → pick the
branch and the `/docs` folder. Pages only offers the repo root or `/docs`, which
is why the folder is named that. Live at `https://noahjmoore23-eng.github.io/Gium/`.

> **Before deleting a branch:** Pages is currently publishing from
> `claude/personal-marketing-website-lm49hw`. If that branch is merged and
> deleted, **the live site goes down instantly and silently.** Repoint
> Settings → Pages at the surviving branch first.

**Custom domain** — add A records for `@` at your registrar pointing to
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a
CNAME for `www` → `noahjmoore23-eng.github.io`. Then enter the domain in
Settings → Pages. GitHub writes `docs/CNAME`; leave that file alone.

When the domain is attached, update these in `docs/index.html` or search engines
and link previews will keep pointing at the old address:

```html
<link rel="canonical" href="https://YOURDOMAIN/" />
<meta property="og:url" content="https://YOURDOMAIN/" />
<meta property="og:image" content="https://YOURDOMAIN/assets/og.png" />
```

Also change the three `/Gium/` paths in `docs/404.html` to `/`.

## Two details worth keeping

- **It prints.** Ctrl-P gives a clean one-pager with the navigation and buttons
  stripped — a decent interview leave-behind.
- **It has a dark mode**, following the visitor's system setting, with a toggle.

## After editing

GitHub Pages caches for about 10 minutes. If a change does not appear, hard
refresh (Cmd/Ctrl-Shift-R) before assuming the deploy failed.
