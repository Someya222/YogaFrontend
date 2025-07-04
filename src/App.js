import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/Login'; 
import Dashboard from './Pages/Dashboard';
import Home from './Pages/Home';
import RoutinePlan from './Pages/RoutinePlan';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routine" element={<RoutinePlan />} />
        </Routes>
      </Router>
      <Footer />
    </>
  );
}

export default App;
