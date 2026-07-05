import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { facultyAPI } from '../../services/api';

const POSTS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Principal/HOD'];

const POST_REQUIREMENTS = {
  'Assistant Professor': [
    { label: 'PG Degree (M.E./M.Tech or equivalent)', required: true },
    { label: 'PG Percentage ≥ 55%', required: true },
    { label: 'PhD OR NET/SLET cleared', required: true },
    { label: 'No minimum experience required', required: false },
  ],
  'Associate Professor': [
    { label: 'PG Degree with ≥ 55%', required: true },
    { label: 'PhD completed (mandatory)', required: true },
    { label: 'Teaching experience ≥ 8 years', required: true },
    { label: 'API Score ≥ 300', required: true },
    { label: 'Minimum 3 indexed publications (SCI/Scopus/UGC)', required: true },
  ],
  'Professor': [
    { label: 'PG Degree with ≥ 55%', required: true },
    { label: 'PhD completed (mandatory)', required: true },
    { label: 'Teaching experience ≥ 10 years', required: true },
    { label: 'API Score ≥ 400', required: true },
    { label: 'Minimum 5 SCI/Scopus publications', required: true },
  ],
  'Principal/HOD': [
    { label: 'Must qualify for Professor post', required: true },
    { label: 'Total experience ≥ 15 years', required: true },
    { label: 'API Score ≥ 400', required: true },
  ],
};

export default function EligibilityPage() {
  const [selectedPost, setSelectedPost] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    if (!selectedPost) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await facultyAPI.checkEligibility(selectedPost);
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check eligibility. Make sure your profile is complete.');
    } finally { setLoading(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>✅ Eligibility Checker</h1>
          <p>Select a post to instantly check if you qualify based on UGC/AICTE norms.</p>
        </div>

        {/* Post selector */}
        <div className="card mb-2">
          <div className="card-header"><h3>Select Post to Check</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {POSTS.map(post => (
                <button key={post} onClick={() => { setSelectedPost(post); setResult(null); setError(''); }}
                  className={`btn ${selectedPost === post ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '1rem', flexDirection: 'column', gap: '.4rem', height: 'auto' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {post === 'Assistant Professor' ? '👩‍🏫' : post === 'Associate Professor' ? '👨‍🏫' : post === 'Professor' ? '🎓' : '🏛️'}
                  </span>
                  <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{post}</span>
                </button>
              ))}
            </div>

            {selectedPost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={check} disabled={loading}>
                  {loading ? '⏳ Checking...' : `✅ Check Eligibility for ${selectedPost}`}
                </button>
                <Link to="/apply" className="btn btn-outline">📝 Go to Apply →</Link>
              </div>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error} <Link to="/profile">Update Profile →</Link></div>}

        {/* Result */}
        {result && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <div className={`eligibility-box mb-2`}>
                <div className={`eligibility-header ${result.eligible ? 'eligibility-eligible' : 'eligibility-ineligible'}`}>
                  <span style={{ fontSize: '2rem' }}>{result.eligible ? '🎉' : '❌'}</span>
                  <div>
                    <div className="eligibility-title">
                      {result.eligible ? 'You Are Eligible!' : 'Not Yet Eligible'}
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: '.2rem' }}>
                      for <strong>{selectedPost}</strong> &nbsp;|&nbsp; API Score: <strong>{result.apiScore}</strong>
                    </div>
                  </div>
                </div>

                <div className="eligibility-body">
                  {result.metCriteria?.length > 0 && (
                    <>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--success)', marginBottom: '.5rem' }}>✅ Criteria Met</div>
                      <div className="criteria-list">
                        {result.metCriteria.map((c, i) => (
                          <div key={i} className="criteria-item criteria-met">
                            <span className="criteria-icon">✓</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {result.unmetCriteria?.length > 0 && (
                    <>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--danger)', margin: '1rem 0 .5rem' }}>❌ Criteria Not Met</div>
                      <div className="criteria-list">
                        {result.unmetCriteria.map((c, i) => (
                          <div key={i} className="criteria-item criteria-unmet">
                            <span className="criteria-icon">✗</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {result.eligible && (
                    <div style={{ marginTop: '1rem' }}>
                      <Link to="/apply" className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                        📝 Submit Application Now →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Requirements reference */}
            <div className="card">
              <div className="card-header"><h3>📋 Requirements for {selectedPost}</h3></div>
              <div className="card-body">
                {POST_REQUIREMENTS[selectedPost]?.map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginBottom: '.65rem', fontSize: '.88rem' }}>
                    <span style={{ color: req.required ? 'var(--danger)' : 'var(--info)', fontSize: '1rem', flexShrink: 0 }}>
                      {req.required ? '●' : '○'}
                    </span>
                    <span>{req.label}</span>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                  ● Mandatory &nbsp; ○ Optional<br />
                  Based on UGC Regulations 2018 & AICTE norms for engineering colleges.
                </div>
                <div className="mt-2">
                  <Link to="/profile" className="btn btn-outline btn-sm">✏️ Update Profile</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info cards when nothing selected */}
        {!selectedPost && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {POSTS.map(post => (
              <div key={post} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(post)}>
                <div className="card-body">
                  <div style={{ fontSize: '1.8rem', marginBottom: '.5rem' }}>
                    {post === 'Assistant Professor' ? '👩‍🏫' : post === 'Associate Professor' ? '👨‍🏫' : post === 'Professor' ? '🎓' : '🏛️'}
                  </div>
                  <h3 style={{ fontSize: '.95rem', marginBottom: '.5rem' }}>{post}</h3>
                  <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>
                    {POST_REQUIREMENTS[post]?.length} eligibility criteria
                  </div>
                  <div className="mt-1">
                    {POST_REQUIREMENTS[post]?.slice(0, 2).map((r, i) => (
                      <div key={i} style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '.2rem' }}>• {r.label}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
