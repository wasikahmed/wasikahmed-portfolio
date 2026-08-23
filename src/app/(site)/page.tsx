import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { SelectedWork } from '@/components/home/selected-work';
import { Impact } from '@/components/home/impact';
import { Experience } from '@/components/home/experience';
import { Process } from '@/components/home/process';
import { Voices } from '@/components/home/voices';
import { CtaBand } from '@/components/home/cta-band';
import { SectionRail } from '@/components/site/section-rail';
import { site } from '@/lib/content/site';

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}`,
  description: site.proof,
};

const RAIL = [
  { id: 'top', label: 'Top' },
  { id: 'work', label: 'Work' },
  { id: 'impact', label: 'Impact' },
  { id: 'experience', label: 'Experience' },
  { id: 'process', label: 'Process' },
  { id: 'voices', label: 'Clients' },
  { id: 'contact', label: 'Contact' },
];

export default function HomePage() {
  return (
    <>
      <SectionRail sections={RAIL} />
      <Hero />
      <SelectedWork />
      <Impact />
      <Experience />
      <Process />
      <Voices />
      <CtaBand />
    </>
  );
}
