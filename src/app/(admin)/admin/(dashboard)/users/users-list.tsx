'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { AdminUser } from '@/lib/types';

const INVITABLE_ROLES: AdminUser['role'][] = ['viewer', 'editor', 'admin'];

const STATUS_TONE: Record<AdminUser['status'], 'default' | 'accent' | 'amber' | 'muted'> = {
  active: 'accent',
  invited: 'amber',
  suspended: 'muted',
};

function InviteForm({ onInvited }: { onInvited: (user: AdminUser) => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('editor');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Invite
      </Button>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminFetchJson<{ item: AdminUser }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      onInvited(res.item);
      setEmail('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="outline" padding="md" className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Role" htmlFor="invite-role">
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminUser['role'])}
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invite'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function UserRow({
  user,
  currentUserId,
  currentUserRole,
  canWrite,
  onUpdate,
  onDeleted,
}: {
  user: AdminUser;
  currentUserId: string;
  currentUserRole: AdminUser['role'];
  canWrite: boolean;
  onUpdate: (user: AdminUser) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors the server-side guards in /api/admin/users/[id]/route.ts —
  // presentation only (PLAN.md W10); the API enforces every one of these
  // independent of what this component renders.
  const isSelf = user.id === currentUserId;
  const isOwner = user.role === 'owner';
  const locked = isSelf || isOwner;

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetchJson<{ item: AdminUser }>(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      onUpdate(res.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const transferOwnership = async () => {
    if (!window.confirm(`Make ${user.email} the owner? You will become admin.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}/transfer-ownership`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Something went wrong.');
      }
      window.location.reload(); // Both this row and the current session's own role changed.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <Card variant="flat" padding="sm" className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-fg truncate text-sm">
          {user.name || user.email}
          {isSelf ? <span className="text-fg-subtle"> · you</span> : null}
        </p>
        {user.name ? <p className="text-2xs text-fg-subtle truncate">{user.email}</p> : null}
        {error ? <p className="text-signal-rose text-2xs mt-1">{error}</p> : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Tag tone={STATUS_TONE[user.status]}>{user.status}</Tag>

        {isOwner ? (
          <Tag tone="accent">owner</Tag>
        ) : (
          <Select
            aria-label={`Role for ${user.email}`}
            value={user.role}
            disabled={busy || locked || !canWrite}
            onChange={(e) => patch({ role: e.target.value })}
            className="h-9 text-xs"
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        )}

        {!locked && canWrite ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => patch({ status: user.status === 'suspended' ? 'active' : 'suspended' })}
          >
            {user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
          </Button>
        ) : null}

        {currentUserRole === 'owner' && !isOwner && user.status === 'active' ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={transferOwnership}
          >
            Make owner
          </Button>
        ) : null}

        {!locked && canWrite ? (
          <DeleteButton
            apiPath={`/api/admin/users/${user.id}`}
            confirmLabel={user.email}
            onDeleted={onDeleted}
          />
        ) : null}
      </div>
    </Card>
  );
}

export function UsersList({
  currentUserId,
  currentUserRole,
  canWrite,
}: {
  currentUserId: string;
  currentUserRole: AdminUser['role'];
  canWrite: boolean;
}) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  useEffect(() => {
    adminFetchJson<{ items: AdminUser[] }>('/api/admin/users')
      .then((res) => setUsers(res.items))
      .catch(() => setUsers([]));
  }, []);

  const updateUser = (updated: AdminUser) => {
    setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev);
  };

  const addUser = (created: AdminUser) => {
    setUsers((prev) => (prev ? [created, ...prev] : [created]));
  };

  const removeUser = (id: string) => {
    setUsers((prev) => prev?.filter((u) => u.id !== id) ?? prev);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Users</Eyebrow>
          <p className="text-fg-muted mt-2 max-w-lg text-sm">
            Who can sign in and what they can do. Invited accounts appear here immediately, before
            they accept.
          </p>
        </div>
        {canWrite ? <InviteForm onInvited={addUser} /> : null}
      </div>

      <div className="mt-8">
        {users === null ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : users.length === 0 ? (
          <Card variant="outline" padding="lg">
            <p className="text-fg-muted text-sm">No users yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                canWrite={canWrite}
                onUpdate={updateUser}
                onDeleted={() => removeUser(user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
