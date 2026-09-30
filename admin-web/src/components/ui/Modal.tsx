import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Spinner } from './Loader';

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  // Escape closes, and the page behind must not scroll while a decision
  // dialog is up.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} my-auto rounded-xl border border-line bg-white shadow-lg`}
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Confirmation for a destructive or outward-facing action.
 *
 * `requireNote` adds a mandatory reason field. Removing a listing or
 * rejecting a verification writes that text into a notification the
 * affected user reads, so an empty reason would ship an unexplained
 * decision -- hence required, not optional.
 *
 * The note lives here rather than in the caller. It still survives a
 * failed submit, because a rejected mutation leaves the dialog mounted;
 * it resets on the next open so the previous reason never pre-fills.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  requireNote = false,
  noteLabel = 'Reason',
  notePlaceholder,
  pending = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  requireNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  const noteMissing = requireNote && !note.trim();

  return (
    <Modal
      open={open}
      title={title}
      onClose={pending ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onConfirm(note)}
            disabled={pending || noteMissing}
          >
            {pending ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-2">{description}</p>

      {requireNote ? (
        <div className="mt-4">
          <label htmlFor="confirm-note" className="mb-1.5 block text-xs font-semibold text-ink">
            {noteLabel} <span className="text-bad">*</span>
          </label>
          <textarea
            id="confirm-note"
            className="input resize-y"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={notePlaceholder}
            disabled={pending}
          />
          <p className="mt-1.5 text-xs text-ink-3">
            This is shown to the user along with the decision.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-bad-bg px-3 py-2 text-sm text-[#c0271d]">{error}</p>
      ) : null}
    </Modal>
  );
}
