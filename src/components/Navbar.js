import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggle = () => setMenuOpen((prev) => !prev);
  const handleClose = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">Yoga</div>
      <div className="navbar-hamburger" onClick={handleToggle} aria-label="Toggle navigation" tabIndex={0} role="button" onKeyPress={e => { if (e.key === 'Enter') handleToggle(); }}>
        <span></span>
      </div>
      <ul className={`navbar-links${menuOpen ? ' open' : ''}`} onClick={handleClose}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/routine">Your Yoga Routine</Link></li>
      </ul>
    </nav>
  );
}


export default Navbar;
