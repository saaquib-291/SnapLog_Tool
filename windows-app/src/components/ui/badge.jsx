import React from 'react';
import './table-styles.css';

export function Badge({ children, variant = 'secondary', className = '', ...props }) {
  const variantClass = `ui-badge-${variant}`;
  return (
    <span className={`ui-badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
