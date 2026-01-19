import React from 'react';

interface DemoCardProps {
  title: string;
  description: string;
  variant: 'primary' | 'secondary' | 'accent';
}

export function DemoCard(props: DemoCardProps) {
  const { title, description, variant } = props;

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
