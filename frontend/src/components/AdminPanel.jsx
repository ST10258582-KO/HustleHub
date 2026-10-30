import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    Promise.all([
      api('/admin/users').then((d) => setUsers(d.users)),
      api('/admin/gigs').then((d) => setGigs(d.gigs)),
    ])
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function removeUser(id) {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
      toast.success('User deleted.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function removeGig(id) {
    if (!window.confirm('Permanently delete this gig?')) return;
    try {
      await api(`/admin/gigs/${id}`, { method: 'DELETE' });
      setGigs((prev) => prev.filter((g) => g._id !== id));
      toast.success('Gig removed.');
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <section className="admin-panel">
      <h2>Admin Panel</h2>
      <p className="admin-stats-line">
        {users.length} user{users.length !== 1 ? 's' : ''} &middot; {gigs.length} gig{gigs.length !== 1 ? 's' : ''}
      </p>

      <div className="tabs">
        <button
          className={`tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab${tab === 'gigs' ? ' active' : ''}`}
          onClick={() => setTab('gigs')}
        >
          Gigs ({gigs.length})
        </button>
      </div>

      {loading ? (
        <div>
          <div className="skeleton" style={{ height: '48px', borderRadius: '10px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '48px', borderRadius: '10px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '48px', borderRadius: '10px' }} />
        </div>
      ) : tab === 'users' ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removeUser(u._id || u.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((g) => (
                <tr key={g._id}>
                  <td>{g.title}</td>
                  <td>R{Number(g.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${g.active ? 'active' : 'inactive'}`}>
                      {g.active ? 'Active' : 'Deleted'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeGig(g._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
