'use client';

import { useEffect } from 'react';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: AlertType;
  title?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Alert({
  isOpen,
  onClose,
  message,
  type = 'info',
  title,
  autoClose = false,
  autoCloseDelay = 3000,
}: AlertProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: 'text-red-600',
      titleColor: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      focusRing: 'focus:ring-red-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      titleColor: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      focusRing: 'focus:ring-yellow-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      titleColor: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      focusRing: 'focus:ring-blue-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-800',
      icon: 'text-green-600',
      titleColor: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      focusRing: 'focus:ring-green-500',
    },
  };

  const styles = typeStyles[type];
  const defaultTitle = title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'info' ? 'Information' : 'Success');

  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✓',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-lg w-full max-w-md p-6 relative`}
        role="alert"
        aria-live="assertive"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          <div className={`text-2xl flex-shrink-0 ${styles.icon}`}>
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg mb-2 ${styles.titleColor}`}>
              {defaultTitle}
            </h3>
            <p className={`${styles.text} text-sm`}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`${styles.button} ${styles.focusRing} text-white font-semibold px-6 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
