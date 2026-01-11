import React from 'react';
import ReactDOM from 'react-dom/client';
import { ScaffaProvider } from '@scaffa/react-runtime-adapter';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ScaffaProvider
      config={{
        adapterId: 'react',
        adapterVersion: '0.1.0',
        debug: true,
      }}
    >
      <App />
    </ScaffaProvider>
  </React.StrictMode>
);
