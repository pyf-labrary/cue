import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import './styles/index.css';

// HashRouter avoids the GH Pages SPA-routing 404 problem. URLs look like
// /cue/#/scenes/jaws — uglier but bulletproof on any static host.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
