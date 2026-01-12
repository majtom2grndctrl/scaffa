import React from 'react';
import { useScaffaRouterState } from '@scaffa/react-runtime-adapter';
import { DemoButton } from './components/DemoButton';
import { DemoCard } from './components/DemoCard';

export function App() {
  // Capture and report router state to Scaffa
  useScaffaRouterState();

  const [count, setCount] = React.useState(0);

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginBottom: '2rem' }}>Scaffa Demo App</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <DemoCard
          title="Welcome to Scaffa"
          description="This is a demo app to validate the React runtime adapter. Click on components to select them!"
          variant="primary"
        />

        <DemoCard
          title="Interactive Counter"
          description={`You've clicked ${count} times`}
          variant="secondary"
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <DemoButton
            label="Increment"
            variant="primary"
            onClick={() => setCount(count + 1)}
          />
          <DemoButton label="Reset" variant="secondary" onClick={() => setCount(0)} />
        </div>

        <DemoCard
          title="Try Override"
          description="Select this card and try changing the title or variant in Scaffa's inspector!"
          variant="accent"
        />
      </div>
    </div>
  );
}
