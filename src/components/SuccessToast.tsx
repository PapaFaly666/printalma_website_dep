import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessToastProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  isVisible,
  message,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Succès !
            </p>
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast; 