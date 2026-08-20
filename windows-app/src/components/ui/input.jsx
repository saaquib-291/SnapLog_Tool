import React from 'react';
import './table-styles.css';

export function Input({ className = '', ...props }) {
  return <input className={`table-input ${className}`} {...props} />;
}

export default Input;
