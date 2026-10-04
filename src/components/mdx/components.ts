import { createElement, type ComponentProps } from 'react';
import { Callout } from './callout';
import { CodeCompare } from './code-compare';
import { Figure, MdxImage } from './figure';
import { Metric } from '@/components/motion/metric';

/**
 * The components MDX bodies can use, shared by the public renderer
 * (`MdxContent`) and the admin preview (`src/server/mdx-render.ts`) so the
 * two can't drift — a component registered in only one renders on the
 * site but fails in the preview, or the other way round.
 *
 * The custom blocks meant for prose authoring (PLAN.md's fourth,
 * `<Architecture>`, stays a structured `project.architecture` field rather
 * than an MDX shortcode — see project-card.tsx's comment on why structured
 * diagram data doesn't fit well as free-form MDX children), plus `img`,
 * which re-routes Markdown's `![alt](url)` through the optimised renderer.
 */
/**
 * A `#` heading in a body renders as an h2. The page around every body
 * already has its h1 (the post or project title), and a second one is
 * both an accessibility fault and a mixed signal to search engines about
 * what the page is. Styled by MdxContent's `[&_h2]` rules like any other.
 */
function BodyHeading(props: ComponentProps<'h1'>) {
  return createElement('h2', props);
}

export const mdxComponents = {
  Callout,
  CodeCompare,
  Metric,
  Figure,
  img: MdxImage,
  h1: BodyHeading,
};
