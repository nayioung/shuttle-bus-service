
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  hideCancel = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 backdrop-blur-md rounded-[14px] w-full max-w-[280px] overflow-hidden flex flex-col items-center">
        <div className="p-4 text-center">
          <h3 className="text-[17px] font-semibold text-black leading-tight mb-1">{title}</h3>
          <p className="text-[13px] text-black leading-tight whitespace-pre-wrap">{description}</p>
        </div>
        
        <div className="w-full flex border-t border-[#C6C6C8]">
          {!hideCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 text-[17px] text-[#007AFF] font-normal border-r border-[#C6C6C8] active:bg-black/5 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-[17px] text-[#007AFF] transition-colors active:bg-black/5 ${hideCancel ? 'font-normal' : 'font-semibold'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
