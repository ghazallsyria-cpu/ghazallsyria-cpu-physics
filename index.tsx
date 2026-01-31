import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import 'katex/dist/katex.min.css';

// Handle PWA and Storage safely
const initStorage = () => {
  try {
    const sessionCount = parseInt(localStorage.getItem('ssc_sessions') || '0');
    localStorage.setItem('ssc_sessions', (sessionCount + 1).toString());
  } catch (e) {
    console.warn('Storage access restricted:', e);
  }
};

initStorage();

// PWA Registration with relative path fallback
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('SSC SW Registered!', reg.scope))
      .catch(err => {
        console.warn('SW Registration Warning:', err.message || err);
      });
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
