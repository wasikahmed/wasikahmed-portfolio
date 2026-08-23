'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/cn';
import type { Post, Project, Settings } from '@/lib/types';

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: 'Navigate' | 'Work' | 'Writing' | 'Actions';
  keywords: string;
  run: (ctx: { router: ReturnType<typeof useRouter>; close: () => void }) => void;
}

/**
 * Signature interaction #5 (PLAN.md §2.5).
 *
 * The purest expression of the thesis: complete access to every page,
 * project, and article, occupying zero pixels until it is asked for.
 */
export function CommandPalette({
  open,
  onOpenChange,
  settings,
  projects,
  posts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: Settings;
  projects: Project[];
  posts: Post[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeRaw, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const commands = useMemo<Command[]>(
    () => [
      ...NAV_LINKS.map((link) => ({
        id: `nav-${link.href}`,
        label: link.label,
        hint: link.href,
        group: 'Navigate' as const,
        keywords: `${link.label} ${link.href}`,
        run: ({
          router: r,
          close: c,
        }: {
          router: ReturnType<typeof useRouter>;
          close: () => void;
        }) => {
          r.push(link.href);
          c();
        },
      })),
      {
        id: 'nav-home',
        label: 'Home',
        hint: '/',
        group: 'Navigate',
        keywords: 'home index start',
        run: ({ router: r, close: c }) => {
          r.push('/');
          c();
        },
      },
      ...projects.map((project) => ({
        id: `project-${project.slug}`,
        label: project.title,
        hint: project.headline.value + ' · ' + project.headline.label,
        group: 'Work' as const,
        keywords: `${project.title} ${project.tagline} ${project.categories.join(' ')} ${project.stack.join(' ')}`,
        run: ({
          router: r,
          close: c,
        }: {
          router: ReturnType<typeof useRouter>;
          close: () => void;
        }) => {
          r.push(`/work/${project.slug}`);
          c();
        },
      })),
      ...posts.map((post) => ({
        id: `post-${post.slug}`,
        label: post.title,
        hint: `${post.readTime} · ${post.tags.join(', ')}`,
        group: 'Writing' as const,
        keywords: `${post.title} ${post.excerpt} ${post.tags.join(' ')}`,
        run: ({
          router: r,
          close: c,
        }: {
          router: ReturnType<typeof useRouter>;
          close: () => void;
        }) => {
          r.push(`/writing/${post.slug}`);
          c();
        },
      })),
      {
        id: 'action-email',
        label: 'Copy email address',
        hint: settings.email,
        group: 'Actions',
        keywords: 'email copy contact mail address',
        run: ({ close: c }) => {
          void navigator.clipboard?.writeText(settings.email);
          c();
        },
      },
    ],
    [projects, posts, settings.email],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.keywords.toLowerCase().includes(q));
  }, [commands, query]);

  /*
   * Clamp at render rather than storing a corrected value. As the query
   * narrows the list, the stored index can point past the end; deriving it
   * keeps the highlight valid without an effect that re-renders to fix
   * state it just rendered.
   */
  const active = Math.min(activeRaw, Math.max(results.length - 1, 0));

  const grouped = useMemo(() => {
    const map = new Map<Command['group'], Command[]>();
    for (const command of results) {
      const list = map.get(command.group) ?? [];
      list.push(command);
      map.set(command.group, list);
    }
    return [...map.entries()];
  }, [results]);

  // Global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  /*
   * Clear the query each time the palette opens. Render-phase adjustment
   * rather than an effect, per React's "reset state when a value changes"
   * guidance — an effect here would render the stale query for one frame.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setActive(0);
    }
  }

  // Lock scroll and hold focus while open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    // rAF so the input exists before we reach for it.
    const id = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      results[active]?.run({ router, close });
    }
  };

  // Scroll the active row into view when navigating by keyboard.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Close search"
            className="bg-bg/80 absolute inset-0 cursor-default backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-surface-2 shadow-e4 relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border"
            onKeyDown={onKeyDown}
          >
            <div className="border-border-subtle flex items-center gap-3 border-b px-4">
              <span aria-hidden className="text-fg-subtle font-mono text-xs">
                /
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, writing, pages…"
                aria-label="Search"
                className="text-fg placeholder:text-fg-subtle h-14 flex-1 bg-transparent text-base outline-none"
              />
              <kbd className="text-2xs text-fg-subtle hidden font-mono sm:block">esc</kbd>
            </div>

            <ul
              ref={listRef}
              className="flex-1 overflow-y-auto overscroll-contain p-2"
              role="listbox"
            >
              {results.length === 0 ? (
                <li className="text-fg-muted px-3 py-8 text-center text-sm">
                  Nothing matches “{query}”.
                </li>
              ) : (
                grouped.map(([group, items]) => (
                  <li key={group}>
                    <p className="text-2xs text-fg-subtle px-3 pt-3 pb-1 font-mono tracking-wide uppercase">
                      {group}
                    </p>
                    <ul>
                      {items.map((command) => {
                        flatIndex += 1;
                        const index = flatIndex;
                        const isActive = index === active;
                        return (
                          <li key={command.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              data-active={isActive}
                              onMouseEnter={() => setActive(index)}
                              onClick={() => command.run({ router, close })}
                              className={cn(
                                'duration-fast flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left transition-colors',
                                isActive ? 'bg-accent-soft text-fg' : 'text-fg-muted',
                              )}
                            >
                              <span className="truncate text-sm">{command.label}</span>
                              {command.hint ? (
                                <span className="text-2xs text-fg-subtle shrink-0 truncate font-mono">
                                  {command.hint}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            <div className="border-border-subtle text-2xs text-fg-subtle flex items-center gap-4 border-t px-4 py-2.5 font-mono">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
