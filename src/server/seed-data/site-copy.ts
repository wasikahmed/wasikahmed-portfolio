import type { SiteCopy } from '@/lib/types';

/**
 * Defaults for the site-copy singleton — word for word what each component
 * hardcoded before this moved into the CMS, so deploying it changes nothing
 * on the page until someone edits a field.
 *
 * Not seeded into Mongo: `getSiteCopy()` merges whatever is stored over
 * these, field by field. That is what lets a field added here later show
 * up with its default on a database whose document predates it, instead of
 * rendering empty until someone re-saves the form.
 */
export const siteCopyDefaults: SiteCopy = {
  seo: {
    siteDescription: 'Software engineer building AI and automation systems.',
    homeTitle: 'Wasik Ahmed (Apon) — Software Engineer in Dhaka',
  },
  home: {
    workHeading: '{Count} system{s}, still in production.',
    impactHeading: 'The numbers, and where you can go and check them.',
    impactIntro:
      'A figure on its own is marketing. Each of these points at something public — a store listing, a published package, a test suite that runs on every push.',
    experienceHeading: "Where I've built.",
    approachHeading: 'How I actually work.',
    approachIntro:
      'The hardest part is rarely the code. It is understanding the problem precisely enough to know what to build, and then building it so somebody else can keep it running.',
    shippedHeading: 'Things you can open yourself.',
    shippedMoreTitle: 'Everything else',
    shippedMoreBody: 'Smaller projects and experiments, in public.',
    ctaHeading: 'Hiring, or just curious?',
    ctaBody:
      'I am open to software engineering roles, remote preferred, and to automation work alongside them. Tell me what you are building.',
  },
  about: {
    metaDescription:
      'Backend engineer in Dhaka building Django and TypeScript systems — live apps, offline-first desktop software, and automation.',
    heading: 'I build software that removes a problem.',
    skillsHeading: 'What I reach for.',
  },
  work: {
    metaDescription: 'Case studies: AI pipelines, schedulers, and internal systems in production.',
    heading: 'Systems that are still running.',
    intro:
      '{Count} project{s} in production, one of which you are reading. Every number below points at something you can go and check.',
  },
  writing: {
    metaDescription: 'Notes on AI systems, constraint solving, and shipping software that lasts.',
    heading: 'Things worth writing down.',
    intro: 'Mostly about the gap between a problem and the software that fixes it.',
  },
  contact: {
    metaDescription:
      'Get in touch about a software engineering role, or a project that needs building. Based in Dhaka, open to remote.',
    heading: 'Tell me what you are building.',
    intro:
      'Hiring, or have something that needs building? Either way, a couple of sentences is enough to start. If I am not the right fit I will say so plainly.',
  },
  caseStudy: {
    ctaText: 'Got a problem shaped like this one?',
  },
  docs: {
    metaDescription:
      'Reference for the REST API behind this portfolio’s admin CMS: authentication, Bearer tokens, permissions and every content endpoint.',
  },
  footer: {
    unavailableText: 'Not taking on new work right now.',
  },
  notFound: {
    heading: 'Nothing lives at this address.',
    body: 'The link may be old or mistyped. Everything that was here is still somewhere below.',
  },
};
