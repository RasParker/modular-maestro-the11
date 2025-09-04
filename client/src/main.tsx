
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers with better reporting
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise that rejected:', event.promise);
  if (event.reason instanceof Error) {
    console.error('Error stack:', event.reason.stack);
  }
  // Only prevent default for known non-critical errors
  if (event.reason && event.reason.message && event.reason.message.includes('fetch')) {
    console.warn('Network error handled gracefully');
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
