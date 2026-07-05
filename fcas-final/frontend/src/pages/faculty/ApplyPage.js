import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { facultyAPI } from '../../services/api';

const POSTS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Principal/HOD'];

export default function ApplyPage() {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    facultyAPI.profileExists().then(r => setHasProfile(r.data.exists)).catch(() => {});
  }, []);

  const checkEligibility = async (post) => {
    setSelectedPost(post);
    setEligibility(null); setError('');
    setCheckLoading(true);
    try {
      const r = await facultyAPI.checkEligibility(post);
      setEligibility(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check eligibility. Complete your profile first.');
    } finally { setCheckLoading(false); }
  };

  const submitApplication = async () => {
    setSubmitLoading(true); setError('');
    try {
      const r = await facultyAPI.submitApplication({ applyingForPost: selectedPost });
      setSuccess(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally { setSubmitLoading(false); }
  };

  if (success) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ maxWidth: 600, margin: '2rem auto' }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{success.eligible ? '🎉' : '📋'}</div>
                <h2 style={{ marginBottom: '.5rem' }}>Application Submitted!</h2>
                <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
                  Your application for <strong>{success.applyingForPost}</strong> has been submitted successfully.
                </p>

                <div className={`alert alert-${success.eligible ? 'success' : 'warn'} mb-2`} style={{ textAlign: 'left' }}>
                  <div><strong>{success.eligible ? '✅ You are eligible for this post.' : '⚠️ You are currently not eligible for this post.'}</strong></div>
                  <pre style={{ fontSize: '.8rem', marginTop: '.5rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {success.eligibilityRemarks}
                  </pre>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Link to="/my-applications" className="btn btn-primary">📋 View My Applications</Link>
                  <Link to="/documents" className="btn btn-outline">📁 Upload Documents</Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📝 Apply for Career Advancement</h1>
          <p>Select the post you want to apply for. Eligibility will be auto-checked from your profile.</p>
        </div>

        {!hasProfile && (
          <div className="alert alert-error mb-2">
            ❌ You must <Link to="/profile"><strong>complete your academic profile</strong></Link> before submitting an application.
          </div>
        )}

        {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

        {/* Step 1: Choose post */}
        <div className="card mb-2">
          <div className="card-header">
            <h3>Step 1 — Select Post to Apply For</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {POSTS.map(post => (
                <button key={post}
                  onClick={() => checkEligibility(post)}
                  disabled={!hasProfile || checkLoading}
                  className={`btn ${selectedPost === post ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '1.25rem', flexDirection: 'column', gap: '.5rem', height: 'auto', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>
                    {post === 'Assistant Professor' ? '👩‍🏫' : post === 'Associate Professor' ? '👨‍🏫' : post === 'Professor' ? '🎓' : '🏛️'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{post}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Eligibility result */}
        {checkLoading && (
          <div className="card mb-2">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Checking eligibility from your profile...</p>
            </div>
          </div>
        )}

        {eligibility && !checkLoading && (
          <div className="card mb-2">
            <div className="card-header">
              <h3>Step 2 — Eligibility Result for {selectedPost}</h3>
            </div>
            <div className="card-body">
              <div className={`eligibility-box`}>
                <div className={`eligibility-header ${eligibility.eligible ? 'eligibility-eligible' : 'eligibility-ineligible'}`}>
                  <span style={{ fontSize: '2.5rem' }}>{eligibility.eligible ? '🎉' : '⚠️'}</span>
                  <div>
                    <div className="eligibility-title">
                      {eligibility.eligible ? 'You are eligible for this post!' : 'You do not currently meet all criteria.'}
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: '.2rem' }}>
                      API Score: <strong>{eligibility.apiScore}</strong>
                    </div>
                  </div>
                </div>
                <div className="eligibility-body">
                  {eligibility.metCriteria?.length > 0 && (
                    <div className="mb-2">
                      <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: '.5rem' }}>✅ Criteria Met ({eligibility.metCriteria.length})</div>
                      <div className="criteria-list">
                        {eligibility.metCriteria.map((c, i) => (
                          <div key={i} className="criteria-item criteria-met">
                            <span className="criteria-icon">✓</span><span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {eligibility.unmetCriteria?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', marginBottom: '.5rem' }}>❌ Criteria Not Met ({eligibility.unmetCriteria.length})</div>
                      <div className="criteria-list">
                        {eligibility.unmetCriteria.map((c, i) => (
                          <div key={i} className="criteria-item criteria-unmet">
                            <span className="criteria-icon">✗</span><span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!eligibility.eligible && (
                <div className="alert alert-warn mt-2">
                  ℹ️ You can still submit this application even if not eligible. The system will record your current status and the admin will review it. You may also <Link to="/profile">update your profile</Link> if information is incomplete.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm submission */}
        {eligibility && !checkLoading && (
          <div className="card mb-2">
            <div className="card-header"><h3>Step 3 — Confirm & Submit</h3></div>
            <div className="card-body">
              <p style={{ color: 'var(--text2)', marginBottom: '1.25rem', fontSize: '.9rem' }}>
                By submitting, your current academic profile data will be recorded with this application. Make sure your profile is up to date before submitting.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={submitApplication} disabled={submitLoading}>
                  {submitLoading ? '⏳ Submitting...' : `📤 Submit Application for ${selectedPost}`}
                </button>
                <Link to="/profile" className="btn btn-outline btn-lg">✏️ Update Profile First</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
