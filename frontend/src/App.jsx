import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Auth from './components/Auth';
import GigList from './components/GigList';
import BookingHistory from './components/BookingHistory';
import FinanceDashboard from './components/FinanceDashboard';
import AdminPanel from './components/AdminPanel';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('gigs');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api('/auth/me')
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setView('gigs');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
    setView('gigs');
  }

  async function handleBook(gigId) {
    try {
      await api('/bookings', { method: 'POST', body: JSON.stringify({ gigId }) });
      toast.success('Booking confirmed! Transaction recorded.');
      setView('bookings');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!user) return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
          },
        }}
      />
      <Auth onLogin={handleLogin} />
    </>
  );

  const avatarChar = (user.name || user.email)[0].toUpperCase();

  return (
    <div className="app-layout">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
          },
        }}
      />

      <header className="app-header">
        <div className="header-brand">
          <div className="header-brand-icon">H+</div>
          <h1>HustleHub+</h1>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-btn${view === 'gigs' ? ' active' : ''}`}
            onClick={() => setView('gigs')}
          >
            Gigs
          </button>
          <button
            className={`nav-btn${view === 'bookings' ? ' active' : ''}`}
            onClick={() => setView('bookings')}
          >
            My Bookings
          </button>
          {user.role === 'freelancer' && (
            <button
              className={`nav-btn${view === 'finance' ? ' active' : ''}`}
              onClick={() => setView('finance')}
            >
              Finance
            </button>
          )}
          {user.role === 'admin' && (
            <button
              className={`nav-btn${view === 'admin' ? ' active' : ''}`}
              onClick={() => setView('admin')}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="header-user">
          <div className="user-pill">
            <div className="user-avatar">{avatarChar}</div>
            {user.name || user.email}
            <span className={`badge badge-${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'gigs' && <GigList user={user} onBook={handleBook} />}
        {view === 'bookings' && <BookingHistory user={user} />}
        {view === 'finance' && user.role === 'freelancer' && <FinanceDashboard />}
        {view === 'admin' && user.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
