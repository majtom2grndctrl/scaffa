import React from 'react';

interface DemoButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}

export function DemoButton(props: DemoButtonProps) {
  const { label, variant, onClick } = props;

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
    },
  };

  return (
    <button style={styles[variant]} onClick={onClick}>
      {label}
    </button>
  );
}
