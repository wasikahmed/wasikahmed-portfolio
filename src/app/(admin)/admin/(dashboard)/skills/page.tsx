'use client';

import { Eyebrow } from '@/components/ui/eyebrow';
import { CollectionList } from '@/components/admin/collection-list';
import type { Tech, SkillGroup } from '@/lib/types';

export default function SkillsListPage() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <Eyebrow>Skills</Eyebrow>
        <p className="text-fg-muted mt-2 max-w-lg text-sm">
          Two collections: individual tools driving the hero constellation, and grouped categories
          shown on the About page.
        </p>
      </div>

      <CollectionList<Tech>
        apiBase="/api/admin/tech"
        uiBase="/admin/skills/tech"
        title="Tech items"
        description=""
        newLabel="New tech item"
        emptyLabel="No tech items yet."
        showHeader={false}
        confirmLabelFor={(t) => t.name}
        renderRow={(t) => (
          <div className="min-w-0">
            <p className="text-fg truncate text-sm">{t.name}</p>
            <p className="text-2xs text-fg-subtle truncate">
              {t.group} · used in {t.projects.length} project{t.projects.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      />

      <CollectionList<SkillGroup>
        apiBase="/api/admin/skill-groups"
        uiBase="/admin/skills/groups"
        title="Skill groups"
        description=""
        newLabel="New group"
        emptyLabel="No skill groups yet."
        showHeader={false}
        confirmLabelFor={(g) => g.category}
        renderRow={(g) => (
          <div className="min-w-0">
            <p className="text-fg truncate text-sm">{g.category}</p>
            <p className="text-2xs text-fg-subtle truncate">{g.items.join(', ')}</p>
          </div>
        )}
      />
    </div>
  );
}
