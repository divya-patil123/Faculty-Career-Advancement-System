import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

const Field = ({ label, value }) => (
  <div style={{ marginBottom: '.75rem' }}>
    <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.2rem' }}>{label}</div>
    <div style={{ fontSize: '.9rem', fontWeight: 500 }}>{value ?? '—'}</div>
  </div>
);

const isImg = ct => ct && ct.startsWith('image/');
const isPdf = ct => ct && ct.includes('application/pdf');

// ── Inline document preview modal ────────────────────────────────────────────
// Works for BOTH new docs (fileUrl set) and old docs (fetches via JWT blob)
function DocPreviewModal({ doc, onClose }) {
  const [blobUrl, setBlobUrl]  = useState(null);
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState(null);
  const prevBlob = useRef(null);

  // Use public URL if available; otherwise fetch via admin JWT endpoint
  const viewUrl = doc.fileUrl || blobUrl;

  useEffect(() => {
    // Close on ESC
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (doc.fileUrl) return; // public URL already available — no need to fetch
    setLoading(true);
    setError(null);
    adminAPI.downloadDocument(doc.id)
      .then(res => {
        const blob = new Blob([res.data], {
          type: res.headers['content-type'] || doc.contentType || 'application/octet-stream'
        });
        const url = URL.createObjectURL(blob);
        if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
        prevBlob.current = url;
        setBlobUrl(url);
      })
      .catch(() => setError('Could not load this document.'))
      .finally(() => setLoading(false));

    return () => { if (prevBlob.current) URL.revokeObjectURL(prevBlob.current); };
  }, [doc]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)',
        zIndex: 9000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backdropFilter: 'blur(6px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 940,
        background: 'var(--surface)', borderRadius: '12px 12px 0 0',
        padding: '.8rem 1.25rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{isPdf(doc.contentType) ? '📕' : isImg(doc.contentType) ? '🖼️' : '📄'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{doc.originalFileName}</div>
            <div style={{ fontSize: '.73rem', color: 'var(--muted)' }}>
              {doc.documentType?.replace(/_/g, ' ')} &nbsp;·&nbsp; {doc.contentType}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
              ↗ Open in Tab
            </a>
          )}
          <button className="btn btn-sm btn-secondary" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {/* Preview body */}
      <div style={{
        width: '100%', maxWidth: 940, background: '#111',
        borderRadius: '0 0 12px 12px', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 280, maxHeight: '78vh', flexShrink: 0,
      }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', borderColor: '#555', borderTopColor: '#fff' }} />
            <p>Loading document...</p>
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: 'center', color: '#f87171', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <p style={{ fontSize: '.8rem', color: '#aaa', marginTop: '.5rem' }}>File may have been deleted from server.</p>
          </div>
        )}
        {!loading && !error && viewUrl && isImg(doc.contentType) && (
          <img src={viewUrl} alt={doc.originalFileName}
            style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block' }} />
        )}
        {!loading && !error && viewUrl && isPdf(doc.contentType) && (
          <iframe src={viewUrl} title={doc.originalFileName}
            style={{ width: '100%', height: '78vh', border: 'none', display: 'block' }} />
        )}
        {!loading && !error && viewUrl && !isImg(doc.contentType) && !isPdf(doc.contentType) && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p style={{ marginBottom: '1rem' }}>This file type cannot be previewed here.</p>
            <a href={viewUrl} target="_blank" rel="noreferrer" className="btn btn-primary">↗ Open in New Tab</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Document row with thumbnail + view button ─────────────────────────────────
function DocRow({ doc, onView }) {
  const [thumbUrl, setThumbUrl] = useState(doc.fileUrl || null);
  const [thumbErr, setThumbErr] = useState(false);
  const fetched = useRef(false);

  // Auto-fetch thumbnail for images that don't have a public fileUrl
  useEffect(() => {
    if (!isImg(doc.contentType) || thumbUrl || fetched.current) return;
    fetched.current = true;
    adminAPI.downloadDocument(doc.id)
      .then(res => {
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'image/jpeg' });
        setThumbUrl(URL.createObjectURL(blob));
      })
      .catch(() => setThumbErr(true));
  }, [doc, thumbUrl]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.85rem',
      padding: '.65rem .85rem', border: '1px solid var(--border)',
      borderRadius: 8, background: 'var(--surface2)', transition: 'background .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
    >
      {/* Thumbnail */}
      <div style={{ width: 48, height: 48, flexShrink: 0, cursor: 'pointer' }} onClick={() => onView(doc)}>
        {isImg(doc.contentType) && thumbUrl && !thumbErr ? (
          <img src={thumbUrl} alt=""
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
            onError={() => setThumbErr(true)} />
        ) : isImg(doc.contentType) && !thumbErr ? (
          <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--border)', borderRadius: 6 }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          </div>
        ) : (
          <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--border)', borderRadius: 6, fontSize: '1.6rem' }}>
            {thumbErr ? '🖼️' : isPdf(doc.contentType) ? '📕' : '📄'}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.originalFileName}
        </div>
        <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: '.15rem' }}>
          {doc.documentType?.replace(/_/g, ' ')} &nbsp;·&nbsp;
          {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* View button — always works via blob fallback */}
      <button className="btn btn-sm btn-outline" style={{ flexShrink: 0 }} onClick={() => onView(doc)}>
        👁️ View
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminApplicationDetail() {
  const { id } = useParams();
  const [app,     setApp]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);   // doc shown in modal

  const loadApp = useCallback(() => {
    adminAPI.getApplication(id)
      .then(r => {
        setApp(r.data);
        setStatus(r.data.status);
        setRemarks(r.data.adminRemarks || '');
        return adminAPI.getFacultyProfile(r.data.userId);
      })
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadApp(); }, [loadApp]);

  const submit = async () => {
    if (!status) { setMsg({ type: 'error', text: 'Please select a decision.' }); return; }
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      const r = await adminAPI.reviewApplication(id, { status, adminRemarks: remarks });
      setApp(r.data);
      setMsg({ type: 'success', text: '✅ Review saved successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main>
    </div>
  );
  if (!app) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="alert alert-error">Application not found.</div></main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* Page header */}
        <div className="flex-between page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ marginBottom: '.5rem' }}>
              <Link to="/admin/applications" className="text-muted text-sm">← Back to Applications</Link>
            </div>
            <h1>Application #{app.id} — {app.applyingForPost}</h1>
            <p>Faculty: <strong>{app.userName}</strong> &nbsp;|&nbsp; {app.userEmail} &nbsp;|&nbsp; {app.userDepartment || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <span className={`badge badge-${app.eligible ? 'eligible' : 'ineligible'}`} style={{ fontSize: '.85rem', padding: '.4rem .9rem' }}>
              {app.eligible ? '✅ Eligible' : '❌ Not Eligible'}
            </span>
            <span className={`badge badge-${app.status?.toLowerCase()}`} style={{ fontSize: '.85rem', padding: '.4rem .9rem' }}>
              {app.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Eligibility report */}
            <div className="card">
              <div className="card-header">
                <h3>📊 Eligibility Report</h3>
                <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                  API Score: {app.calculatedApiScore}
                  {app.criteriaVersion && <span style={{ fontSize: '.75rem', color: 'var(--muted)', marginLeft: '.5rem' }}>(criteria v{app.criteriaVersion})</span>}
                </span>
              </div>
              <div className="card-body">
                <pre style={{
                  fontSize: '.82rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                  color: 'var(--text2)', lineHeight: 1.8, maxHeight: 240, overflow: 'auto',
                }}>
                  {app.eligibilityRemarks || 'No eligibility data.'}
                </pre>
              </div>
            </div>

            {/* Application snapshot */}
            <div className="card">
              <div className="card-header"><h3>📋 Application Snapshot</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  <Field label="Applying For"       value={app.applyingForPost} />
                  <Field label="Current Post"       value={app.currentPost} />
                  <Field label="PG Branch"          value={app.pgBranch} />
                  <Field label="PG Percentage"      value={app.pgPercentage ? `${app.pgPercentage}%` : null} />
                  <Field label="PhD"                value={app.phdDone ? '✅ Completed' : '❌ Not Completed'} />
                  <Field label="NET / SET / SLET"   value={
                    [app.netCleared && 'NET', app.setCleared && 'SET', app.sletCleared && 'SLET']
                      .filter(Boolean).join(', ') || '—'
                  } />
                  <Field label="Teaching Exp"       value={app.teachingExperienceYears ? `${app.teachingExperienceYears} years` : null} />
                  <Field label="SCI Publications"   value={app.sciPublications} />
                  <Field label="Scopus Publications" value={app.scopusPublications} />
                  <Field label="UGC Care"           value={app.ugcCarePublications} />
                  <Field label="Conference Papers"  value={app.conferencePublications} />
                  <Field label="Local Publications" value={app.localPublications} />
                  <Field label="Submitted On"       value={new Date(app.submittedAt).toLocaleString('en-IN')} />
                </div>
              </div>
            </div>

            {/* ── Documents ── */}
            <div className="card">
              <div className="card-header">
                <h3>📁 Faculty Documents</h3>
                <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {app.documents?.length || 0} file{(app.documents?.length || 0) !== 1 ? 's' : ''} uploaded
                </span>
              </div>
              <div className="card-body">
                {!app.documents?.length ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📭</div>
                    <p style={{ fontSize: '.88rem' }}>This faculty member has not uploaded any documents yet.</p>
                    <p style={{ fontSize: '.78rem', marginTop: '.3rem' }}>
                      Documents appear here once uploaded from the faculty's Documents page.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {app.documents.map(doc => (
                      <DocRow key={doc.id} doc={doc} onView={setPreview} />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Full academic profile */}
            {profile && (
              <div className="card">
                <div className="card-header"><h3>👤 Full Academic Profile</h3></div>
                <div className="card-body" style={{ fontSize: '.88rem' }}>
                  {[
                    { title: '🎓 Education', items: [
                      ['UG',  `${profile.ugDegree || ''} ${profile.ugBranch || '—'} — ${profile.ugPercentage ?? '—'}%`],
                      ['PG',  `${profile.pgDegree || ''} ${profile.pgBranch || '—'} — ${profile.pgPercentage ?? '—'}%`],
                      ['PhD', profile.phdDone ? `✅ ${profile.phdSubject || ''} (${profile.phdYear || ''})` : '❌ Not done'],
                      ['NET/SET/SLET', [
                        profile.netCleared  && 'NET',
                        profile.setCleared  && 'SET',
                        profile.sletCleared && 'SLET',
                      ].filter(Boolean).join(', ') || '—'],
                    ]},
                    { title: '💼 Experience', items: [
                      ['Teaching',  `${profile.teachingExperienceYears  || 0} yrs`],
                      ['Industry',  `${profile.industryExperienceYears  || 0} yrs`],
                      ['Total',     `${profile.totalExperienceYears     || 0} yrs`],
                      ['Current Post', profile.currentPost || '—'],
                    ]},
                    { title: '📰 Publications', items: [
                      ['SCI/SCIE',    profile.sciPublications       || 0],
                      ['Scopus',      profile.scopusPublications     || 0],
                      ['UGC Care',    profile.ugcCarePublications    || 0],
                      ['Conference',  profile.conferencePublications || 0],
                      ['Local',       profile.localPublications      || 0],
                      ['Books',       profile.booksChapters          || 0],
                      ['Citations',   profile.scieCitations          || 0],
                    ]},
                  ].map(section => (
                    <div key={section.title} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '.5rem', fontSize: '.85rem' }}>{section.title}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem' }}>
                        {section.items.map(([k, v]) => (
                          <div key={k}><span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{k}:</span> <strong>{v}</strong></div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {profile.additionalInfo && (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '.4rem', fontSize: '.85rem' }}>📝 Additional Info</div>
                      <p style={{ fontSize: '.83rem', color: 'var(--text2)' }}>{profile.additionalInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review panel */}
            <div className="card" style={{ border: '2px solid var(--primary-light)' }}>
              <div className="card-header" style={{ background: 'rgba(59,130,246,.06)' }}>
                <h3>🛡️ Admin Review Panel</h3>
              </div>
              <div className="card-body">
                {msg.text && (
                  <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'} mb-2`}>{msg.text}</div>
                )}

                <div className="form-group mb-2">
                  <label>Decision *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '.5rem' }}>
                    {[
                      { s: 'PENDING',      icon: '⏳' },
                      { s: 'UNDER_REVIEW', icon: '🔍' },
                      { s: 'APPROVED',     icon: '✅' },
                      { s: 'REJECTED',     icon: '❌' },
                    ].map(({ s, icon }) => (
                      <button key={s} onClick={() => setStatus(s)} style={{
                        padding: '.65rem .4rem', textAlign: 'center',
                        border: `2px solid ${status === s ? 'var(--primary-light)' : 'var(--border)'}`,
                        borderRadius: 8, background: status === s ? 'rgba(59,130,246,.1)' : 'var(--surface2)',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '.78rem',
                        color: status === s ? 'var(--primary-light)' : 'var(--text2)', transition: 'all .15s',
                      }}>
                        {icon}<br />{s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group mb-2">
                  <label>Admin Remarks *</label>
                  <textarea rows={5} value={remarks} onChange={e => setRemarks(e.target.value)}
                    placeholder="Write your detailed remarks here — explain the decision, what documents are missing, or next steps for the faculty member..." />
                  <span className="form-hint">These remarks are visible to the faculty member.</span>
                </div>

                <button className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={submit}
                  disabled={saving || !remarks.trim()}>
                  {saving ? '⏳ Saving...' : '💾 Save Review'}
                </button>

                {app.reviewedAt && (
                  <div className="alert alert-info mt-2" style={{ fontSize: '.8rem' }}>
                    Last reviewed: {new Date(app.reviewedAt).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Document preview modal */}
        {preview && <DocPreviewModal doc={preview} onClose={() => setPreview(null)} />}

      </main>
    </div>
  );
}
