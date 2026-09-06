import { redirect } from 'next/navigation';
import { getAdminSession } from '@/server/session';
import { can } from '@/server/permissions';
import { UsersList } from './users-list';

/**
 * Server-side gate on top of the API's own (PLAN.md W10) — presentation,
 * not the security boundary. A viewer/editor who navigates here directly
 * gets redirected before any client code runs; every mutation is still
 * independently enforced in the /api/admin/users routes regardless of
 * whether this page ever renders.
 */
export default async function UsersPage() {
  const session = await getAdminSession();
  if (!session || !can(session, 'user:read')) redirect('/admin');

  return (
    <UsersList
      currentUserId={session.id}
      currentUserRole={session.role}
      canWrite={can(session, 'user:write')}
    />
  );
}
