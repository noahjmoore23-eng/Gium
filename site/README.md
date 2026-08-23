# Personal site — Noah Moore

A single static page aimed at sales hiring managers. No build step, no
dependencies, no framework: three files and two SVGs.

```
site/
  index.html    the page, content included — every editable spot is marked EDIT
  styles.css    all styling; the tokens at the top of the file control everything
  main.js       theme toggle, nav highlighting, footer year
  assets/
    favicon.svg browser tab icon
    og.svg      source for the link-preview image
    og.png      what LinkedIn / iMessage / Slack actually show (they don't
                accept SVG). Edit og.svg, then re-export it to og.png at
                1200x630 with any converter.
```

## Editing it

Open `index.html` and search for `EDIT:`. Every comment marks something that
needs your real information. The ones that matter most, in order:

1. **The four numbers** in the stats bar. Placeholder figures look worse than
   no figures — replace them or delete the section.
2. **Track record.** Three roles, each with bullets that contain a number. Lead
   with the result, not the responsibility.
3. **Headline and lede** in the hero. Say what you sell and to whom.
4. **LinkedIn URL** — it appears in three places (nav, hero, footer, contact).
5. **`assets/resume.pdf`** — drop your résumé in with exactly that filename and
   the download button starts working.
6. **The `og:image` URL** — it's absolute, so if you publish anywhere other
   than GitHub Pages, update the domain or link previews will show nothing.
7. **References.** Two real quotes. If you don't have them yet, delete the whole
   `#references` section rather than shipping brackets.

Anything still wrapped in `[square brackets]` is a placeholder that a hiring
manager will notice. Search for `[` before you publish.

## Viewing it locally

Open `site/index.html` in a browser — it works straight off the filesystem. Or
serve it:

```bash
python3 -m http.server -d site 8080   # then visit http://localhost:8080
```

## Publishing it

The page is plain static files, so any host will serve it.

**GitHub Pages** — in the repo's Settings → Pages, set Source to *Deploy from a
branch*, pick your branch and the `/site` folder. It publishes at
`https://noahjmoore23-eng.github.io/gium/`.

**Netlify or Vercel** — drag the `site/` folder onto their dashboard, or point
the project at this repo with `site` as the publish directory and no build
command.

**Your own domain** — both hosts above take a custom domain in their settings
once the site is live. `noahmoore.com` on a business card beats a
`github.io` URL.

## Two details worth keeping

- **It prints.** Ctrl-P produces a clean one-page summary with the navigation
  and buttons stripped out — handy to leave behind after an interview.
- **It has a dark mode.** It follows the visitor's system setting, and the
  toggle in the header overrides it.
