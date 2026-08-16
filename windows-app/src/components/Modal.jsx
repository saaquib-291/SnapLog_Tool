import React from 'react';

const Modal = ({ show, onClose, children, className = '' }) => {
  if (!show) {
    return null;
  }

  return (
    <div className={`modal-backdrop ${className}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;