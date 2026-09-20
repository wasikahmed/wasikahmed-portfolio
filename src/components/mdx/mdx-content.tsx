import { MDXRemote } from 'next-mdx-remote-client/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { Callout } from './callout';
import { CodeCompare } from './code-compare';
import { Metric } from '@/components/motion/metric';
import { cn } from '@/lib/cn';

/**
 * The three MDX custom blocks meant for prose authoring (PLAN.md's fourth,
 * `<Architecture>`, stays a structured `project.architecture` field rather
 * than an MDX shortcode — see project-card.tsx's comment on why structured
 * diagram data doesn't fit well as free-form MDX children).
 */
const mdxComponents = { Callout, CodeCompare, Metric };

/**
 * Renders MDX source stored in Mongo into the real site typography — the
 * "live preview rendering in the real site components" the plan calls for
 * is this exact component, reused unchanged between the public pages and
 * the admin editor's preview pane.
 *
 * No className-per-element library (no @tailwindcss/typography): the
 * design system's type scale is small and specific enough that hand-styling
 * the handful of elements MDX actually produces keeps everything on the
 * same tokens as the rest of the site, rather than a second parallel scale.
 */
export async function MdxContent({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        'text-fg-muted [&_a]:text-accent flex flex-col gap-5 text-base leading-relaxed [&_a]:underline [&_a]:underline-offset-4',
        '[&_code]:bg-surface-3 [&_code]:text-accent [&_code]:rounded-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
        '[&_pre]:border-border-subtle [&_pre]:bg-surface-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:p-4 [&_pre]:text-xs [&_pre]:leading-relaxed',
        '[&_h2]:font-display [&_h2]:text-fg [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight',
        '[&_h3]:font-display [&_h3]:text-fg [&_h3]:mt-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight',
        '[&_strong]:text-fg [&_strong]:font-semibold',
        '[&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-2 [&_ul>li]:relative [&_ul>li]:pl-5',
        "[&_ul>li]:before:bg-accent [&_ul>li]:before:absolute [&_ul>li]:before:top-[0.6em] [&_ul>li]:before:left-0 [&_ul>li]:before:h-1 [&_ul>li]:before:w-1 [&_ul>li]:before:rounded-full [&_ul>li]:before:content-['']",
        '[&_ol]:marker:text-2xs [&_ol]:marker:text-accent [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5 [&_ol]:marker:font-mono',
        // Diagrams in post bodies: same card treatment as the rest of the
        // site, and width-bound so a wide SVG scales instead of overflowing.
        '[&_img]:border-border-subtle [&_img]:bg-surface-1 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-md [&_img]:border',
        '[&_blockquote]:border-border-strong [&_blockquote]:text-fg [&_blockquote]:border-l-2 [&_blockquote]:pl-5',
        className,
      )}
    >
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            rehypePlugins: [
              [rehypePrettyCode, { theme: 'github-dark-dimmed', keepBackground: false }],
            ],
          },
        }}
      />
    </div>
  );
}
