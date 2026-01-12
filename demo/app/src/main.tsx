import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ScaffaProvider } from '@scaffa/react-runtime-adapter';
import { routes } from './routes';
import './index.css';

const router = createBrowserRouter(routes);

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
      <RouterProvider router={router} />
    </ScaffaProvider>
  </React.StrictMode>
);
