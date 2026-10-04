import { describe, expect, it } from 'vitest';
import { renderMdxToHtml } from '@/server/mdx-render';

const UPLOAD = 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/admin/media/abc.png';

describe('renderMdxToHtml images', () => {
  it('routes Markdown images through the optimised, lazy renderer', async () => {
    const html = await renderMdxToHtml(`![A chart](${UPLOAD})`);
    expect(html).toContain(
      'src="https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1600/v1/',
    );
    expect(html).toContain('alt="A chart"');
    expect(html).toContain('loading="lazy"');
    // No original width, so no srcset — see responsiveImage().
    expect(html).not.toContain('srcSet');
    expect(html).not.toContain('srcset');
  });

  it('renders <Figure> with dimensions, a srcset and its caption', async () => {
    const html = await renderMdxToHtml(
      `<Figure src="${UPLOAD}" alt="Polling vs broadcasting" width={2400} height={1200} caption="Before and after" />`,
    );
    expect(html).toMatch(/^<figure/);
    expect(html).toContain('width="2400"');
    expect(html).toContain('height="1200"');
    expect(html).toContain('srcSet="');
    expect(html).toContain('<figcaption');
    expect(html).toContain('Before and after');
  });

  it('omits the caption element when there is none', async () => {
    const html = await renderMdxToHtml(`<Figure src="${UPLOAD}" alt="x" />`);
    expect(html).not.toContain('figcaption');
  });
});
