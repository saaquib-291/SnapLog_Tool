import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/styles/theme.css';
import App from './App';

// Create root for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);