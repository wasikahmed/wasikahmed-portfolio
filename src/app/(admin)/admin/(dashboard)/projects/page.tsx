'use client';

import { CollectionList } from '@/components/admin/collection-list';
import type { Project } from '@/lib/types';

const STATUS_LABEL: Record<Project['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
};

export default function ProjectsListPage() {
  return (
    <CollectionList<Project>
      apiBase="/api/admin/projects"
      title="Projects"
      description="Case studies shown on /work, each with its own architecture diagram and metrics."
      newLabel="New project"
      emptyLabel="No projects yet."
      confirmLabelFor={(p) => p.title}
      renderRow={(p) => (
        <div className="min-w-0">
          <p className="text-fg truncate text-sm">{p.title}</p>
          <p className="text-2xs text-fg-subtle truncate">
            {STATUS_LABEL[p.status]} · {p.headline.value} {p.headline.label}
          </p>
        </div>
      )}
    />
  );
}
