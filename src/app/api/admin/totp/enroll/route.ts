import { NextResponse, type NextRequest } from 'next/server';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { generateTotpEnrollment, encryptTotpSecret } from '@/server/totp';

const PENDING_COOKIE = 'totp-pending';

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const { base32Secret, otpauthUrl, qrDataUrl } = await generateTotpEnrollment(session.email);

  const response = NextResponse.json({ qrDataUrl, otpauthUrl, manualEntryKey: base32Secret });

  // Encrypted even in this short-lived cookie — the confirm step decrypts
  // it, and the exact same encrypted value becomes the User document's
  // totpSecret on success, so nothing is ever stored or transmitted as
  // plaintext after this initial response.
  //
  // Path must be `/api/admin` (not `/admin`) — this cookie is set from an
  // `/api/admin/*` response and read back by `/api/admin/totp/confirm`;
  // `/admin` and `/api/admin` are different path prefixes as far as the
  // browser's cookie matching is concerned, so scoping it to `/admin` meant
  // it was never sent back to the route that needs it.
  response.cookies.set(PENDING_COOKIE, encryptTotpSecret(base32Secret), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin',
    maxAge: 10 * 60, // 10 minutes to scan and confirm
  });

  return response;
}
