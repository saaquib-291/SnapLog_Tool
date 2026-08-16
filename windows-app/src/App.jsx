import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;