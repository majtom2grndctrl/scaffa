import React from 'react';
import { ScaffaInstance, useScaffaInstance } from '@scaffa/react-runtime-adapter';

interface DemoButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}

function DemoButtonInner(props: DemoButtonProps) {
  // Apply overrides to props (instanceId comes from ScaffaInstance context)
  const effectiveProps = useScaffaInstance(props);

  const { label, variant, onClick } = effectiveProps;

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

export function DemoButton(props: DemoButtonProps) {
  return (
    <ScaffaInstance typeId="demo.button" displayName="Button">
      <DemoButtonInner {...props} />
    </ScaffaInstance>
  );
}
