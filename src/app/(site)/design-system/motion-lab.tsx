'use client';

import { useState } from 'react';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { TextReveal } from '@/components/motion/text-reveal';
import { Metric } from '@/components/motion/metric';
import { Magnetic } from '@/components/motion/magnetic';
import { Button, ArrowRight } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePrefersReducedMotion } from '@/components/motion/use-reduced-motion';

/** Remounts its children so a one-shot animation can be watched again. */
function Replay({ label, children }: { label: string; children: React.ReactNode }) {
  const [key, setKey] = useState(0);

  return (
    <Card variant="raised" padding="lg" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">{label}</span>
        <Button variant="subtle" size="sm" onClick={() => setKey((k) => k + 1)}>
          Replay
        </Button>
      </div>
      <div key={key} className="min-h-24">
        {children}
      </div>
    </Card>
  );
}

export function MotionLab() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="flex flex-col gap-8">
      <Card
        variant={prefersReduced ? 'glass' : 'outline'}
        padding="md"
        className="flex items-center gap-3"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            prefersReduced ? 'bg-signal-amber' : 'bg-accent'
          }`}
        />
        <p className="text-fg-muted text-sm">
          {prefersReduced ? (
            <>
              <span className="text-fg">Reduced motion is on.</span> Every demo below renders its
              final state instantly. The information is identical — only the movement is gone.
            </>
          ) : (
            <>
              <span className="text-fg">Full motion.</span> Enable “Reduce motion” in your OS
              accessibility settings and reload — every animation here collapses, and nothing is
              lost.
            </>
          )}
        </p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Replay label="TextReveal — hero headline">
          <TextReveal
            text="I build systems that do the work for you."
            accentWords={[0, 1]}
            className="font-display text-2xl leading-tight font-bold tracking-tight"
          />
        </Replay>

        <Replay label="Metric — count-up with baseline">
          <div className="grid grid-cols-2 gap-6">
            <Metric value="92%" label="faster processing" baseline="3.1 hrs/day → 14 min/day" />
            <Metric value="$140k" label="monthly revenue" baseline="recovered from stockouts" />
          </div>
        </Replay>

        <Replay label="Reveal — directional">
          <div className="grid grid-cols-2 gap-3">
            {(['up', 'left', 'right', 'down'] as const).map((direction, i) => (
              <Reveal key={direction} direction={direction} delay={i * 0.06}>
                <div className="border-border-subtle bg-surface-3 text-2xs text-fg-muted rounded-md border px-3 py-4 text-center font-mono">
                  {direction}
                </div>
              </Reveal>
            ))}
          </div>
        </Replay>

        <Replay label="Stagger — grouped entrance">
          <Stagger className="flex flex-col gap-2">
            {['Understand', 'Design', 'Build', 'Ship'].map((step, i) => (
              <StaggerItem key={step}>
                <div className="border-border-subtle bg-surface-3 flex items-center gap-3 rounded-md border px-3 py-2">
                  <span className="text-2xs text-accent font-mono">0{i + 1}</span>
                  <span className="text-fg text-sm">{step}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Replay>
      </div>

      <Card variant="raised" padding="lg" className="flex flex-col gap-5">
        <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
          Magnetic — primary CTAs only
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <Magnetic>
            <Button href="/design-system" className="group">
              Hover me <ArrowRight />
            </Button>
          </Magnetic>
          <p className="text-fg-muted max-w-sm text-sm">
            Confirms interactivity before you commit to the click. The full custom cursor this
            descends from was cut — it replaced a native affordance with a laggy imitation.
          </p>
        </div>
      </Card>
    </div>
  );
}
