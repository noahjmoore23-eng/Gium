/**
 * Everything on the site comes from this file. It is the only file you need to
 * edit to keep the site current — `npm run build` regenerates the page from it.
 *
 * Anything left as "Add ..." is a placeholder waiting for your real details.
 */

export const content = {
  // ---------------------------------------------------------------- identity
  name: 'Noah Moore',

  /** One line under your name. What you do, not a job title. */
  tagline: 'Add a one-line description of what you do',

  location: 'Add your city',
  email: 'noahjmoore23@gmail.com',

  /**
   * Shown as buttons in the header. Drop any you do not want.
   * `label` is what people see; `url` is where it goes.
   */
  links: [
    { label: 'GitHub', url: 'https://github.com/noahjmoore23-eng' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-handle' },
  ],

  /**
   * A downloadable PDF, if you want one. The site prints to a clean PDF on its
   * own (Ctrl/Cmd-P), so this is optional. Set to null to hide the button.
   */
  resumePdf: null,

  // ------------------------------------------------------------------- about
  /** Each string becomes its own paragraph. Two or three is plenty. */
  about: [
    'Add a paragraph about who you are and what you work on. Write it the way you would explain your work to someone at a dinner party — plainly, without job-description language.',
    'Add a second paragraph about what you are looking for, what you care about, or what you do outside work. This is the part people actually remember.',
  ],

  // -------------------------------------------------------------- experience
  /**
   * Most recent first. Use `end: 'Present'` for your current role.
   * `highlights` are the bullets — lead with the outcome, not the task.
   */
  experience: [
    {
      role: 'Add your role',
      org: 'Add your employer',
      location: 'City, State',
      start: '2024',
      end: 'Present',
      summary: 'One sentence on the scope of the role — team size, what you owned, what the org does.',
      highlights: [
        'Add an accomplishment. Lead with the result and include a number where you have one.',
        'Add another. Concrete beats comprehensive — three sharp bullets beat eight vague ones.',
      ],
    },
    {
      role: 'Add a previous role',
      org: 'Add that employer',
      location: 'City, State',
      start: '2022',
      end: '2024',
      summary: 'One sentence of context.',
      highlights: ['Add an accomplishment from this role.'],
    },
  ],

  // ---------------------------------------------------------------- projects
  /** Things you built. `url` and `tags` are both optional. */
  projects: [
    {
      name: 'Gium',
      blurb:
        'Estimating and dispatch for moving companies. A cube-sheet survey turns a room-by-room inventory into crew size, truck, hours, and a priced quote; a week board catches double-booked crews and trucks before they cost a job.',
      url: 'https://github.com/noahjmoore23-eng/Gium',
      tags: ['TypeScript', 'React', 'Vite'],
    },
    {
      name: 'Add a project',
      blurb:
        'A sentence or two on what it does and why you built it. Link it if it is public.',
      url: null,
      tags: ['Add', 'Some', 'Tags'],
    },
  ],

  // ------------------------------------------------------------------ skills
  /** Grouped so the list stays readable. Drop groups that do not apply to you. */
  skills: [
    { group: 'Languages', items: ['Add', 'Your', 'Languages'] },
    { group: 'Tools', items: ['Add', 'Your', 'Tools'] },
    { group: 'Practices', items: ['Add', 'What', 'You Do Well'] },
  ],

  // --------------------------------------------------------------- education
  education: [
    {
      credential: 'Add your degree or credential',
      org: 'Add the school',
      year: '2022',
      detail: 'Optional — honors, focus, relevant coursework.',
    },
  ],

  // -------------------------------------------------------------------- meta
  meta: {
    /** Your live URL once deployed. Used for social previews and canonical links. */
    siteUrl: 'https://noahjmoore23-eng.github.io/',
    /** The blurb search engines and link previews show. Keep it under ~160 chars. */
    description: 'Add a one-sentence description of yourself for search results.',
    /** Accent colour for the site. Any CSS colour works. */
    accent: '#2f6f52',
  },
};
