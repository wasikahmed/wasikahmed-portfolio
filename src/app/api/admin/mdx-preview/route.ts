import { NextResponse, type NextRequest } from 'next/server';
import { getAdminSession } from '@/server/session';
import { can } from '@/server/permissions';
import { renderMdxToHtml } from '@/server/mdx-render';

/**
 * Compiles MDX source to HTML server-side for the admin editor's live
 * preview pane — the "live side-by-side preview rendering in the real
 * site components" the plan calls for. The client debounces keystrokes
 * (~400ms) and calls this rather than running an MDX runtime in the
 * browser, which keeps the client bundle free of the MDX compiler.
 *
 * Gated on `content:write` (PLAN.md W10) — this only ever renders a draft
 * an editor is actively composing in the project/post forms, not a
 * standalone capability someone without write access has any use for.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'content:write')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const source = typeof body?.source === 'string' ? body.source : '';

  if (!source.trim()) {
    return NextResponse.json({ html: '' });
  }

  try {
    const html = await renderMdxToHtml(source);
    return NextResponse.json({ html });
  } catch (err) {
    // Invalid MDX (unclosed tag, bad syntax) — the editor shows this
    // inline rather than the preview pane just going blank.
    const message = err instanceof Error ? err.message : 'Could not render this MDX.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
