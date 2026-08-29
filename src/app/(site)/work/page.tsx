import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { WorkIndex } from '@/components/work/work-index';
import { getProjects, getSettings } from '@/server/queries';
import { pageTitle, canonical } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: pageTitle('Work', settings.name),
    description: 'Case studies: AI pipelines, schedulers, and internal systems in production.',
    alternates: canonical('/work'),
  };
}

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <Section density="spacious" ambient={['grid']} className="pt-10 sm:pt-16">
      <Container>
        <Eyebrow rule>Work</Eyebrow>
        <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold tracking-tighter text-balance">
          Systems that removed a problem.
        </h1>
        <p className="text-fg-muted mt-5 max-w-xl text-lg text-pretty">
          Four projects, each still running. Every number below is paired with what it replaced.
        </p>

        <div className="mt-14">
          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense fallback={<div className="h-10" />}>
            <WorkIndex projects={projects} />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}
