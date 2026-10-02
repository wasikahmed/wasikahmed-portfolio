'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { RevisionHistory } from '@/components/admin/revision-history';
import { ProjectForm } from '@/components/admin/forms/project-form';
import type { Project } from '@/lib/types';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<Project> apiPath={`/api/admin/projects/${id}`}>
      {(project) => (
        <>
          <ProjectForm project={project} />
          <RevisionHistory
            entityType="project"
            entityId={project.id}
            current={project as unknown as Record<string, unknown>}
          />
        </>
      )}
    </CollectionEditLoader>
  );
}
