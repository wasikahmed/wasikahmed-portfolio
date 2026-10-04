'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { ShortLinkForm } from '@/components/admin/forms/short-link-form';
import type { ShortLink } from '@/lib/types';

export default function EditShortLinkPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<ShortLink> apiPath={`/api/admin/short-links/${id}`}>
      {(link) => <ShortLinkForm link={link} />}
    </CollectionEditLoader>
  );
}
