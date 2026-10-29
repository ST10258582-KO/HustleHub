import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = getPasswordStrength(password);
  let level, label;
  if (score <= 2) { level = 'weak'; label = 'Weak'; }
  else if (score <= 4) { level = 'medium'; label = 'Medium'; }
  else { level = 'strong'; label = 'Strong'; }

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div className={`strength-fill strength-${level}`} />
      </div>
      <span className="strength-label">Password strength: {label}</span>
    </div>
  );
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Account created! Please sign in.');
        setMode('login');
        setForm((prev) => ({ ...prev, name: '', password: '' }));
      } else {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">H+</div>
          <h1>HustleHub+</h1>
        </div>
        <p className="tagline">The secure freelance marketplace</p>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={update('name')}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
              required
            />
            {mode === 'register' && <PasswordStrength password={form.password} />}
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="role">I am a</label>
              <select id="role" value={form.role} onChange={update('role')}>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            className="btn-link"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </main>
  );
}
