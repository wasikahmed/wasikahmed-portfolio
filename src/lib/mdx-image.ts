/**
 * Image helpers shared by the MDX image components (server-rendered) and
 * the admin editor's image picker (client) — so client-safe, no
 * `server-only` imports.
 */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// A transformation segment is comma-separated `x_value` params (`w_800`,
// `f_auto,q_auto`). The folder segments of a public id (`portfolio/…`) and
// the version segment (`v1712345678`) never take that shape.
const TRANSFORMATION_SEGMENT = /^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$/;

/** Widths offered in `srcset`. The widest covers a 2x screen at the prose column's width. */
export const IMAGE_WIDTHS = [640, 960, 1280, 1600] as const;

/**
 * What `<img sizes>` is for an image in a post or case-study body: those
 * columns cap at 68ch / 46rem, both under 48rem.
 */
export const PROSE_IMAGE_SIZES = '(min-width: 48rem) 48rem, 100vw';

/**
 * Rewrites a Cloudinary delivery URL to ask for a modern format, automatic
 * quality and at most `width` pixels wide — the media library stores the
 * original upload's URL, which is served byte-for-byte as uploaded
 * otherwise (a phone screenshot can be several MB of PNG). `c_limit` never
 * upscales. Any URL that isn't a plain Cloudinary upload, or that already
 * carries a transformation the author chose, comes back unchanged.
 */
export function optimizedImageUrl(url: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;
  const [, prefix, rest] = match;
  if (TRANSFORMATION_SEGMENT.test(rest.split('/')[0])) return url;
  return `${prefix}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

/**
 * `src`/`srcSet` for an image. A `srcset` is only emitted when the
 * original width is known: `w` descriptors tell the browser how wide each
 * candidate is, and `c_limit` silently caps a small original below the
 * width claimed — so a guessed descriptor would render a 400px screenshot
 * at a fraction of its real size.
 */
export function responsiveImage(
  url: string,
  originalWidth?: number,
): { src: string; srcSet?: string } {
  const largest = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  const src = optimizedImageUrl(url, Math.min(originalWidth ?? largest, largest));
  if (!originalWidth || src === url) return { src };

  const widths: number[] = IMAGE_WIDTHS.filter((w) => w < originalWidth);
  if (originalWidth <= largest) widths.push(originalWidth);
  if (widths.length < 2) return { src };
  return {
    src,
    srcSet: widths.map((w) => `${optimizedImageUrl(url, w)} ${w}w`).join(', '),
  };
}

/**
 * One JSX attribute as MDX source. A plain string literal where that is
 * possible — it is what someone editing the body by hand expects to read
 * — and a JS expression when the value contains a double quote, which an
 * MDX string attribute has no way to escape.
 */
function jsxAttribute(name: string, value: string): string {
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
}

/**
 * The `<Figure>` snippet the editor's image picker inserts. Dimensions
 * come along so the page reserves the image's space before it loads and
 * can offer a `srcset` (see `responsiveImage`).
 */
export function figureSnippet(image: {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}): string {
  const attributes = [jsxAttribute('src', image.url), jsxAttribute('alt', image.alt.trim())];
  if (image.width && image.height) {
    attributes.push(`width={${image.width}}`, `height={${image.height}}`);
  }
  const caption = image.caption?.trim();
  if (caption) attributes.push(jsxAttribute('caption', caption));
  return `<Figure ${attributes.join(' ')} />`;
}
