import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const MAX_DESC = 1000;

export default function GigForm({ gig, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: gig?.title || '',
    description: gig?.description || '',
    price: gig?.price || '',
  });
  const [saving, setSaving] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
      };
      if (gig) {
        await api(`/gigs/${gig._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/gigs', { method: 'POST', body: JSON.stringify(payload) });
      }
      toast.success(gig ? 'Gig updated successfully!' : 'Gig created successfully!');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{gig ? 'Edit Gig' : 'Create Gig'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="gig-title">Title</label>
            <input
              id="gig-title"
              type="text"
              value={form.title}
              onChange={update('title')}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g. Professional logo design"
            />
          </div>
          <div className="form-group">
            <label htmlFor="gig-desc">Description</label>
            <textarea
              id="gig-desc"
              value={form.description}
              onChange={update('description')}
              required
              minLength={10}
              maxLength={MAX_DESC}
              rows={4}
              placeholder="Describe what you offer..."
            />
            <div className="char-count">
              {form.description.length} / {MAX_DESC}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="gig-price">Price (R)</label>
            <input
              id="gig-price"
              type="number"
              min={1}
              max={1000000}
              step="0.01"
              value={form.price}
              onChange={update('price')}
              required
              placeholder="0.00"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
