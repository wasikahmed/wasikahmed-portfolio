import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { SelectedWork } from '@/components/home/selected-work';
import { Impact } from '@/components/home/impact';
import { Experience } from '@/components/home/experience';
import { Process } from '@/components/home/process';
import { Voices } from '@/components/home/voices';
import { CtaBand } from '@/components/home/cta-band';
import { SectionRail } from '@/components/site/section-rail';
import { getSettings, getRoles } from '@/server/queries';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.name} — ${settings.role}`,
    description: settings.proof,
  };
}

const RAIL = [
  { id: 'top', label: 'Top' },
  { id: 'work', label: 'Work' },
  { id: 'impact', label: 'Impact' },
  { id: 'experience', label: 'Experience' },
  { id: 'process', label: 'Process' },
  { id: 'voices', label: 'Clients' },
  { id: 'contact', label: 'Contact' },
];

export default async function HomePage() {
  const roles = await getRoles();

  return (
    <>
      <SectionRail sections={RAIL} />
      <Hero />
      <SelectedWork />
      <Impact />
      <Experience roles={roles} />
      <Process />
      <Voices />
      <CtaBand />
    </>
  );
}
