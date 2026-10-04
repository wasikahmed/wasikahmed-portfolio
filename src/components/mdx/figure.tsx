import { PROSE_IMAGE_SIZES, responsiveImage } from '@/lib/mdx-image';

type ImageProps = {
  src?: string;
  alt?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
};

function toNumber(value: number | string | undefined): number | undefined {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return n && Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Every image in a post or case-study body — Markdown's `![alt](url)` is
 * mapped here, and `<Figure>` renders through it. A plain `<img>` rather
 * than `next/image`: Cloudinary already does the resizing and format
 * negotiation (`responsiveImage`), so the optimiser would only add a
 * second pass over the same bytes. Visual treatment (border, card
 * surface) comes from `MdxContent`'s `[&_img]` rules, so a hand-written
 * `<img>` in MDX matches too.
 */
export function MdxImage({ src, alt = '', title, width, height }: ImageProps) {
  if (!src) return null;
  const w = toNumber(width);
  const h = toNumber(height);
  const { src: resolved, srcSet } = responsiveImage(src, w);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the comment above: Cloudinary is the optimiser.
    <img
      src={resolved}
      srcSet={srcSet}
      sizes={srcSet ? PROSE_IMAGE_SIZES : undefined}
      alt={alt}
      title={title}
      width={w}
      height={w && h ? h : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * `<Figure src alt caption width height />` — an image with an optional
 * caption. The editor's "Insert image" picker writes these, with the
 * dimensions from the media library so the page reserves the image's
 * space before it loads. A captioned image has to be its own block:
 * Markdown wraps `![]()` in a `<p>`, and a `<figure>` can't live inside one.
 */
export function Figure({ caption, ...image }: ImageProps & { caption?: string }) {
  return (
    <figure className="my-2 flex flex-col items-center gap-3">
      <MdxImage {...image} />
      {caption ? (
        <figcaption className="text-fg-subtle text-center text-sm text-pretty">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
