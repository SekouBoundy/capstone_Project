import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-fill text-ink-2',
  success: 'bg-ok-bg text-[#1a7f37]',
  warning: 'bg-warn-bg text-[#8a5200]',
  danger: 'bg-bad-bg text-[#c0271d]',
  info: 'bg-[#e8f0fe] text-[#1a56c4]',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps a domain enum value to the tone its badge should use. */
export function statusTone(value: string): BadgeTone {
  switch (value) {
    case 'published':
    case 'active':
    case 'approved':
    case 'resolved':
    case 'dismissed':
      return 'success';
    case 'pending':
    case 'open':
    case 'investigating':
    case 'sold':
    case 'unavailable':
      return 'warning';
    case 'removed':
    case 'rejected':
      return 'danger';
    case 'draft':
      return 'neutral';
    default:
      return 'neutral';
  }
}
