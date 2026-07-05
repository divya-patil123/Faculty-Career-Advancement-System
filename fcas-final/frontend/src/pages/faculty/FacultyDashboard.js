import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { facultyAPI } from '../../services/api';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    facultyAPI.profileExists().then(r => {
      setHasProfile(r.data.exists);
      if (r.data.exists) {
        facultyAPI.getProfile().then(p => setProfile(p.data)).catch(() => {});
      }
    }).catch(() => {});
    facultyAPI.getApplications().then(r => setApps(r.data)).catch(() => {});
  }, []);

  const pending = apps.filter(a => a.status === 'PENDING').length;
  const approved = apps.filter(a => a.status === 'APPROVED').length;
  const eligible = apps.filter(a => a.eligible).length;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Faculty Career Advancement System — {user?.department || 'Engineering College'}</p>
        </div>

        {!hasProfile && (
          <div className="alert alert-warn mb-2">
            ⚠️ Your academic profile is incomplete. <Link to="/profile"><strong>Complete your profile</strong></Link> to check eligibility and submit applications.
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{apps.length}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{profile?.apiScore || 0}</div>
            <div className="stat-label">Your API Score</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <Link to="/profile" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                👤 {hasProfile ? 'Update Academic Profile' : 'Create Academic Profile'}
              </Link>
              <Link to="/eligibility" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                ✅ Check Post Eligibility
              </Link>
              <Link to="/apply" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                📝 Submit Advancement Application
              </Link>
              <Link to="/documents" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                📁 Manage Documents
              </Link>
            </div>
          </div>

          {/* Profile Snapshot */}
          <div className="card">
            <div className="card-header"><h3>Profile Snapshot</h3></div>
            <div className="card-body">
              {profile ? (
                <table style={{ width: '100%', fontSize: '.88rem' }}>
                  <tbody>
                    <tr><td className="text-muted text-sm" style={{paddingBottom:'.5rem'}}>PG Degree</td><td><strong>{profile.pgDegree || '—'} {profile.pgBranch ? `(${profile.pgBranch})` : ''}</strong></td></tr>
                    <tr><td className="text-muted text-sm" style={{paddingBottom:'.5rem'}}>PhD</td><td><strong>{profile.phdDone ? '✅ Completed' : '❌ Not completed'}</strong></td></tr>
                    <tr><td className="text-muted text-sm" style={{paddingBottom:'.5rem'}}>Teaching Exp.</td><td><strong>{profile.teachingExperienceYears || 0} years</strong></td></tr>
                    <tr><td className="text-muted text-sm" style={{paddingBottom:'.5rem'}}>Publications</td><td><strong>{(profile.sciPublications||0)+(profile.scopusPublications||0)+(profile.ugcCarePublications||0)} indexed</strong></td></tr>
                    <tr><td className="text-muted text-sm">Current Post</td><td><strong>{profile.currentPost || '—'}</strong></td></tr>
                  </tbody>
                </table>
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <div className="empty-icon">👤</div>
                  <p>No profile yet. <Link to="/profile">Create it now →</Link></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        {apps.length > 0 && (
          <div className="card mt-2">
            <div className="card-header">
              <h3>Recent Applications</h3>
              <Link to="/my-applications" className="btn btn-sm btn-outline">View All</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Post Applied</th><th>Eligible</th><th>Status</th><th>Submitted</th></tr></thead>
                <tbody>
                  {apps.slice(0, 5).map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.applyingForPost}</strong></td>
                      <td><span className={`badge badge-${a.eligible ? 'eligible' : 'ineligible'}`}>{a.eligible ? '✅ Eligible' : '❌ Not Eligible'}</span></td>
                      <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status.replace('_',' ')}</span></td>
                      <td className="text-muted text-sm">{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
