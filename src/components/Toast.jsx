import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Toast — Accessible notification system replacing all alert() calls.
 *
 * Features:
 * - `aria-live="assertive"` for screen reader announcements
 * - Auto-dismiss after configurable duration
 * - Supports success, error, info variants
 * - Slide-in/out animation
 *
 * Usage:
 *   // Wrap app in provider:
 *   <ToastProvider><App /></ToastProvider>
 *
 *   // In any child component:
 *   const toast = useToast();
 *   toast.show('Plan copied!', 'success');
 */

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if provider is missing (e.g., in tests)
    return { show: (msg) => console.log('[Toast]', msg) };
  }
  return ctx;
}

/** Individual toast item. */
function ToastItem({ id, message, type, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 280);
  }, [id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  const colorMap = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' },
    error:   { bg: 'rgba(244,63,94,0.15)',   border: 'rgba(244,63,94,0.3)',   color: '#fda4af' },
    info:    { bg: 'rgba(56,189,248,0.15)',   border: 'rgba(56,189,248,0.3)',  color: '#7dd3fc' },
  };
  const colors = colorMap[type] || colorMap.info;

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.625rem',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.color,
        fontSize: '0.875rem',
        fontWeight: 500,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: exiting ? 'toastOut 0.28s ease forwards' : 'toastIn 0.3s ease',
        pointerEvents: 'all',
        maxWidth: '360px',
        lineHeight: 1.4,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', color: 'inherit',
          cursor: 'pointer', opacity: 0.7, fontSize: '1.1rem',
          lineHeight: 1, padding: '0.1rem',
        }}
      >
        ×
      </button>
    </div>
  );
}

/** Provider that wraps the app and renders toast container. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container — fixed top-right */}
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed', top: '1rem', right: '1rem',
          zIndex: 99999, display: 'flex', flexDirection: 'column',
          gap: '0.5rem', pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toastOut {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
