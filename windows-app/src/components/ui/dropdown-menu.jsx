import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import './table-styles.css';

const DropdownContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="dropdown-container" ref={menuRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, render, asChild }) {
  const { open, setOpen } = useContext(DropdownContext);

  const toggle = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (render) {
    return React.cloneElement(render, {
      onClick: toggle,
      'aria-expanded': open
    });
  }

  return (
    <div onClick={toggle} style={{ display: 'inline-block', cursor: 'pointer' }}>
      {children}
    </div>
  );
}

export function DropdownMenuContent({ children, align = 'start', className = '' }) {
  const { open } = useContext(DropdownContext);
  if (!open) return null;

  return (
    <div
      className={`dropdown-content ${className}`}
      style={{
        [align === 'end' ? 'right' : 'left']: 0
      }}
    >
      {children}
    </div>
  );
}

export function DropdownMenuGroup({ children }) {
  return <div>{children}</div>;
}

export function DropdownMenuLabel({ children, className = '' }) {
  return <div className={`dropdown-label ${className}`}>{children}</div>;
}

export function DropdownMenuItem({ children, onClick, variant = 'default', className = '' }) {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    setOpen(false);
  };

  const variantClass = variant === 'destructive' ? 'dropdown-item-destructive' : '';

  return (
    <div className={`dropdown-item ${variantClass} ${className}`} onClick={handleClick}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`dropdown-separator ${className}`} />;
}

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  closeOnClick = true,
  className = ''
}) {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onCheckedChange) onCheckedChange(!checked);
    if (closeOnClick) setOpen(false);
  };

  return (
    <div className={`dropdown-item ${className}`} onClick={handleClick}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={() => {}}
        style={{ marginRight: '0.5rem', pointerEvents: 'none' }}
      />
      <span>{children}</span>
    </div>
  );
}
