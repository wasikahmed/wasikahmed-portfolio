import type { SiteCopy } from './types';

/**
 * Layout of the /admin/site-copy form — which field sits under which page,
 * what to call it, and where on the site it shows up. Data rather than JSX
 * so the form stays one loop, and adding a field to `SiteCopy` is one entry
 * here plus its default in seed-data/site-copy.ts.
 */

type GroupKey = keyof SiteCopy;

export interface SiteCopyField<G extends GroupKey = GroupKey> {
  key: keyof SiteCopy[G] & string;
  label: string;
  hint?: string;
  multiline?: boolean;
  /** Character ceiling the API enforces — shown as a live counter. */
  max?: number;
}

/** One page's worth of fields, as the form consumes it. */
export interface SiteCopyGroup {
  group: GroupKey;
  title: string;
  description: string;
  fields: (Omit<SiteCopyField, 'key'> & { key: string })[];
}

const META_HINT = 'What search engines and link previews show for this page. Up to 200 characters.';
const COUNT_HINT =
  '{Count} becomes the number of published projects in words ("Seven"), {count} the same in lowercase, {s} an "s" unless there is exactly one.';

/**
 * Checks each field key against its own group's keys at compile time (a
 * typo is a type error, not a silently empty input), then widens to the
 * plain shape the form loops over.
 */
function group<G extends GroupKey>(g: {
  group: G;
  title: string;
  description: string;
  fields: SiteCopyField<G>[];
}): SiteCopyGroup {
  return g;
}

export const SITE_COPY_GROUPS: SiteCopyGroup[] = [
  group({
    group: 'seo',
    title: 'Site-wide',
    description: 'Defaults for any page that does not set its own.',
    fields: [
      {
        key: 'siteDescription',
        label: 'Site description',
        hint: 'The fallback search and link-preview description. Up to 200 characters.',
        multiline: true,
        max: 200,
      },
    ],
  }),
  group({
    group: 'home',
    title: 'Home',
    description: 'Section headings on the home page, top to bottom.',
    fields: [
      { key: 'workHeading', label: 'Selected work heading', hint: COUNT_HINT },
      { key: 'impactHeading', label: 'Numbers heading' },
      { key: 'impactIntro', label: 'Numbers intro', multiline: true },
      { key: 'experienceHeading', label: 'Experience heading' },
      { key: 'approachHeading', label: 'Approach heading' },
      {
        key: 'approachIntro',
        label: 'Approach intro',
        hint: 'The steps themselves are edited in Settings → Approach.',
        multiline: true,
      },
      { key: 'shippedHeading', label: '“Shipped & public” heading' },
      {
        key: 'shippedMoreTitle',
        label: 'GitHub row title',
        hint: 'The last row of the shipped list, linking to your GitHub profile.',
      },
      { key: 'shippedMoreBody', label: 'GitHub row text' },
      { key: 'ctaHeading', label: 'Closing call-to-action heading' },
      { key: 'ctaBody', label: 'Closing call-to-action text', multiline: true },
    ],
  }),
  group({
    group: 'about',
    title: 'About',
    description: '/about — the story paragraphs themselves live in Settings.',
    fields: [
      {
        key: 'metaDescription',
        label: 'Meta description',
        hint: META_HINT,
        multiline: true,
        max: 200,
      },
      { key: 'heading', label: 'Page heading' },
      { key: 'skillsHeading', label: 'Skills heading' },
    ],
  }),
  group({
    group: 'work',
    title: 'Work',
    description: '/work — the project index.',
    fields: [
      {
        key: 'metaDescription',
        label: 'Meta description',
        hint: META_HINT,
        multiline: true,
        max: 200,
      },
      { key: 'heading', label: 'Page heading' },
      { key: 'intro', label: 'Intro', hint: COUNT_HINT, multiline: true },
    ],
  }),
  group({
    group: 'writing',
    title: 'Writing',
    description: '/writing — the article index.',
    fields: [
      {
        key: 'metaDescription',
        label: 'Meta description',
        hint: META_HINT,
        multiline: true,
        max: 200,
      },
      { key: 'heading', label: 'Page heading' },
      { key: 'intro', label: 'Intro', multiline: true },
    ],
  }),
  group({
    group: 'contact',
    title: 'Contact',
    description: '/contact.',
    fields: [
      {
        key: 'metaDescription',
        label: 'Meta description',
        hint: META_HINT,
        multiline: true,
        max: 200,
      },
      { key: 'heading', label: 'Page heading' },
      { key: 'intro', label: 'Intro', multiline: true },
    ],
  }),
  group({
    group: 'caseStudy',
    title: 'Case studies',
    description: 'Shared by every /work/[slug] page.',
    fields: [
      { key: 'ctaText', label: 'Closing line', hint: 'Next to the “Start a conversation” button.' },
    ],
  }),
  group({
    group: 'footer',
    title: 'Footer',
    description: 'Shown on every public page.',
    fields: [
      {
        key: 'unavailableText',
        label: 'Unavailable text',
        hint: 'Shown instead of your availability line when “Available for work” is off in Settings.',
      },
    ],
  }),
];
