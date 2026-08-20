import React, { useEffect, useRef } from 'react';
import './table-styles.css';

export function Checkbox({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  className = '',
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={!!checked}
      data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      className={`ui-checkbox ${className}`}
      {...props}
    />
  );
}

export default Checkbox;
