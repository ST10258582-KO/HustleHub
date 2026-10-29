import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import GigForm from './GigForm';

export default function GigList({ user, onBook }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGig, setEditGig] = useState(null);

  async function loadGigs() {
    try {
      const data = await api('/gigs');
      setGigs(data.gigs);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGigs();
  }, []);

  async function handleDelete(gig) {
    if (!window.confirm(`Delete "${gig.title}"?`)) return;
    try {
      await api(`/gigs/${gig._id}`, { method: 'DELETE' });
      toast.success('Gig deleted.');
      await loadGigs();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openCreate() {
    setEditGig(null);
    setShowForm(true);
  }

  function openEdit(gig) {
    setEditGig(gig);
    setShowForm(true);
  }

  async function handleSave() {
    setShowForm(false);
    setEditGig(null);
    await loadGigs();
  }

  const userId = user.id || user._id;

  return (
    <section className="gig-section">
      <div className="section-header">
        <div>
          <h2>Available Gigs</h2>
          {user.role === 'freelancer' && (
            <p className="section-subtitle">Manage and showcase your services</p>
          )}
        </div>
        {user.role === 'freelancer' && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New Gig
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-grid">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No gigs available yet</h3>
          <p>
            {user.role === 'freelancer'
              ? 'Create your first gig to get started.'
              : 'Check back soon for available services.'}
          </p>
        </div>
      ) : (
        <div className="gig-grid">
          {gigs.map((gig) => {
            const isOwner =
              user.role === 'freelancer' && String(gig.freelancerId) === String(userId);
            return (
              <div key={gig._id} className="gig-card">
                {isOwner && (
                  <div className="gig-owner-badge">
                    <span>✦</span> Your gig
                  </div>
                )}
                <h3>{gig.title}</h3>
                <p>{gig.description}</p>
                <span className="gig-price">R{Number(gig.price).toFixed(2)}</span>
                <div className="gig-actions">
                  {user.role === 'client' && (
                    <button className="btn btn-primary" onClick={() => onBook(gig._id)}>
                      Book Now
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(gig)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(gig)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <GigForm
          gig={editGig}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  );
}
