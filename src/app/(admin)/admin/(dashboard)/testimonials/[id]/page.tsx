'use client';

import { useParams } from 'next/navigation';
import { CollectionEditLoader } from '@/components/admin/collection-edit-loader';
import { TestimonialForm } from '@/components/admin/forms/testimonial-form';
import type { Testimonial } from '@/lib/types';

export default function EditTestimonialPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CollectionEditLoader<Testimonial> apiPath={`/api/admin/testimonials/${id}`}>
      {(testimonial) => <TestimonialForm testimonial={testimonial} />}
    </CollectionEditLoader>
  );
}
