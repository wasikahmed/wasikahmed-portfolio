import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Résumé history — every uploaded PDF, kept, with one marked current.
 *
 * The bytes live in Mongo rather than on Cloudinary like the media
 * library. A CV is ~200 KB, far under the 16 MB document limit, and
 * Cloudinary refuses to deliver PDFs on free accounts until a console
 * setting is flipped — a public /resume that 401s depending on a
 * third-party toggle is the wrong failure mode for the one file an
 * application links to. Keeping it here also puts it inside the nightly
 * mongodump with everything else.
 *
 * `data` is `select: false` so list queries never drag every PDF ever
 * uploaded over the wire; only the two streaming routes ask for it.
 */
const resumeVersionSchema = new Schema(
  {
    label: { type: String, required: true },
    notes: { type: String },
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
    // Lets /resume answer conditional requests with a 304 and makes an
    // accidental re-upload of the same file recognisable in the list.
    sha256: { type: String, required: true },
    data: { type: Buffer, required: true, select: false },
    isCurrent: { type: Boolean, default: false },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true },
);

// At most one current version, enforced by the database rather than by
// every route remembering to — the routes clear the old flag first, and
// this turns a race between two "make current" clicks into a clean error
// instead of two PDFs both claiming to be live.
resumeVersionSchema.index(
  { isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true } },
);

export type ResumeVersionDocument = InferSchemaType<typeof resumeVersionSchema>;
export const ResumeVersionModel =
  (mongoose.models.ResumeVersion as Model<ResumeVersionDocument>) ??
  mongoose.model<ResumeVersionDocument>('ResumeVersion', resumeVersionSchema);
