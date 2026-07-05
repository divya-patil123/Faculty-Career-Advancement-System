import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    adminAPI.getAllFaculty().then(r => setFaculty(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewProfile = (userId) => {
    setProfileLoading(true);
    adminAPI.getFacultyProfile(userId)
      .then(r => setSelectedProfile(r.data))
      .catch(() => setSelectedProfile(null))
      .finally(() => setProfileLoading(false));
  };

  const toggle = async (id) => {
    try {
      const r = await adminAPI.toggleFacultyStatus(id);
      setMsg(r.data.message);
      setTimeout(() => setMsg(''), 2500);
      load();
    } catch { setMsg('Failed to update status.'); }
  };

  const filtered = faculty.filter(f =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>👨‍🏫 Faculty Members</h1>
          <p>Manage all registered faculty members and view their profiles.</p>
        </div>

        {msg && <div className="alert alert-success mb-2">{msg}</div>}

        <div className="card mb-2">
          <div className="card-body">
            <input style={{ width: '100%', padding: '.65rem .85rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem' }}
              placeholder="🔍 Search by name, email, department, employee ID..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Faculty ({filtered.length})</h3>
            </div>
            <div className="table-wrap">
              {filtered.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👨‍🏫</div><h3>No faculty found.</h3></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(f => (
                      <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => viewProfile(f.id)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{f.name}</div>
                          <div className="text-muted text-sm">{f.email}</div>
                        </td>
                        <td className="text-muted text-sm">{f.employeeId || '—'}</td>
                        <td className="text-muted text-sm">{f.department || '—'}</td>
                        <td className="text-muted text-sm">{f.designation || '—'}</td>
                        <td>
                          <span className={`badge badge-${f.active ? 'active' : 'inactive'}`}>
                            {f.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-muted text-sm">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => viewProfile(f.id)}>👁️ Profile</button>
                            <button className={`btn btn-sm ${f.active ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => toggle(f.id)}>
                              {f.active ? '🚫 Block' : '✅ Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Profile Panel */}
          {selectedProfile && (
            <div className="card">
              <div className="card-header">
                <h3>👤 {selectedProfile.userName}'s Profile</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedProfile(null)}>✕ Close</button>
              </div>
              <div className="card-body" style={{ fontSize: '.88rem' }}>
                {profileLoading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
                      <div><span className="text-muted text-sm">Department</span><br /><strong>{selectedProfile.userDepartment || '—'}</strong></div>
                      <div><span className="text-muted text-sm">API Score</span><br /><strong style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>{selectedProfile.apiScore || 0}</strong></div>
                    </div>

                    {[
                      { title: '🎓 Education', items: [
                        ['UG', `${selectedProfile.ugDegree || ''} ${selectedProfile.ugBranch || ''} — ${selectedProfile.ugPercentage || '—'}%`],
                        ['PG', `${selectedProfile.pgDegree || ''} ${selectedProfile.pgBranch || ''} — ${selectedProfile.pgPercentage || '—'}%`],
                        ['PhD', selectedProfile.phdDone ? `✅ ${selectedProfile.phdSubject || ''} (${selectedProfile.phdYear || ''})` : '❌ Not completed'],
                      ]},
                      { title: '💼 Experience', items: [
                        ['Teaching', `${selectedProfile.teachingExperienceYears || 0} years`],
                        ['Industry', `${selectedProfile.industryExperienceYears || 0} years`],
                        ['Total', `${selectedProfile.totalExperienceYears || 0} years`],
                        ['Current Post', selectedProfile.currentPost || '—'],
                      ]},
                      { title: '📰 Publications', items: [
                        ['SCI/SCIE', selectedProfile.sciPublications || 0],
                        ['Scopus', selectedProfile.scopusPublications || 0],
                        ['UGC Care', selectedProfile.ugcCarePublications || 0],
                        ['Conference', selectedProfile.conferencePublications || 0],
                        ['Books', selectedProfile.booksChapters || 0],
                        ['Citations', selectedProfile.scieCitations || 0],
                      ]},
                    ].map(section => (
                      <div key={section.title} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '.5rem', fontSize: '.88rem' }}>{section.title}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem' }}>
                          {section.items.map(([k, v]) => (
                            <div key={k}><span className="text-muted text-sm">{k}:</span> <strong>{v}</strong></div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {selectedProfile.additionalInfo && (
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '.5rem', fontSize: '.88rem' }}>📝 Additional Info</div>
                        <p className="text-muted text-sm">{selectedProfile.additionalInfo}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
