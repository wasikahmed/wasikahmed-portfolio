import * as React from 'react';

interface ViewTransitionProps {
  /** Shared identity. The same name on two routes morphs one into the other. */
  name?: string;
  children: React.ReactNode;
}

/*
 * `ViewTransition` ships in the React canary that Next vendors for the App
 * Router, but `@types/react` (stable 19.2) does not declare it yet — so the
 * import type-checks against the wrong package and fails the build.
 *
 * This reads it off the runtime React namespace with a local type, and falls
 * back to rendering children untouched when it is absent. Signature #2 is a
 * progressive enhancement: without it navigation still works, it just cuts
 * instead of morphing.
 */
const Impl = (React as unknown as { ViewTransition?: React.ComponentType<ViewTransitionProps> })
  .ViewTransition;

export function ViewTransition({ name, children }: ViewTransitionProps) {
  if (!Impl) return <>{children}</>;
  return <Impl name={name}>{children}</Impl>;
}

/** True when the running React actually provides the component. */
export const hasViewTransitions = Boolean(Impl);
