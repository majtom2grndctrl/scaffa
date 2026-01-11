import React from 'react';
import { ScaffaInstance, useScaffaInstance } from '@scaffa/react-runtime-adapter';

interface DemoCardProps {
  title: string;
  description: string;
  variant: 'primary' | 'secondary' | 'accent';
}

function DemoCardInner(props: DemoCardProps) {
  // Apply overrides to props (instanceId comes from ScaffaInstance context)
  const effectiveProps = useScaffaInstance(props);

  const { title, description, variant } = effectiveProps;

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: '#eff6ff',
      border: '1px solid #3b82f6',
    },
    secondary: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: '#f3f4f6',
      border: '1px solid #6b7280',
    },
    accent: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
    },
  };

  return (
    <div style={styles[variant]}>
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
        {title}
      </h2>
      <p style={{ margin: 0, color: '#6b7280' }}>{description}</p>
    </div>
  );
}

export function DemoCard(props: DemoCardProps) {
  return (
    <ScaffaInstance typeId="demo.card" displayName="Card">
      <DemoCardInner {...props} />
    </ScaffaInstance>
  );
}
