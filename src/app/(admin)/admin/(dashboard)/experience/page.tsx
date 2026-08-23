'use client';

import { CollectionList } from '@/components/admin/collection-list';
import type { Role } from '@/lib/types';

export default function ExperienceListPage() {
  return (
    <CollectionList<Role>
      apiBase="/api/admin/experience"
      title="Experience"
      description="Roles shown in the home page timeline, most recent first."
      newLabel="New role"
      emptyLabel="No roles yet."
      confirmLabelFor={(r) => r.title}
      renderRow={(r) => (
        <div className="min-w-0">
          <p className="text-fg truncate text-sm">{r.title}</p>
          <p className="text-2xs text-fg-subtle truncate">
            {r.company} · {r.period}
          </p>
        </div>
      )}
    />
  );
}
