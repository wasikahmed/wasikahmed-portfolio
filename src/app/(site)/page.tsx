import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { SelectedWork } from '@/components/home/selected-work';
import { Impact } from '@/components/home/impact';
import { Experience } from '@/components/home/experience';
import { Process } from '@/components/home/process';
import { Shipped } from '@/components/home/shipped';
import { CtaBand } from '@/components/home/cta-band';
import { SectionRail } from '@/components/layout/section-rail';
import { getSettings, getRoles, getSiteCopy } from '@/server/queries';
import { pageMetadata } from '@/lib/seo';
import { personJsonLd } from '@/lib/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: `${settings.name} — ${settings.role}`,
    description: settings.proof,
    path: '/',
    siteName: settings.name,
  });
}

const RAIL = [
  { id: 'top', label: 'Top' },
  { id: 'work', label: 'Work' },
  { id: 'impact', label: 'Impact' },
  { id: 'experience', label: 'Experience' },
  { id: 'process', label: 'Approach' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'contact', label: 'Contact' },
];

export default async function HomePage() {
  const [roles, settings, copy] = await Promise.all([getRoles(), getSettings(), getSiteCopy()]);

  return (
    <>
      {/* Person schema (PLAN.md W3) — the one page it's unambiguous the
          whole site is "about", so it's the only place this renders. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(settings)) }}
      />
      <SectionRail sections={RAIL} />
      <Hero />
      <SelectedWork />
      <Impact />
      <Experience roles={roles} heading={copy.home.experienceHeading} />
      <Process />
      <Shipped />
      <CtaBand />
    </>
  );
}
