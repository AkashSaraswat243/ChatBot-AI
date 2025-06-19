// src/index.js (Corrected)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter here
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>  {/* Wrap the App component with BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);