'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { RevisionHistory } from '@/components/admin/revision-history';
import { SkillGroupForm } from '@/components/admin/forms/skill-group-form';
import type { SkillGroup } from '@/lib/types';

export default function EditSkillGroupPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<SkillGroup> apiPath={`/api/admin/skill-groups/${id}`}>
      {(group) => (
        <>
          <SkillGroupForm group={group} />
          <RevisionHistory
            entityType="skillGroup"
            entityId={group.id}
            current={group as unknown as Record<string, unknown>}
          />
        </>
      )}
    </CollectionEditLoader>
  );
}
