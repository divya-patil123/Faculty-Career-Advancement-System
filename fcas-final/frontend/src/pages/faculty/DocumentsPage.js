import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { facultyAPI } from '../../services/api';

// ─── Document type catalogue ──────────────────────────────────────────────────
const DOC_TYPES = [
  { value: 'NET_SET_SLET_CERTIFICATE', label: '🏅 NET / SET / SLET Certificate' },
  { value: 'PHD_CERTIFICATE',          label: '🎓 PhD Certificate' },
  { value: 'UG_MARKSHEET',             label: '📄 UG Marksheet' },
  { value: 'PG_MARKSHEET',             label: '📄 PG Marksheet' },
  { value: 'EXPERIENCE_CERTIFICATE',   label: '💼 Experience Certificate' },
  { value: 'APPOINTMENT_LETTER',       label: '📋 Appointment Letter' },
  { value: 'PUBLICATION_PROOF',        label: '📰 Publication Proof' },
  { value: 'NOC',                      label: '📝 NOC / Relieving Letter' },
  { value: 'PATENT',                   label: '🏆 Patent Certificate' },
  { value: 'AWARD',                    label: '🥇 Award / Recognition' },
  { value: 'OTHER',                    label: '📎 Other Document' },
];
const KNOWN_TYPES = DOC_TYPES.map(t => t.value);

const formatSize = bytes => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const isImageType = ct =>
  ct && (ct.includes('image/jpeg') || ct.includes('image/png') ||
         ct.includes('image/gif')  || ct.includes('image/webp') ||
         ct.includes('image/'));

const isPdfType = ct => ct && ct.includes('application/pdf');

// ─── useDocumentBlob hook ─────────────────────────────────────────────────────
// Fetches a document via the JWT-protected API and returns a blob URL.
// This works for EVERY document regardless of whether fileUrl is set.
// The blob URL can be used in <img src>, <iframe src>, or window.open().
function useDocumentBlob(docId, enabled) {
  const [blobUrl, setBlobUrl]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const prevUrl = useRef(null);

  useEffect(() => {
    if (!enabled || !docId) return;

    setLoading(true);
    setError(null);

    facultyAPI.downloadDocument(docId)
      .then(res => {
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        // Revoke the previous blob URL to avoid memory leaks
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        prevUrl.current = url;
        setBlobUrl(url);
      })
      .catch(() => setError('Could not load file.'))
      .finally(() => setLoading(false));

    return () => {
      if (prevUrl.current) {
        URL.revokeObjectURL(prevUrl.current);
        prevUrl.current = null;
      }
    };
  }, [docId, enabled]);

  return { blobUrl, loading, error };
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
// Works for ALL documents:
//  - Uses fileUrl (public /files/ path) if available (new uploads)
//  - Falls back to blob via JWT API for old uploads that have no fileUrl
function PreviewModal({ doc, onClose }) {
  const needsBlob    = !doc.fileUrl;           // old doc — no public URL stored
  const { blobUrl, loading, error } = useDocumentBlob(doc.id, needsBlob);

  // Pick which URL to render
  const viewUrl  = doc.fileUrl || blobUrl;
  const isImage  = isImageType(doc.contentType);
  const isPdf    = isPdfType(doc.contentType);

  // Close on ESC
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const openInTab = () => {
    if (viewUrl) window.open(viewUrl, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
        zIndex: 9000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backdropFilter: 'blur(6px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* ── Header bar ── */}
      <div style={{
        width: '100%', maxWidth: 920,
        background: 'var(--surface)', borderRadius: '12px 12px 0 0',
        padding: '.8rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{isPdf ? '📕' : isImage ? '🖼️' : '📄'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{doc.originalFileName}</div>
            <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>
              {doc.documentType?.replace(/_/g, ' ')}
              &nbsp;·&nbsp;{formatSize(doc.fileSize)}
              &nbsp;·&nbsp;{doc.contentType}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          {viewUrl && (
            <button className="btn btn-sm btn-outline" onClick={openInTab}>
              ↗ Open in Tab
            </button>
          )}
          <button className="btn btn-sm btn-secondary" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {/* ── Preview body ── */}
      <div style={{
        width: '100%', maxWidth: 920,
        background: '#111',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, maxHeight: '78vh',
        flexShrink: 0,
      }}>
        {/* Loading state */}
        {loading && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', borderColor: '#555', borderTopColor: '#fff' }} />
            <p>Loading document...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{ color: '#f87171', textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <p style={{ fontSize: '.8rem', color: '#aaa', marginTop: '.5rem' }}>
              The file may have been deleted from the server.
            </p>
          </div>
        )}

        {/* Image preview */}
        {!loading && !error && viewUrl && isImage && (
          <img
            src={viewUrl}
            alt={doc.originalFileName}
            style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block' }}
          />
        )}

        {/* PDF preview */}
        {!loading && !error && viewUrl && isPdf && (
          <iframe
            src={viewUrl}
            title={doc.originalFileName}
            style={{ width: '100%', height: '78vh', border: 'none', display: 'block' }}
          />
        )}

        {/* Unknown type — just offer open in tab */}
        {!loading && !error && viewUrl && !isImage && !isPdf && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p style={{ marginBottom: '1rem' }}>This file type cannot be previewed here.</p>
            <button className="btn btn-primary" onClick={openInTab}>↗ Open in New Tab</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document Card (grid view) ────────────────────────────────────────────────
function DocCard({ doc, onPreview, onDelete }) {
  const isImage = isImageType(doc.contentType);
  const isPdf   = isPdfType(doc.contentType);

  // For image cards: try the public URL first; if none, fetch via API on hover
  const [thumbUrl, setThumbUrl] = useState(doc.fileUrl || null);
  const [thumbErr, setThumbErr] = useState(false);
  const thumbFetched = useRef(false);

  const fetchThumb = useCallback(() => {
    if (thumbUrl || thumbFetched.current || !isImage) return;
    thumbFetched.current = true;
    facultyAPI.downloadDocument(doc.id)
      .then(res => {
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'image/jpeg' });
        setThumbUrl(URL.createObjectURL(blob));
      })
      .catch(() => setThumbErr(true));
  }, [doc.id, isImage, thumbUrl]);

  // Fetch thumbnail as soon as card mounts (for image docs)
  useEffect(() => { if (isImage) fetchThumb(); }, [isImage, fetchThumb]);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow .15s, transform .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Thumbnail area */}
      <div
        onClick={() => onPreview(doc)}
        style={{
          height: 130, cursor: 'pointer', overflow: 'hidden',
          background: isImage ? '#1a1a1a' : 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isImage && thumbUrl && !thumbErr ? (
          <img
            src={thumbUrl}
            alt={doc.originalFileName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setThumbErr(true)}
          />
        ) : isImage && !thumbErr ? (
          <div style={{ color: '#888', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, borderWidth: 2 }} />
          </div>
        ) : (
          <span style={{ fontSize: '2.8rem' }}>
            {thumbErr ? '🖼️' : isPdf ? '📕' : '📄'}
          </span>
        )}
        {/* Hover overlay */}
        <div className="card-hover-overlay" style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity .2s',
          color: 'white', fontWeight: 700, fontSize: '.85rem', gap: '.3rem',
        }}>
          👁️ View
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '.65rem .8rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        <div style={{ fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={doc.originalFileName}>
          {doc.originalFileName}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{formatSize(doc.fileSize)}</div>
        <div style={{ display: 'flex', gap: '.35rem' }}>
          <button className="btn btn-sm btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '.78rem' }}
            onClick={() => onPreview(doc)}>
            👁️ View
          </button>
          <button className="btn btn-sm btn-danger" style={{ fontSize: '.78rem' }}
            onClick={() => onDelete(doc.id, doc.originalFileName)}>
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Add CSS for hover overlay (injected once)
const hoverStyle = document.createElement('style');
hoverStyle.textContent = `.card-hover-overlay { pointer-events: none; }
div:hover > .card-hover-overlay { opacity: 1 !important; }`;
if (!document.head.querySelector('#doc-hover-style')) {
  hoverStyle.id = 'doc-hover-style';
  document.head.appendChild(hoverStyle);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [docType,    setDocType]    = useState('');
  const [customType, setCustomType] = useState('');
  const [file,       setFile]       = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [msg,        setMsg]        = useState({ type: '', text: '' });
  const [dragging,   setDragging]   = useState(false);
  const [viewMode,   setViewMode]   = useState('grid');
  const fileRef = useRef();
  const previewImgUrl = useRef(null);

  // ── Load docs ───────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    facultyAPI.getDocuments()
      .then(r => setDocs(r.data))
      .catch(() => setMsg({ type: 'error', text: 'Failed to load documents.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── File selection ──────────────────────────────────────────────────────────
  const selectFile = f => {
    if (!f) return;
    // Revoke previous preview URL
    if (previewImgUrl.current) { URL.revokeObjectURL(previewImgUrl.current); previewImgUrl.current = null; }
    if (isImageType(f.type)) previewImgUrl.current = URL.createObjectURL(f);
    setFile(f);
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const upload = async () => {
    if (!file)    { setMsg({ type: 'error', text: 'Please select a file first.' });    return; }
    if (!docType) { setMsg({ type: 'error', text: 'Please select a document type.' }); return; }

    setUploading(true);
    setMsg({ type: '', text: '' });

    const finalType = (docType === 'OTHER' && customType.trim())
      ? customType.trim().toUpperCase().replace(/\s+/g, '_')
      : docType;

    try {
      await facultyAPI.uploadDocument(file, finalType, null);
      setMsg({ type: 'success', text: `✅ "${file.name}" uploaded successfully!` });
      // Clean up
      if (previewImgUrl.current) { URL.revokeObjectURL(previewImgUrl.current); previewImgUrl.current = null; }
      setFile(null); setDocType(''); setCustomType('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await facultyAPI.deleteDocument(id);
      setDocs(prev => prev.filter(d => d.id !== id));
      if (previewDoc?.id === id) setPreviewDoc(null);
      setMsg({ type: 'success', text: `✅ "${name}" deleted.` });
    } catch {
      setMsg({ type: 'error', text: 'Delete failed. Please try again.' });
    }
  };

  // ── Group docs ──────────────────────────────────────────────────────────────
  const groupedDocs = DOC_TYPES.reduce((acc, t) => {
    const matching = docs.filter(d => d.documentType === t.value);
    if (matching.length > 0) acc.push({ ...t, docs: matching });
    return acc;
  }, []);
  const others = docs.filter(d => !KNOWN_TYPES.includes(d.documentType));
  if (others.length > 0) groupedDocs.push({ value: '__other__', label: '📎 Other / Custom', docs: others });

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="flex-between page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>📁 My Documents</h1>
            <p>Upload certificates and proofs. Click any document to preview it.</p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
            <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}>⊞ Grid</button>
            <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}>☰ List</button>
          </div>
        </div>

        {/* Alert */}
        {msg.text && (
          <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}
            style={{ marginBottom: '1.25rem' }}
            onClick={() => setMsg({ type: '', text: '' })}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Upload Panel ──────────────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div className="card">
              <div className="card-header"><h3>📤 Upload Document</h3></div>
              <div className="card-body">

                {/* Drop zone */}
                <div
                  className={`upload-zone ${dragging ? 'dragging' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragging(false);
                    if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    isImageType(file.type) && previewImgUrl.current ? (
                      /* Show image preview before upload */
                      <div style={{ width: '100%' }}>
                        <img src={previewImgUrl.current} alt="preview"
                          style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 6, marginBottom: '.5rem' }} />
                        <p style={{ fontWeight: 600, fontSize: '.85rem', textAlign: 'center' }}>{file.name}</p>
                        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>{formatSize(file.size)}</p>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">{isPdfType(file.type) ? '📕' : '📄'}</div>
                        <p style={{ fontWeight: 600 }}>{file.name}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{formatSize(file.size)}</p>
                      </>
                    )
                  ) : (
                    <>
                      <div className="upload-icon">☁️</div>
                      <p style={{ fontWeight: 600, color: 'var(--text)' }}>Click or drag file here</p>
                      <p>PDF, JPG, PNG, GIF, WEBP — max 10 MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => selectFile(e.target.files[0])} />
                </div>

                {file && (
                  <button className="btn btn-sm btn-secondary mt-1"
                    onClick={() => {
                      if (previewImgUrl.current) { URL.revokeObjectURL(previewImgUrl.current); previewImgUrl.current = null; }
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}>
                    ✕ Remove
                  </button>
                )}

                {/* Type selector */}
                <div className="form-group mt-2">
                  <label>Document Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}
                    style={{ padding: '.65rem .85rem', border: '1px solid var(--border)', borderRadius: 8, width: '100%', fontFamily: 'inherit', fontSize: '.9rem', background: 'var(--surface)' }}>
                    <option value="">Select type...</option>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {docType === 'OTHER' && (
                  <div className="form-group mt-1">
                    <label>Specify document name</label>
                    <input placeholder="e.g. FDP Certificate, Patent Proof"
                      value={customType} onChange={e => setCustomType(e.target.value)}
                      style={{ padding: '.65rem .85rem', border: '1px solid var(--border)', borderRadius: 8, width: '100%', fontFamily: 'inherit', fontSize: '.9rem' }} />
                  </div>
                )}

                <button className="btn btn-primary mt-2"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={upload}
                  disabled={uploading || !file || !docType || (docType === 'OTHER' && !customType.trim())}>
                  {uploading ? '⏳ Uploading...' : '📤 Upload Document'}
                </button>

                <div className="alert alert-info mt-2" style={{ fontSize: '.77rem' }}>
                  💡 Images display as thumbnails and can be previewed inline.
                  PDFs open in a built-in viewer. Admin can view all your documents during review.
                </div>
              </div>
            </div>
          </div>

          {/* ── Document Display ──────────────────────────────────────────────── */}
          <div>
            {loading ? (
              <div className="card">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                  <p className="text-muted">Loading documents...</p>
                </div>
              </div>
            ) : docs.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                  <div className="empty-icon">📁</div>
                  <h3>No Documents Yet</h3>
                  <p>Upload your certificates, marksheets, and proofs using the panel on the left.</p>
                </div>
              </div>
            ) : (
              groupedDocs.map(group => (
                <div key={group.value} style={{ marginBottom: '1.75rem' }}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem', paddingBottom: '.5rem', borderBottom: '2px solid var(--border)' }}>
                    <h3 style={{ fontSize: '.95rem', fontWeight: 700 }}>{group.label}</h3>
                    <span style={{ background: 'var(--primary-light)', color: 'white', borderRadius: 20, padding: '.1rem .5rem', fontSize: '.72rem', fontWeight: 700 }}>
                      {group.docs.length}
                    </span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '1rem' }}>
                      {group.docs.map(doc => (
                        <DocCard key={doc.id} doc={doc} onPreview={setPreviewDoc} onDelete={handleDelete} />
                      ))}
                    </div>
                  ) : (
                    <div className="card">
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: 60 }}>Preview</th>
                              <th>File Name</th>
                              <th>Size</th>
                              <th>Uploaded</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.docs.map(doc => {
                              const isImg = isImageType(doc.contentType);
                              return (
                                <tr key={doc.id}>
                                  <td>
                                    {/* Thumbnail in list view — uses fileUrl if available */}
                                    {isImg && doc.fileUrl ? (
                                      <img src={doc.fileUrl} alt=""
                                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', display: 'block' }}
                                        onClick={() => setPreviewDoc(doc)}
                                        onError={e => { e.target.outerHTML = '<span style="font-size:1.6rem;cursor:pointer">🖼️</span>'; }} />
                                    ) : (
                                      <span style={{ fontSize: '1.6rem', cursor: 'pointer', display: 'block' }}
                                        onClick={() => setPreviewDoc(doc)}>
                                        {isPdfType(doc.contentType) ? '📕' : isImg ? '🖼️' : '📄'}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{doc.originalFileName}</div>
                                    <div style={{ fontSize: '.73rem', color: 'var(--muted)' }}>{doc.contentType}</div>
                                  </td>
                                  <td className="text-muted text-sm">{formatSize(doc.fileSize)}</td>
                                  <td className="text-muted text-sm">
                                    {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '.4rem' }}>
                                      <button className="btn btn-sm btn-outline"
                                        onClick={() => setPreviewDoc(doc)}>
                                        👁️ View
                                      </button>
                                      <button className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(doc.id, doc.originalFileName)}>
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preview modal */}
        {previewDoc && (
          <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}

      </main>
    </div>
  );
}
