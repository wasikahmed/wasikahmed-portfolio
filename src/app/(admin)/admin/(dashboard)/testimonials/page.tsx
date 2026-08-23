'use client';

import { CollectionList } from '@/components/admin/collection-list';
import type { Testimonial } from '@/lib/types';

export default function TestimonialsListPage() {
  return (
    <CollectionList<Testimonial>
      apiBase="/api/admin/testimonials"
      title="Testimonials"
      description="Quotes shown inline on the home page, each linked back to the project it came from."
      newLabel="New testimonial"
      emptyLabel="No testimonials yet."
      confirmLabelFor={(t) => t.name}
      renderRow={(t) => (
        <div className="min-w-0">
          <p className="text-fg truncate text-sm">{t.name}</p>
          <p className="text-2xs text-fg-subtle truncate">
            {t.title}, {t.company} {t.featured ? '' : '· hidden'}
          </p>
        </div>
      )}
    />
  );
}
