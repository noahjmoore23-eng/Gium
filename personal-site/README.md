# Personal site

A resume and about page. Static HTML, no framework, no dependencies, no build
tooling beyond Node itself.

## The one file you edit

Everything on the page — your name, bio, jobs, projects, skills, education,
links — lives in [`content.js`](./content.js). Edit that, run the build, done.
You never have to touch HTML or CSS to keep the site current.

```bash
npm run build     # regenerate dist/ from content.js
npm run serve     # build, then serve at http://127.0.0.1:5050
npm test          # 9 tests over the rendering helpers
```

There is no `npm install` step. There are no dependencies to install.

## What's here

```
content.js           Your content. The only file you need to edit.
build.js             Renders content.js -> dist/index.html
build.test.js        Tests for escaping, date ranges, and section rendering
assets/styles.css    All styling, including the print layout
assets/theme.js      Light/dark toggle (progressive enhancement)
assets/favicon.svg   Tab icon
dist/                Build output — this is what you deploy
```

## Design decisions worth knowing

**It prints as a resume.** Ctrl/Cmd-P produces a clean, black-on-white,
two-column document — not a screenshot of a website. The theme toggle and
navigation drop out, link pills become a plain contact line showing real URLs
(the word "GitHub" is useless on paper), and roles are kept from splitting
across pages. One source of truth serves both the web page and your PDF.

**Zero external requests.** No font CDN, no analytics, no trackers. The page
renders instantly on a bad connection, works on networks that block third-party
hosts, and hands no visitor data to anyone. Typography uses high-quality system
faces. If you'd rather have a custom typeface, self-host the font files in
`assets/` and add an `@font-face` rule — don't reintroduce a remote font host.

**Real HTML, not client-side rendering.** Recruiters' tools, search engines, and
link previews all read the markup directly. The page is fully readable with
JavaScript disabled; the only script is the theme toggle, which reveals itself
only once it has loaded.

**Content is escaped.** Anything you type in `content.js` is HTML-escaped before
it reaches the page, so an ampersand in a company name or a `<` in a project
description can't break the layout. Tests cover this.

**Accessible by default.** One `h1`, semantic landmarks, a skip link, visible
focus rings, labelled sections, and `prefers-reduced-motion` respected.

## Filling it in

Open `content.js`. Every placeholder starts with "Add" so you can find what's
left with a search. A few notes:

- **`tagline`** — what you do, not a job title. This is the line people read.
- **`about`** — each string is a paragraph. Two or three. Write like a person.
- **`experience[].highlights`** — lead with the outcome, include a number when
  you have one. Three sharp bullets beat eight vague ones.
- **`links`** — delete any you don't use; add anything you do.
- **`meta.accent`** — one colour drives the whole palette. Try it.

Sections you leave empty disappear rather than rendering an empty heading, so
you can delete `projects` or `education` entirely if they don't apply.

## Deploying

`dist/` is a plain static directory — any host will serve it. Drag it into
Netlify or Cloudflare Pages and you're live.

For GitHub Pages, [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml)
builds and publishes it. It's set to **manual trigger only** — nothing goes
public until you run it from the Actions tab and enable Pages in repository
settings. To publish automatically on every push, uncomment the `push:` trigger
at the top of that file.

### A note on where this lives

This site currently sits inside the Gium repository, which is otherwise a
moving-company application. That works, but a personal site is usually happier
in its own repo — and GitHub gives you a free vanity URL for one named
`<username>.github.io`. Moving it is just copying this directory; nothing here
depends on anything outside it.
