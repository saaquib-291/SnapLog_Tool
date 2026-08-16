import React from 'react';
import './table-styles.css';

export function Table({ children, className = '', ...props }) {
  return (
    <table className={`ui-table ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`ui-table-header ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`ui-table-body ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`ui-table-head ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`ui-table-cell ${className}`} {...props}>
      {children}
    </td>
  );
}
