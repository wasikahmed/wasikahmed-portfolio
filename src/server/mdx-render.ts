// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { evaluate } from 'next-mdx-remote-client/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { mdxComponents } from '@/components/mdx/components';

/**
 * Renders MDX to a plain HTML string — used only by the admin preview
 * route (src/app/api/admin/mdx-preview). Deliberately separate from
 * `MdxContent` (src/components/mdx/mdx-content.tsx), which the public
 * pages use: Next.js's bundler refuses to build a Route Handler that
 * imports both `react-dom/server` and a component reachable from the
 * page/RSC module graph in the same module — "You're importing a
 * component that imports react-dom/server" — since mixing manual SSR
 * calls into the RSC graph can duplicate the React instance. Keeping this
 * renderer in `src/server/` (never imported by any page) sidesteps that
 * entirely.
 *
 * The public pages still render MDX through real JSX (`<MdxContent>`), so
 * `Metric`'s count-up interactivity hydrates normally there. This preview
 * is intentionally static — a live editor preview doesn't need to be
 * interactive, only accurate.
 */
export async function renderMdxToHtml(source: string): Promise<string> {
  const { content, error } = await evaluate({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark-dimmed', keepBackground: false }]],
      },
    },
  });

  if (error) throw error;

  // Dynamic import, not static: Next's bundler refuses to build a route
  // that statically imports react-dom/server alongside a component (any
  // of `mdxComponents` above) reachable from the page/RSC
  // graph — "You're importing a component that imports react-dom/server."
  // A runtime import isn't part of that static reachability walk.
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(content);
}
