import { useCallback, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  enabled?: boolean;
  onSignOut: () => void;
}

export const useInactivityTimeout = ({
  timeoutMs = 10 * 60 * 1000,
  enabled = true,
  onSignOut
}: UseInactivityTimeoutOptions): void => {
  const timerRef = useRef<number | null>(null);
  const swalOpenRef = useRef(false);
  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  async function showPrompt() {
    swalOpenRef.current = true;
    const result = await Swal.fire({
      title: 'Are you still here?',
      text: 'You have been inactive for 10 minutes. Sign back in to keep exploring.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: "Yes, I'm here",
      cancelButtonText: 'No, sign me out',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#dc2626',
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'font-sans rounded-none text-[#111111]',
        title: 'font-display uppercase tracking-wide !text-2xl',
        confirmButton: 'rounded-none px-8 py-2.5 text-xs font-bold uppercase tracking-widest',
        cancelButton: 'rounded-none px-8 py-2.5 text-xs font-bold uppercase tracking-widest'
      }
    });
    swalOpenRef.current = false;
    if (result.isConfirmed) {
      startTimer();
    } else {
      onSignOutRef.current();
    }
  }

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      // Child-frame activity (e.g. typing card details in Paystack) does not
      // reach this document, so never prompt while a payment window is open.
      if (document.querySelector('iframe[src*="paystack"]')) {
        startTimer();
        return;
      }
      void showPrompt();
    }, timeoutMs);
  }, [clearTimer, timeoutMs]);

  const handleActivity = useCallback(() => {
    if (swalOpenRef.current) return;
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }
    const events: (keyof WindowEventMap)[] = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    startTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimer();
    };
  }, [enabled, handleActivity, startTimer, clearTimer]);
};