'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { RevisionHistory } from '@/components/admin/revision-history';
import { PostForm } from '@/components/admin/forms/post-form';
import type { Post } from '@/lib/types';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<Post> apiPath={`/api/admin/posts/${id}`}>
      {(post) => (
        <>
          <PostForm post={post} />
          <RevisionHistory
            entityType="post"
            entityId={post.id}
            current={post as unknown as Record<string, unknown>}
          />
        </>
      )}
    </CollectionEditLoader>
  );
}
