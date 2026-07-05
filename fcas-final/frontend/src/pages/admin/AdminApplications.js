import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

const STATUSES = ['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export default function AdminApplications() {
  const [searchParams] = useSearchParams();
  const [apps, setApps] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [eligFilter, setEligFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getApplications().then(r => { setApps(r.data); setFiltered(r.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...apps];
    if (statusFilter !== 'ALL') result = result.filter(a => a.status === statusFilter);
    if (eligFilter === 'ELIGIBLE') result = result.filter(a => a.eligible);
    if (eligFilter === 'INELIGIBLE') result = result.filter(a => !a.eligible);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.userName?.toLowerCase().includes(q) ||
        a.userEmail?.toLowerCase().includes(q) ||
        a.userDepartment?.toLowerCase().includes(q) ||
        a.applyingForPost?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [apps, statusFilter, eligFilter, search]);

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📋 All Applications</h1>
          <p>Review and manage career advancement applications from faculty members.</p>
        </div>

        {/* Filters */}
        <div className="card mb-2">
          <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input style={{ flex: 1, minWidth: 200, padding: '.6rem .85rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', fontSize: '.88rem' }}
              placeholder="🔍 Search by name, email, department, post..."
              value={search} onChange={e => setSearch(e.target.value)} />

            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '.4rem' }}>
              {['ALL', 'ELIGIBLE', 'INELIGIBLE'].map(e => (
                <button key={e} onClick={() => setEligFilter(e)}
                  className={`btn btn-sm ${eligFilter === e ? 'btn-primary' : 'btn-secondary'}`}>
                  {e === 'ALL' ? 'All' : e === 'ELIGIBLE' ? '✅ Eligible' : '❌ Not Eligible'}
                </button>
              ))}
            </div>

            <span className="text-muted text-sm">{filtered.length} results</span>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><h3>No applications found.</h3></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Post Applied</th>
                    <th>API Score</th>
                    <th>Eligible</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td className="text-muted text-sm">#{a.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.userName}</div>
                        <div className="text-muted text-sm">{a.userEmail}</div>
                      </td>
                      <td className="text-muted text-sm">{a.userDepartment || '—'}</td>
                      <td><strong>{a.applyingForPost}</strong></td>
                      <td>
                        <span style={{ fontWeight: 700, color: a.calculatedApiScore >= 300 ? 'var(--success)' : 'var(--warn)' }}>
                          {a.calculatedApiScore}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${a.eligible ? 'eligible' : 'ineligible'}`}>
                          {a.eligible ? '✅ Eligible' : '❌ No'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="text-muted text-sm">{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <Link to={`/admin/applications/${a.id}`} className="btn btn-sm btn-primary">Review →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
