'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Tag } from '@/components/ui/tag';
import { roles } from '@/lib/content/experience';
import { cn } from '@/lib/cn';

/**
 * Progressive disclosure done right — this was already the strongest
 * pattern in the prototype and is kept (PLAN.md §2.4). Every role collapses
 * to one line; the shipped work expands on request. Zero ambient layers:
 * this section is pure content and earns none.
 */
export function Experience() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="experience" bordered>
      <Container>
        <Eyebrow rule>Experience</Eyebrow>
        <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
          Where I&apos;ve built.
        </h2>

        <ul className="mt-12">
          {roles.map((role, index) => {
            const open = openIndex === index;
            const panelId = `role-panel-${index}`;

            return (
              <li key={`${role.company}-${role.title}`} className="border-border-subtle border-b">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="group flex w-full items-start justify-between gap-6 py-6 text-left"
                  >
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span
                          className={cn(
                            'font-display duration-fast text-lg font-semibold transition-colors',
                            open ? 'text-accent' : 'text-fg group-hover:text-accent',
                          )}
                        >
                          {role.title}
                        </span>
                        <Tag>{role.type}</Tag>
                      </span>
                      <span className="text-fg-muted flex flex-wrap items-center gap-x-3 text-sm">
                        {role.company}
                        <span aria-hidden className="text-fg-subtle">
                          ·
                        </span>
                        <span className="text-2xs font-mono">{role.period}</span>
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className={cn(
                        'text-accent duration-base mt-1 shrink-0 transition-transform',
                        open && 'rotate-45',
                      )}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9 3.5v11M3.5 9h11" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <ul className="flex flex-col gap-3 pb-7 sm:pl-1">
                        {role.shipped.map((item) => (
                          <li
                            key={item}
                            className="text-fg-muted flex gap-3 text-sm leading-relaxed"
                          >
                            <span
                              aria-hidden
                              className="bg-accent mt-[0.55rem] h-1 w-1 shrink-0 rounded-full"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
