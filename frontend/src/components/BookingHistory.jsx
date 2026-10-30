import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingHistory({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/bookings/mine')
      .then((data) => setBookings(data.bookings))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isClient = user.role === 'client';
  const total = bookings.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <section className="booking-section">
      <div className="page-header">
        <h2>Booking History</h2>
        {bookings.length > 0 && (
          <p>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} · Total R{total.toFixed(2)}</p>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />
          <div className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />
          <div className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>
            {isClient
              ? 'Book a freelancer to see your history here.'
              : 'Your booking history will appear here.'}
          </p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card">
              <div className="booking-info">
                <div className="booking-title">
                  {isClient ? 'Service booking' : 'Service provided'}
                </div>
                <div className="booking-meta">
                  <span>
                    {isClient ? `Freelancer: ${b.freelancerId}` : `Client: ${b.clientId}`}
                  </span>
                  <span>{formatDate(b.createdAt)}</span>
                </div>
              </div>
              <div className="booking-amount">R{Number(b.amount).toFixed(2)}</div>
              <span className="badge badge-confirmed">Confirmed</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
