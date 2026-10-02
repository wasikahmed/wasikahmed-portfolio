import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { WorkIndex } from '@/components/work/work-index';
import { getProjects, getSettings, getSiteCopy } from '@/server/queries';
import { pageTitle, pageMetadata } from '@/lib/seo';
import { fillCount } from '@/lib/format';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);
  return pageMetadata({
    title: pageTitle('Work', settings.name),
    description: copy.work.metaDescription,
    path: '/work',
    siteName: settings.name,
  });
}

export default async function WorkPage() {
  const [projects, copy] = await Promise.all([getProjects(), getSiteCopy()]);

  return (
    <Section density="spacious" ambient={['grid']} className="pt-10 sm:pt-16">
      <Container>
        <Eyebrow rule>Work</Eyebrow>
        <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold tracking-tighter text-balance">
          {copy.work.heading}
        </h1>
        <p className="text-fg-muted mt-5 max-w-xl text-lg text-pretty">
          {/* Was hardcoded "Four" — the same drift PLAN.md W5 fixed on the
              home page, still live here. Wrong the moment a project ships
              or is unpublished from the CMS. The sentence is site copy now;
              the number in it still comes from the data. */}
          {fillCount(copy.work.intro, projects.length)}
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
