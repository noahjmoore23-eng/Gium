/**
 * Renders content.js into a static index.html.
 *
 * Deliberately dependency-free: a resume site should still build in five years
 * without a lockfile archaeology expedition. Run it with `node build.js`.
 */

import { mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { content } from './content.js';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, 'dist');

/** Escapes text destined for element content or a quoted attribute. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders a list of items with a mapper, joining without separators. */
function map(items, fn) {
  return (items ?? []).map(fn).join('');
}

/** A date range like "2022 — Present", collapsing when both ends match. */
export function dateRange(start, end) {
  if (start && end) return start === end ? start : `${start} — ${end}`;
  return start || end || '';
}

/**
 * The destination as a reader would write it down: an email address, or a URL
 * without its scheme. Printed resumes need this — the word "GitHub" on paper
 * tells nobody where to actually look.
 */
export function printableTarget(url) {
  return String(url ?? '')
    .replace(/^mailto:/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

/** Marks a URL as external so it opens safely in a new tab. */
function externalAttrs(url) {
  return /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function renderHeader(c) {
  const links = [
    ...(c.email ? [{ label: 'Email', url: `mailto:${c.email}` }] : []),
    ...(c.links ?? []),
    ...(c.resumePdf ? [{ label: 'Resume (PDF)', url: c.resumePdf }] : []),
  ];

  return `
    <header class="masthead">
      <div class="masthead-inner">
        <div class="identity">
          <h1>${esc(c.name)}</h1>
          <p class="tagline">${esc(c.tagline)}</p>
          ${c.location ? `<p class="location">${esc(c.location)}</p>` : ''}
        </div>
        <nav class="links" aria-label="Contact and profiles">
          ${map(
            links,
            (link) =>
              `<a class="link-btn" href="${esc(link.url)}" data-print="${esc(printableTarget(link.url))}"${externalAttrs(link.url)}><span class="link-label">${esc(link.label)}</span></a>`,
          )}
        </nav>
      </div>
    </header>`;
}

function renderAbout(c) {
  if (!c.about?.length) return '';
  return `
    <section id="about" aria-labelledby="about-heading">
      <h2 id="about-heading">About</h2>
      <div class="prose">
        ${map(c.about, (para) => `<p>${esc(para)}</p>`)}
      </div>
    </section>`;
}

function renderExperience(c) {
  if (!c.experience?.length) return '';
  return `
    <section id="experience" aria-labelledby="experience-heading">
      <h2 id="experience-heading">Experience</h2>
      <ol class="timeline">
        ${map(
          c.experience,
          (job) => `
          <li class="entry">
            <div class="entry-head">
              <h3>${esc(job.role)}</h3>
              <p class="entry-org">
                ${esc(job.org)}${job.location ? ` <span class="sep">·</span> ${esc(job.location)}` : ''}
              </p>
            </div>
            <p class="entry-dates">${esc(dateRange(job.start, job.end))}</p>
            <div class="entry-body">
              ${job.summary ? `<p class="entry-summary">${esc(job.summary)}</p>` : ''}
              ${
                job.highlights?.length
                  ? `<ul class="highlights">${map(job.highlights, (h) => `<li>${esc(h)}</li>`)}</ul>`
                  : ''
              }
            </div>
          </li>`,
        )}
      </ol>
    </section>`;
}

function renderProjects(c) {
  if (!c.projects?.length) return '';
  return `
    <section id="projects" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects</h2>
      <ul class="cards">
        ${map(
          c.projects,
          (project) => `
          <li class="card">
            <h3>
              ${
                project.url
                  ? `<a href="${esc(project.url)}" data-print="${esc(printableTarget(project.url))}"${externalAttrs(project.url)}>${esc(project.name)}</a>`
                  : esc(project.name)
              }
            </h3>
            <p>${esc(project.blurb)}</p>
            ${
              project.tags?.length
                ? `<ul class="tags">${map(project.tags, (tag) => `<li>${esc(tag)}</li>`)}</ul>`
                : ''
            }
          </li>`,
        )}
      </ul>
    </section>`;
}

function renderSkills(c) {
  if (!c.skills?.length) return '';
  return `
    <section id="skills" aria-labelledby="skills-heading">
      <h2 id="skills-heading">Skills</h2>
      <dl class="skills">
        ${map(
          c.skills,
          (group) => `
          <div class="skill-group">
            <dt>${esc(group.group)}</dt>
            <dd>${map(group.items, (item) => `<span class="chip">${esc(item)}</span>`)}</dd>
          </div>`,
        )}
      </dl>
    </section>`;
}

function renderEducation(c) {
  if (!c.education?.length) return '';
  return `
    <section id="education" aria-labelledby="education-heading">
      <h2 id="education-heading">Education</h2>
      <ol class="timeline">
        ${map(
          c.education,
          (item) => `
          <li class="entry">
            <div class="entry-head">
              <h3>${esc(item.credential)}</h3>
              <p class="entry-org">${esc(item.org)}</p>
            </div>
            <p class="entry-dates">${esc(item.year)}</p>
            <div class="entry-body">
              ${item.detail ? `<p class="entry-summary">${esc(item.detail)}</p>` : ''}
            </div>
          </li>`,
        )}
      </ol>
    </section>`;
}

/** Schema.org data, so search results and previews identify the page correctly. */
function renderStructuredData(c) {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.name,
    description: c.meta?.description,
    email: c.email ? `mailto:${c.email}` : undefined,
    url: c.meta?.siteUrl,
    sameAs: (c.links ?? []).map((link) => link.url).filter((url) => /^https?:\/\//i.test(url)),
  };
  // JSON inside a <script> must not contain a literal "</script>" sequence.
  const json = JSON.stringify(person, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderPage(c) {
  const title = `${c.name} — ${c.tagline}`;
  const description = c.meta?.description ?? '';
  const url = c.meta?.siteUrl ?? '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${url ? `<link rel="canonical" href="${esc(url)}">` : ''}

<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${url ? `<meta property="og:url" content="${esc(url)}">` : ''}
<meta name="twitter:card" content="summary">

<link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="./assets/styles.css">
<style>:root { --accent: ${esc(c.meta?.accent ?? '#2f6f52')}; }</style>

<!-- Applied before paint so a chosen theme never flashes the wrong colours. -->
<script>
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {}
</script>
${renderStructuredData(c)}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<button id="theme-toggle" class="theme-toggle" type="button" hidden aria-live="polite">
  <span aria-hidden="true">◐</span> <span class="theme-label">Theme</span>
</button>

${renderHeader(c)}

<main id="main">
${renderAbout(c)}
${renderExperience(c)}
${renderProjects(c)}
${renderSkills(c)}
${renderEducation(c)}
</main>

<footer>
  <p>
    ${esc(c.name)}${c.email ? ` <span class="sep">·</span> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
  </p>
  <p class="print-hint">Press Ctrl/Cmd-P to save this page as a resume PDF.</p>
</footer>

<script src="./assets/theme.js" defer></script>
</body>
</html>
`;
}

async function build() {
  await mkdir(join(outDir, 'assets'), { recursive: true });

  await writeFile(join(outDir, 'index.html'), renderPage(content), 'utf8');

  const assets = await readdir(join(root, 'assets'));
  for (const file of assets) {
    await copyFile(join(root, 'assets', file), join(outDir, 'assets', file));
  }

  // GitHub Pages otherwise strips directories whose names begin with an underscore.
  await writeFile(join(outDir, '.nojekyll'), '', 'utf8');

  console.log(`Built ${content.name}'s site -> ${outDir}`);
  console.log(`  ${content.experience?.length ?? 0} roles, ${content.projects?.length ?? 0} projects, ${assets.length} assets`);
}

// Only build when executed directly — importing this file for tests must not
// write to disk.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
