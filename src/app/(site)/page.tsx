import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { SelectedWork } from '@/components/home/selected-work';
import { Impact } from '@/components/home/impact';
import { Experience } from '@/components/home/experience';
import { Process } from '@/components/home/process';
import { Shipped } from '@/components/home/shipped';
import { CtaBand } from '@/components/home/cta-band';
import { SectionRail } from '@/components/layout/section-rail';
import { getSettings, getRoles, getSiteCopy, getSkillGroups } from '@/server/queries';
import { pageMetadata } from '@/lib/seo';
import { jsonLdGraph, personJsonLd, serializeJsonLd, websiteJsonLd } from '@/lib/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);
  return pageMetadata({
    // Written out whole in the CMS rather than built from name and role,
    // so it can carry the name variant people actually search for.
    title: copy.seo.homeTitle,
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
  const [roles, settings, copy, skillGroups] = await Promise.all([
    getRoles(),
    getSettings(),
    getSiteCopy(),
    getSkillGroups(),
  ]);

  return (
    <>
      {/* The site and the person it is about (PLAN.md W3). Every other
          page's structured data points back at these by `@id`. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            jsonLdGraph(websiteJsonLd(settings), personJsonLd(settings, { roles, skillGroups })),
          ),
        }}
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
