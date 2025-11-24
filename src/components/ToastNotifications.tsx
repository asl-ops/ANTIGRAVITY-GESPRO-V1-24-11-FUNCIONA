
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  const ICONS = {
    success: <CheckCircleIcon />,
    error: <XCircleIcon />,
    info: <InformationCircleIcon />,
    warning: <ExclamationTriangleIcon />,
  };

  const BG_COLORS = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
  };

  return (
    <div className={`relative w-full max-w-sm rounded-lg shadow-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden ${BG_COLORS[toast.type]} text-white`}>
      <div className="w-0 flex-1 p-4"><div className="flex items-start"><div className="flex-shrink-0 pt-0.5">{ICONS[toast.type]}</div><div className="ml-3 w-0 flex-1"><p className="text-sm font-medium">{toast.message}</p></div></div></div>
      <div className="flex border-l border-white border-opacity-30"><button onClick={() => onDismiss(toast.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"><XMarkIcon /></button></div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
  const handleDismiss = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />)}
      </div>
    </div>
  );
};

export default ToastContainer;