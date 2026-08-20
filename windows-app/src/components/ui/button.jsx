import React from 'react';
import './table-styles.css';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) {
  const variantClass = `ui-btn-${variant}`;
  const sizeClass = `ui-btn-size-${size}`;
  return (
    <button className={`ui-btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
