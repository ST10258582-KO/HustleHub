import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('./services/api', () => ({
  api: vi.fn(),
}));

import { api } from './services/api';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the auth form when not logged in', () => {
    api.mockResolvedValue({});
    render(<App />);
    expect(screen.getByRole('heading', { name: /HustleHub\+/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('switches to registration mode when clicking create account', async () => {
    api.mockResolvedValue({});
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /don't have an account/i });
    await userEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    api.mockRejectedValue(new Error('Invalid email or password.'));
    render(<App />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
  });

  it('shows the main app after successful login', async () => {
    api
      .mockResolvedValueOnce({
        token: 'fake-token',
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'client' },
      })
      .mockResolvedValueOnce({ gigs: [] });

    render(<App />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBe('fake-token');
  });
});
