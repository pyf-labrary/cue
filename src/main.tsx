import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// HashRouter avoids the GH Pages SPA-routing 404 problem. URLs look like
// /cue/#/scenes/jaws — uglier but bulletproof on any static host.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
