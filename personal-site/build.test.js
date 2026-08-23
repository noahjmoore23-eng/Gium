import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, dateRange, printableTarget, renderPage } from './build.js';
import { content } from './content.js';

test('esc neutralises characters that would break out of markup', () => {
  assert.equal(esc('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(esc('a "quoted" & \'single\''), 'a &quot;quoted&quot; &amp; &#39;single&#39;');
  assert.equal(esc('plain text'), 'plain text');
});

test('esc renders null and undefined as empty, not as the words', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
});

test('esc escapes ampersands before the entities it introduces', () => {
  // A naive ordering would turn "&" into "&amp;" and then re-escape it.
  assert.equal(esc('&lt;'), '&amp;lt;');
});

test('dateRange collapses and omits missing ends', () => {
  assert.equal(dateRange('2022', 'Present'), '2022 — Present');
  assert.equal(dateRange('2022', '2022'), '2022');
  assert.equal(dateRange('2022', ''), '2022');
  assert.equal(dateRange('', '2024'), '2024');
  assert.equal(dateRange('', ''), '');
});

test('printableTarget strips scheme, www, mailto, and trailing slash', () => {
  assert.equal(printableTarget('mailto:a@b.com'), 'a@b.com');
  assert.equal(printableTarget('https://github.com/user'), 'github.com/user');
  assert.equal(printableTarget('https://www.example.com/'), 'example.com');
  assert.equal(printableTarget(null), '');
});

test('a hostile name cannot inject markup into the page', () => {
  const html = renderPage({
    ...content,
    name: '<img src=x onerror=alert(1)>',
    tagline: '" onload="alert(2)',
  });
  assert.ok(!html.includes('<img src=x'), 'raw tag leaked into output');
  assert.ok(!html.includes('onload="alert(2)"'), 'attribute broke out of its quotes');
  assert.ok(html.includes('&lt;img src=x'), 'escaped form missing');
});

test('structured data stays parseable JSON', () => {
  const html = renderPage(content);
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'no JSON-LD block emitted');
  const parsed = JSON.parse(match[1]);
  assert.equal(parsed['@type'], 'Person');
  assert.equal(parsed.name, content.name);
});

test('optional sections disappear rather than rendering empty headings', () => {
  const html = renderPage({ ...content, projects: [], education: [], skills: [] });
  assert.ok(!html.includes('id="projects"'));
  assert.ok(!html.includes('id="education"'));
  assert.ok(!html.includes('id="skills"'));
  assert.ok(html.includes('id="experience"'), 'remaining sections should still render');
});

test('every page declares one h1 and a language', () => {
  const html = renderPage(content);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.ok(html.includes('<html lang="en">'));
});
