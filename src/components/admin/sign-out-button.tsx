'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="text-2xs text-fg-muted duration-fast hover:text-accent font-mono transition-colors"
    >
      Sign out
    </button>
  );
}
