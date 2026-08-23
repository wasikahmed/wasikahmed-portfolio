'use client';

import { CollectionList } from '@/components/admin/collection-list';
import type { Post } from '@/lib/types';

const STATUS_LABEL: Record<Post['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
};

export default function PostsListPage() {
  return (
    <CollectionList<Post>
      apiBase="/api/admin/posts"
      title="Writing"
      description="Articles and TIL notes shown on /writing."
      newLabel="New post"
      emptyLabel="No posts yet."
      confirmLabelFor={(p) => p.title}
      renderRow={(p) => (
        <div className="min-w-0">
          <p className="text-fg truncate text-sm">{p.title}</p>
          <p className="text-2xs text-fg-subtle truncate">
            {p.kind === 'til' ? 'TIL' : 'Article'} · {STATUS_LABEL[p.status]} · {p.date}
          </p>
        </div>
      )}
    />
  );
}
