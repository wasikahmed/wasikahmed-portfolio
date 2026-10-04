import type { Metadata } from 'next';
import Link from 'next/link';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Tag } from '@/components/ui/tag';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { getPosts, getSettings, getSiteCopy } from '@/server/queries';
import { pageTitle, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);
  const metadata = pageMetadata({
    title: pageTitle('Writing', settings.name),
    description: copy.writing.metaDescription,
    path: '/writing',
    siteName: settings.name,
  });
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { 'application/rss+xml': '/writing/feed.xml' } },
  };
}

/**
 * Editorial layout rather than cards (PLAN.md §2.7). Articles get generous
 * type and a hover-revealed excerpt; TIL notes sit in a denser secondary
 * column because they are shorter and scanned differently.
 */
export default async function WritingPage() {
  const [posts, copy] = await Promise.all([getPosts(), getSiteCopy()]);
  const articles = posts.filter((p) => p.kind === 'article');
  const tils = posts.filter((p) => p.kind === 'til');

  return (
    <Section density="spacious" className="pt-10 sm:pt-16">
      <Container>
        <Eyebrow rule>Writing</Eyebrow>
        <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold tracking-tighter text-balance">
          {copy.writing.heading}
        </h1>
        <p className="text-fg-muted mt-5 max-w-xl text-lg text-pretty">{copy.writing.intro}</p>

        <div
          className={cn(
            'mt-16 grid gap-16',
            tils.length > 0 && 'lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-20',
          )}
        >
          <div>
            <p className="text-2xs text-fg-subtle mb-2 font-mono tracking-widest uppercase">
              Articles
            </p>
            <ul>
              {articles.map((post, i) => (
                <Reveal as="li" key={post.slug} delay={i * 0.05}>
                  <Link
                    href={`/writing/${post.slug}`}
                    className="group border-border-subtle block border-b py-7"
                  >
                    <div className="text-2xs text-fg-subtle flex items-center gap-3 font-mono">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span aria-hidden>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="font-display duration-fast group-hover:text-accent mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-balance transition-colors">
                      {post.title}
                    </h2>
                    {/* Excerpt on demand, not by default. */}
                    <div className="duration-base ease-out-quint grid grid-rows-[0fr] transition-[grid-template-rows] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
                      <div className="overflow-hidden">
                        <p className="text-fg-muted max-w-xl pt-3 text-sm leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* No TIL column until there is a TIL — an empty labelled column
              reads as something failed to load. */}
          {tils.length > 0 ? (
            <aside>
              <p className="text-2xs text-fg-subtle mb-2 font-mono tracking-widest uppercase">
                TIL
              </p>
              <ul>
                {tils.map((post, i) => (
                  <Reveal as="li" key={post.slug} delay={i * 0.05}>
                    <Link
                      href={`/writing/${post.slug}`}
                      className="group border-border-subtle block border-b py-5"
                    >
                      <h2 className="text-fg duration-fast group-hover:text-accent text-sm leading-snug transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-2xs text-fg-subtle mt-1.5 font-mono">
                        {formatDate(post.date)} · {post.readTime}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
