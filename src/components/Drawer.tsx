import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
            <div className="flex-1 p-6">
              {children}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
