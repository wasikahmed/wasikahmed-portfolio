'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { RevisionHistory } from '@/components/admin/revision-history';
import { RoleForm } from '@/components/admin/forms/role-form';
import type { Role } from '@/lib/types';

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<Role> apiPath={`/api/admin/experience/${id}`}>
      {(role) => (
        <>
          <RoleForm role={role} />
          <RevisionHistory
            entityType="role"
            entityId={role.id}
            current={role as unknown as Record<string, unknown>}
          />
        </>
      )}
    </CollectionEditLoader>
  );
}
