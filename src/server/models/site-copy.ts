import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Singleton — page copy edited at /admin/site-copy. Same fixed-id pattern
 * as Settings (models/settings.ts); `getSiteCopy()` in queries.ts is the
 * read path and merges this over `siteCopyDefaults`.
 *
 * Fields are plain optional Strings rather than `required`: a document
 * written before a field existed must still load, and the merge fills the
 * gap. The write path (schemas.ts's `siteCopySchema`) is what requires
 * every field to be non-empty.
 */
export const SITE_COPY_SINGLETON_ID = 'site-copy';

const group = (fields: string[]) =>
  new Schema(Object.fromEntries(fields.map((f) => [f, { type: String }])), { _id: false });

const siteCopySchema = new Schema(
  {
    _id: { type: String, default: SITE_COPY_SINGLETON_ID },
    seo: { type: group(['siteDescription']), default: undefined },
    home: {
      type: group([
        'workHeading',
        'impactHeading',
        'impactIntro',
        'experienceHeading',
        'approachHeading',
        'approachIntro',
        'shippedHeading',
        'shippedMoreTitle',
        'shippedMoreBody',
        'ctaHeading',
        'ctaBody',
      ]),
      default: undefined,
    },
    about: { type: group(['metaDescription', 'heading', 'skillsHeading']), default: undefined },
    work: { type: group(['metaDescription', 'heading', 'intro']), default: undefined },
    writing: { type: group(['metaDescription', 'heading', 'intro']), default: undefined },
    contact: { type: group(['metaDescription', 'heading', 'intro']), default: undefined },
    caseStudy: { type: group(['ctaText']), default: undefined },
    footer: { type: group(['unavailableText']), default: undefined },
    notFound: { type: group(['heading', 'body']), default: undefined },
  },
  { timestamps: true },
);

export type SiteCopyDocument = InferSchemaType<typeof siteCopySchema>;
export const SiteCopyModel =
  (mongoose.models.SiteCopy as Model<SiteCopyDocument>) ??
  mongoose.model<SiteCopyDocument>('SiteCopy', siteCopySchema);
