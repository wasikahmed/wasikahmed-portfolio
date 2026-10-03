import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * /resume's analytics hook (resume-response.ts): an open is handed to
 * `after()` only when Umami is configured and the request is a real open,
 * and the response itself never waits on it. The database and `after()`
 * are stubbed — the PDF-serving behaviour has its own tests in
 * resume-and-site-copy.test.ts.
 */

const afterMock = vi.fn();
vi.mock('next/server', () => ({ after: (fn: () => unknown) => afterMock(fn) }));
vi.mock('../queries', () => ({
  getCurrentResumeFile: async () => ({
    fileName: 'resume.pdf',
    sha256: 'abc123',
    size: 4,
    data: Buffer.from('%PDF'),
  }),
}));

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36';
const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));

beforeEach(() => {
  afterMock.mockReset();
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function getResume(headers: Record<string, string> = {}) {
  const { currentResumeResponse } = await import('../resume-response');
  return currentResumeResponse(
    new Request('http://0.0.0.0:3000/resume?utm_source=github', { headers }),
  );
}

describe('resume_view', () => {
  it('schedules one event per open when analytics is configured', async () => {
    vi.stubEnv('UMAMI_URL', 'https://analytics.example.com');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'site-id');

    const res = await getResume({ 'user-agent': UA });
    expect(res.status).toBe(200);
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    await afterMock.mock.calls[0][0]();
    const sent = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(sent.payload).toMatchObject({
      website: 'site-id',
      name: 'resume_view',
      url: '/resume?utm_source=github',
      data: { source: 'github', response: 'full' },
    });
  });

  it('counts a revalidated open (304) as cached', async () => {
    vi.stubEnv('UMAMI_URL', 'https://analytics.example.com');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'site-id');

    const res = await getResume({ 'user-agent': UA, 'if-none-match': '"abc123"' });
    expect(res.status).toBe(304);
    await afterMock.mock.calls[0][0]();
    const sent = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(sent.payload.data.response).toBe('cached');
  });

  it('does nothing when analytics is unconfigured or the request is not an open', async () => {
    vi.stubEnv('UMAMI_URL', '');
    expect((await getResume({ 'user-agent': UA })).status).toBe(200);

    vi.stubEnv('UMAMI_URL', 'https://analytics.example.com');
    vi.stubEnv('UMAMI_WEBSITE_ID', 'site-id');
    expect((await getResume({ 'user-agent': UA, range: 'bytes=1024-2047' })).status).toBe(200);

    expect(afterMock).not.toHaveBeenCalled();
  });
});
