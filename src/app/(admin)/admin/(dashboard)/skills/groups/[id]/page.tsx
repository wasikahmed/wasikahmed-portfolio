'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { SkillGroupForm } from '@/components/admin/forms/skill-group-form';
import type { SkillGroup } from '@/lib/types';

export default function EditSkillGroupPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<SkillGroup> apiPath={`/api/admin/skill-groups/${id}`}>
      {(group) => <SkillGroupForm group={group} />}
    </CollectionEditLoader>
  );
}
