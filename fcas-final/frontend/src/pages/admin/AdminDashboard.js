import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), adminAPI.getApplications()])
      .then(([s, a]) => { setStats(s.data); setRecentApps(a.data.slice(0, 8)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Faculty Career Advancement System — Administrative Overview</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="stat-card stat-blue">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-value">{stats?.totalFaculty || 0}</div>
            <div className="stat-label">Total Faculty</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats?.totalApplications || 0}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{stats?.pendingApplications || 0}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats?.approvedApplications || 0}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats?.rejectedApplications || 0}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card stat-teal">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats?.eligibleApplications || 0}</div>
            <div className="stat-label">Eligible Apps</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <Link to="/admin/applications" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                📋 Review Applications
              </Link>
              <Link to="/admin/applications?status=PENDING" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                ⏳ View Pending ({stats?.pendingApplications || 0})
              </Link>
              <Link to="/admin/faculty" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                👨‍🏫 Manage Faculty
              </Link>
              <Link to="/admin/manage" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                🛡️ Admin Users
              </Link>
            </div>
          </div>

          {/* Eligibility Summary */}
          <div className="card">
            <div className="card-header"><h3>Application Eligibility Summary</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'Poppins,sans-serif' }}>
                    {stats?.eligibleApplications || 0}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>Eligible Applications</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'Poppins,sans-serif' }}>
                    {stats?.ineligibleApplications || 0}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>Ineligible Applications</div>
                </div>
              </div>
              {/* Progress bar */}
              {stats?.totalApplications > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: 'var(--muted)', marginBottom: '.4rem' }}>
                    <span>Eligibility Rate</span>
                    <span>{Math.round((stats.eligibleApplications / stats.totalApplications) * 100)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--success)', borderRadius: 4, width: `${(stats.eligibleApplications / stats.totalApplications) * 100}%`, transition: 'width .5s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Applications</h3>
            <Link to="/admin/applications" className="btn btn-sm btn-outline">View All →</Link>
          </div>
          <div className="table-wrap">
            {recentApps.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><p>No applications submitted yet.</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Applying For</th>
                    <th>API Score</th>
                    <th>Eligible</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map(a => (
                    <tr key={a.id}>
                      <td className="text-muted">#{a.id}</td>
                      <td><strong>{a.userName}</strong><br /><span className="text-muted text-sm">{a.userEmail}</span></td>
                      <td className="text-muted text-sm">{a.userDepartment || '—'}</td>
                      <td><strong>{a.applyingForPost}</strong></td>
                      <td><strong>{a.calculatedApiScore}</strong></td>
                      <td>
                        <span className={`badge badge-${a.eligible ? 'eligible' : 'ineligible'}`}>
                          {a.eligible ? '✅ Yes' : '❌ No'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status?.replace('_',' ')}</span>
                      </td>
                      <td className="text-muted text-sm">{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <Link to={`/admin/applications/${a.id}`} className="btn btn-sm btn-outline">Review</Link>
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
