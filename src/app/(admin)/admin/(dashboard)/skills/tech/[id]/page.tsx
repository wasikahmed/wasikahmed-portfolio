'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { TechForm } from '@/components/admin/forms/tech-form';
import type { Tech } from '@/lib/types';

export default function EditTechPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<Tech> apiPath={`/api/admin/tech/${id}`}>
      {(tech) => <TechForm tech={tech} />}
    </CollectionEditLoader>
  );
}
