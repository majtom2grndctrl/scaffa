// ─────────────────────────────────────────────────────────────────────────────
// Demo App Production Entry Point
// ─────────────────────────────────────────────────────────────────────────────
// This is the production bootstrap. It:
// - Mounts the App component
// - Can add production-only providers (error boundaries, analytics, auth, etc.)
// - Has NO Scaffa dependencies
//
// ARCHITECTURE:
// - main.tsx is for PRODUCTION only - Scaffa never loads this file
// - Scaffa uses preview.entry (App.tsx) which contains the Router
// - Production-only providers go here, not in App.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {/* 
      Production-only providers can go here.
      Examples:
      - <ErrorBoundary>
      - <AnalyticsProvider>
      - <AuthProvider>
      
      These should NOT be in App.tsx because they might:
      - Make external API calls that don't work in preview
      - Have side effects that interfere with Scaffa's inspection
      - Require production secrets/config
    */}
    <App />
  </React.StrictMode>
);
