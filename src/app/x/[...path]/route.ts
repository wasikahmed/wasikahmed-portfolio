import { handleUmamiProxy } from '@/server/umami-proxy';

/*
 * First-party Umami relay — see src/server/umami-proxy.ts for why it exists
 * and what it allows. `/x/` is a deliberately meaningless prefix: anything
 * that names analytics is what filter lists match on.
 */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Context) {
  return handleUmamiProxy(request, (await params).path);
}

export async function POST(request: Request, { params }: Context) {
  return handleUmamiProxy(request, (await params).path);
}
