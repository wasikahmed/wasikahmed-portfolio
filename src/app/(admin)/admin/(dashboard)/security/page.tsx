'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';

type EnrollState = { qrDataUrl: string; manualEntryKey: string } | null;

export default function SecurityPage() {
  const { data: session, update } = useSession();
  const totpEnabled = Boolean(
    (session?.user as { totpEnabled?: boolean } | undefined)?.totpEnabled,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <Eyebrow>Security</Eyebrow>
        <p className="text-fg-muted mt-2 max-w-lg text-sm">
          Two-factor authentication and password for {session?.user?.email}.
        </p>
      </div>

      <TotpSection enabled={totpEnabled} onChange={() => update({})} />
      <PasswordSection />
    </div>
  );
}

function TotpSection({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const [enrolling, setEnrolling] = useState(false);
  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  const startEnroll = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await adminFetchJson<{ qrDataUrl: string; manualEntryKey: string }>(
        '/api/admin/totp/enroll',
        { method: 'POST' },
      );
      setEnroll(res);
      setEnrolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start enrollment.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminFetchJson('/api/admin/totp/confirm', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setEnrolling(false);
      setEnroll(null);
      setCode('');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisabling(true);
    setError(null);
    try {
      await adminFetchJson('/api/admin/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword }),
      });
      setDisablePassword('');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password.');
    } finally {
      setDisabling(false);
    }
  };

  return (
    <Card variant="raised" padding="lg">
      <div className="flex items-center justify-between">
        <p className="text-2xs text-fg-muted font-mono tracking-widest uppercase">
          Two-factor authentication
        </p>
        {enabled ? (
          <span className="text-2xs text-accent flex items-center gap-2 font-mono">
            <StatusDot />
            Enabled
          </span>
        ) : (
          <span className="text-2xs text-signal-amber font-mono">Not enabled</span>
        )}
      </div>

      {error ? <p className="text-signal-rose mt-3 text-sm">{error}</p> : null}

      {enabled ? (
        <form onSubmit={disable} className="mt-5 flex flex-col gap-4">
          <p className="text-fg-muted text-sm">
            Disabling removes the extra step at login. Confirm with your password.
          </p>
          <Field label="Password" htmlFor="disable-password">
            <Input
              id="disable-password"
              type="password"
              required
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="ghost" disabled={disabling} className="self-start">
            {disabling ? 'Disabling…' : 'Disable 2FA'}
          </Button>
        </form>
      ) : !enrolling ? (
        <div className="mt-5">
          <p className="text-fg-muted text-sm">
            Scan a QR code with an authenticator app (Google Authenticator, 1Password, Authy) and
            confirm a code to turn this on.
          </p>
          <Button onClick={startEnroll} disabled={busy} className="mt-4">
            {busy ? 'Starting…' : 'Set up 2FA'}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-start gap-5">
          {enroll ? (
            // eslint-disable-next-line @next/next/no-img-element -- a one-time data: URI, not a site asset.
            <img
              src={enroll.qrDataUrl}
              alt="Scan with your authenticator app"
              className="border-border-subtle rounded-md border"
              width={200}
              height={200}
            />
          ) : null}
          <div>
            <p className="text-2xs text-fg-subtle">Can&apos;t scan? Enter this key manually:</p>
            <p className="text-fg mt-1 font-mono text-xs">{enroll?.manualEntryKey}</p>
          </div>
          <form onSubmit={confirm} className="flex w-full flex-col gap-4">
            <Field label="Code from your app" htmlFor="totp-code">
              <Input
                id="totp-code"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? 'Verifying…' : 'Confirm'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEnrolling(false);
                  setEnroll(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await adminFetch('/api/admin/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to change password.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="raised" padding="lg">
      <p className="text-2xs text-fg-muted font-mono tracking-widest uppercase">Password</p>
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <Field label="Current password" htmlFor="currentPassword">
          <Input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password" htmlFor="newPassword" hint="At least 12 characters.">
          <Input
            id="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? 'Saving…' : 'Change password'}
          </Button>
          {saved ? <span className="text-2xs text-accent">Changed.</span> : null}
        </div>
      </form>
    </Card>
  );
}
