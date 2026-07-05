import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { facultyAPI } from '../../services/api';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status?.toLowerCase()}`}>{status?.replace('_', ' ')}</span>
);

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    facultyAPI.getApplications()
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="flex-between page-header">
          <div>
            <h1>📋 My Applications</h1>
            <p>Track the status of your career advancement applications.</p>
          </div>
          <Link to="/apply" className="btn btn-primary">+ New Application</Link>
        </div>

        {apps.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <div className="empty-icon">📋</div>
              <h3>No Applications Yet</h3>
              <p>You haven't submitted any career advancement applications.</p>
              <Link to="/apply" className="btn btn-primary mt-2">📝 Apply Now</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {apps.map(app => (
              <div key={app.id} className="card" style={{ cursor: 'pointer' }}
                onClick={() => setSelected(selected?.id === app.id ? null : app)}>
                <div className="card-body">
                  <div className="flex-between mb-1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.8rem' }}>
                        {app.applyingForPost === 'Assistant Professor' ? '👩‍🏫'
                          : app.applyingForPost === 'Associate Professor' ? '👨‍🏫'
                          : app.applyingForPost === 'Professor' ? '🎓' : '🏛️'}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '.2rem' }}>{app.applyingForPost}</h3>
                        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                          Submitted: {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          &nbsp;|&nbsp; App ID: #{app.id}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${app.eligible ? 'eligible' : 'ineligible'}`}>
                        {app.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.83rem', color: 'var(--text2)' }}>
                    <span>🏷️ Current: {app.currentPost || '—'}</span>
                    <span>📊 API Score: {app.calculatedApiScore}</span>
                    {app.reviewedAt && <span>📅 Reviewed: {new Date(app.reviewedAt).toLocaleDateString('en-IN')}</span>}
                  </div>

                  {/* Expanded Detail */}
                  {selected?.id === app.id && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        {/* Eligibility Details */}
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.88rem' }}>📋 Eligibility Details</div>
                          <pre style={{ fontSize: '.78rem', background: 'var(--surface2)', padding: '.75rem', borderRadius: 8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text2)', border: '1px solid var(--border)', maxHeight: 200, overflow: 'auto' }}>
                            {app.eligibilityRemarks || 'No remarks.'}
                          </pre>
                        </div>
                        {/* Admin Remarks */}
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.88rem' }}>🛡️ Admin Review</div>
                          {app.adminRemarks ? (
                            <div className={`alert alert-${app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'error' : 'info'}`}>
                              {app.adminRemarks}
                            </div>
                          ) : (
                            <div style={{ fontSize: '.85rem', color: 'var(--muted)', padding: '.75rem', background: 'var(--surface2)', borderRadius: 8 }}>
                              Pending admin review. You'll see feedback here once reviewed.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      {app.documents?.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.88rem' }}>📁 Attached Documents ({app.documents.length})</div>
                          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                            {app.documents.map(doc => (
                              doc.fileUrl ? (
                                /* Use public /files/ URL — works without JWT in new tab */
                                <a key={doc.id} href={doc.fileUrl}
                                  target="_blank" rel="noreferrer"
                                  className="btn btn-sm btn-secondary">
                                  {doc.isImage ? '🖼️' : '📄'} {doc.originalFileName}
                                </a>
                              ) : (
                                <span key={doc.id} className="btn btn-sm btn-secondary" style={{ opacity: .6 }}>
                                  📄 {doc.originalFileName}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
