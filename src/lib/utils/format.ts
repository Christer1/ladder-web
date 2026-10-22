// Countdown and masking helpers (e.g. mask BVN for display).

/** 45 → "00:45", 125 → "02:05". */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** "12345678901" → "*******8901". */
export function maskIdentifier(value: string, visible = 4): string {
  if (value.length <= visible) return value;
  return '*'.repeat(value.length - visible) + value.slice(-visible);
}

/** 5242880 → "5 MB", 734003 → "717 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** "adaeze@example.com" → "ad••••@example.com". A fixed 4 dots, so the length is not revealed. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}••••${email.slice(at)}`;
}
