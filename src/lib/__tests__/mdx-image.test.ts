import { describe, expect, it } from 'vitest';
import { figureSnippet, optimizedImageUrl, responsiveImage } from '@/lib/mdx-image';

const UPLOAD =
  'https://res.cloudinary.com/demo/image/upload/v1712345678/portfolio/admin/media/abc.png';

describe('optimizedImageUrl', () => {
  it('inserts format, quality and a width cap after /upload/', () => {
    expect(optimizedImageUrl(UPLOAD, 960)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_960/v1712345678/portfolio/admin/media/abc.png',
    );
  });

  it('works on a URL without a version segment', () => {
    expect(
      optimizedImageUrl('https://res.cloudinary.com/demo/image/upload/folder/a.jpg', 640),
    ).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/folder/a.jpg');
  });

  it('leaves a URL that already carries a transformation alone', () => {
    const transformed = 'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/v1/a.jpg';
    expect(optimizedImageUrl(transformed, 960)).toBe(transformed);
  });

  it('leaves non-Cloudinary URLs alone', () => {
    expect(optimizedImageUrl('https://example.com/a.png', 960)).toBe('https://example.com/a.png');
    expect(optimizedImageUrl('/local.png', 960)).toBe('/local.png');
  });
});

describe('responsiveImage', () => {
  it('serves a single capped URL when the original width is unknown', () => {
    expect(responsiveImage(UPLOAD)).toEqual({ src: optimizedImageUrl(UPLOAD, 1600) });
  });

  it('never claims a srcset width larger than the original', () => {
    const { src, srcSet } = responsiveImage(UPLOAD, 1100);
    expect(src).toBe(optimizedImageUrl(UPLOAD, 1100));
    expect(srcSet).toBe(
      [640, 960, 1100].map((w) => `${optimizedImageUrl(UPLOAD, w)} ${w}w`).join(', '),
    );
  });

  it('caps a large original at the widest candidate', () => {
    const { src, srcSet } = responsiveImage(UPLOAD, 4000);
    expect(src).toBe(optimizedImageUrl(UPLOAD, 1600));
    expect(srcSet?.split(', ')).toHaveLength(4);
  });

  it('skips srcset for a small image or a non-Cloudinary URL', () => {
    expect(responsiveImage(UPLOAD, 500).srcSet).toBeUndefined();
    expect(responsiveImage('https://example.com/a.png', 3000)).toEqual({
      src: 'https://example.com/a.png',
    });
  });
});

describe('figureSnippet', () => {
  it('writes plain string attributes and dimensions', () => {
    expect(figureSnippet({ url: UPLOAD, alt: ' A chart ', width: 1200, height: 800 })).toBe(
      `<Figure src="${UPLOAD}" alt="A chart" width={1200} height={800} />`,
    );
  });

  it('adds a caption only when one is given', () => {
    expect(figureSnippet({ url: UPLOAD, alt: 'x', caption: '  ' })).toBe(
      `<Figure src="${UPLOAD}" alt="x" />`,
    );
    expect(figureSnippet({ url: UPLOAD, alt: 'x', caption: 'Before and after' })).toContain(
      'caption="Before and after"',
    );
  });

  it('falls back to an expression for a value containing a double quote', () => {
    expect(figureSnippet({ url: UPLOAD, alt: 'The "live" badge' })).toContain(
      'alt={"The \\"live\\" badge"}',
    );
  });
});
