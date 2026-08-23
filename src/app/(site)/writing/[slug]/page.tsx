import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section, Container } from '@/components/ui/section';
import { Tag } from '@/components/ui/tag';
import { ArrowRight } from '@/components/ui/button';
import { ReadingProgress } from '@/components/layout/reading-progress';
import { MdxContent } from '@/components/mdx/mdx-content';
import { formatDate } from '@/lib/format';
import { getPostSlugs, getPost, getAdjacentPosts } from '@/server/queries';

export async function generateStaticParams() {
  // Best-effort pre-render: `next build` runs this with no guarantee the
  // database is reachable (it never is inside the Docker build stage — no
  // network access to a real Mongo, by design). `dynamicParams` defaults
  // to true, so any slug missing from this list still renders correctly
  // on its first request and is cached from there; an empty array here
  // just means every slug takes that path instead of only the new ones.
  try {
    const slugs = await getPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title} — Wasik Ahmed`, description: post.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { next } = await getAdjacentPosts(slug);

  return (
    <>
      <ReadingProgress />

      <Section density="compact" className="pt-10 sm:pt-14">
        <Container size="prose">
          <Link
            href="/writing"
            className="text-2xs text-fg-muted duration-fast hover:text-accent inline-flex items-center gap-2 font-mono transition-colors"
          >
            <span aria-hidden>←</span> All writing
          </Link>

          <div className="text-2xs text-fg-subtle mt-8 flex flex-wrap items-center gap-3 font-mono">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
            {post.kind === 'til' ? (
              <>
                <span aria-hidden>·</span>
                <span className="text-accent">TIL</span>
              </>
            ) : null}
          </div>

          <h1 className="font-display mt-4 text-4xl font-bold tracking-tighter text-balance">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </Container>
      </Section>

      <Section density="compact">
        <Container size="prose">
          <MdxContent source={post.bodyMdx} className="text-lg" />
        </Container>
      </Section>

      {next ? (
        <Section bordered density="compact">
          <Container size="prose">
            <Link href={`/writing/${next.slug}`} className="group block">
              <p className="text-2xs text-fg-subtle font-mono tracking-widest uppercase">
                Read next
              </p>
              <h2 className="font-display duration-fast group-hover:text-accent mt-3 text-2xl font-semibold tracking-tight text-balance transition-colors">
                {next.title}
              </h2>
              <span className="text-2xs text-fg-muted mt-3 inline-flex items-center gap-2 font-mono">
                {next.readTime}
                <ArrowRight />
              </span>
            </Link>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
