// src/App.js (Corrected)

import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Remove BrowserRouter from here
import ChatWindow from './components/ChatWindow.jsx'; 
import Profile from './components/Profile.jsx';

function App() {
  return (
    // The <Router> component is no longer needed here
    <div className="App">
      <Routes>
        <Route path="/" element={<ChatWindow />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;