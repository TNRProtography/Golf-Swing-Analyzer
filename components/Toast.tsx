import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, show, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // FIX: Use `ReturnType<typeof setTimeout>` for browser compatibility instead of `NodeJS.Timeout`.
    let hideTimer: ReturnType<typeof setTimeout>;
    // FIX: Use `ReturnType<typeof setTimeout>` for browser compatibility instead of `NodeJS.Timeout`.
    let unmountTimer: ReturnType<typeof setTimeout>;

    if (show) {
      setIsVisible(true);
      hideTimer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for fade-out animation before calling onClose
        unmountTimer = setTimeout(onClose, 300); 
      }, duration);
    } else {
      setIsVisible(false);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
  }, [show, duration, onClose]);
  
  if (!show) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } bg-golf-green-light text-white z-50`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};
