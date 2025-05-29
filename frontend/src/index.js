// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming you have a basic CSS reset or Tailwind setup here
import App from './App'; // Or './App.jsx' if you named it that

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);