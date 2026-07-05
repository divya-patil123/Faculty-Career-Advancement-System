import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

export default function AdminManage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', employeeId: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => {
    adminAPI.getAdmins().then(r => setAdmins(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      await adminAPI.createAdmin(form);
      setMsg({ type: 'success', text: '✅ Admin user created successfully!' });
      setForm({ name: '', email: '', password: '', employeeId: '', department: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create admin.' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🛡️ Admin Users</h1>
          <p>Create and manage administrator accounts for the system.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Create Admin Form */}
          <div className="card">
            <div className="card-header"><h3>➕ Create New Admin</h3></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'} mb-2`}>{msg.text}</div>}
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="name" placeholder="Admin Name" value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input name="email" type="email" placeholder="admin@college.edu" value={form.email} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handle} required minLength={6} />
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input name="employeeId" placeholder="ADMIN002" value={form.employeeId} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input name="department" placeholder="e.g., Administration" value={form.department} onChange={handle} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                  {saving ? '⏳ Creating...' : '🛡️ Create Admin User'}
                </button>
              </form>

              <div className="alert alert-info mt-2" style={{ fontSize: '.8rem' }}>
                ℹ️ Admin users have full access to review applications, manage faculty, and create more admins.
              </div>
            </div>
          </div>

          {/* Admin list */}
          <div className="card">
            <div className="card-header">
              <h3>All Administrators ({admins.length})</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div className="text-muted text-sm">{a.email}</div>
                      </td>
                      <td className="text-muted text-sm">{a.employeeId || '—'}</td>
                      <td className="text-muted text-sm">{a.department || '—'}</td>
                      <td>
                        <span className={`badge badge-${a.active ? 'active' : 'inactive'}`}>
                          {a.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-muted text-sm">
                        {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
