import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { WorkIndex } from '@/components/work/work-index';

export const metadata: Metadata = {
  title: 'Work — Wasik Ahmed',
  description: 'Case studies: AI pipelines, schedulers, and internal systems in production.',
};

export default function WorkPage() {
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
            <WorkIndex />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}
