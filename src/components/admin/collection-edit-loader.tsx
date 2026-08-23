'use client';

import { useEffect, useState } from 'react';
import { adminFetchJson } from '@/lib/admin-fetch';

/** Fetches one record by id and hands it to `children` — shared by every collection's edit page. */
export function CollectionEditLoader<T>({
  apiPath,
  children,
}: {
  apiPath: string;
  children: (item: T) => React.ReactNode;
}) {
  const [item, setItem] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetchJson<{ item: T }>(apiPath)
      .then((res) => setItem(res.item))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [apiPath]);

  if (error) return <p className="text-signal-rose text-sm">{error}</p>;
  if (!item) return <p className="text-fg-muted text-sm">Loading…</p>;
  return <>{children(item)}</>;
}
