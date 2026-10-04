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
export const mdxComponents = { Callout, CodeCompare, Metric, Figure, img: MdxImage };
