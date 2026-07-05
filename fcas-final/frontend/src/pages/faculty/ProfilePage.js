import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { facultyAPI } from '../../services/api';

const BRANCHES = [
  'Computer Engineering','Information Technology','Electronics & Telecommunication',
  'Electrical Engineering','Mechanical Engineering','Civil Engineering',
  'Chemical Engineering','Applied Mathematics','Physics','Chemistry',
  'MBA','MCA','Other',
];
const POSTS = ['Assistant Professor','Associate Professor','Professor','Principal/HOD'];

// ─── CGPA → Percentage conversion ────────────────────────────────────────────
// 10-point scale: multiply by 9.5 (UGC approved formula)
// 4-point  scale: divide by 4, multiply by 100
const cgpaToPercentage = (cgpa, scale) => {
  if (!cgpa || !scale) return null;
  const n = parseFloat(cgpa);
  const s = parseFloat(scale);
  if (isNaN(n) || isNaN(s) || s === 0) return null;
  if (s === 10) return parseFloat((n * 9.5).toFixed(2));
  if (s === 4)  return parseFloat(((n / 4) * 100).toFixed(2));
  return parseFloat(((n / s) * 100).toFixed(2));
};

// ─── Reusable Score Input (Percentage OR CGPA toggle) ────────────────────────
function ScoreInput({ label, prefix, values, onChange, hint }) {
  // prefix = 'ug' or 'pg'
  const typeKey  = `${prefix}ScoreType`;   // "PERCENTAGE" | "CGPA"
  const pctKey   = `${prefix}Percentage`;  // converted value always in %
  const cgpaKey  = `${prefix}Cgpa`;        // raw CGPA input
  const scaleKey = `${prefix}CgpaScale`;   // 10 or 4

  const scoreType = values[typeKey] || 'PERCENTAGE';
  const isCgpa    = scoreType === 'CGPA';

  // When user switches mode — clear the other field
  const switchMode = mode => {
    onChange({ [typeKey]: mode, [pctKey]: '', [cgpaKey]: '', [scaleKey]: 10 });
  };

  // When percentage input changes
  const handlePct = e => {
    const val = e.target.value;
    onChange({ [pctKey]: val, [cgpaKey]: null, [scaleKey]: null });
  };

  // When CGPA or scale changes — auto-convert
  const handleCgpa = e => {
    const cgpa  = e.target.name === cgpaKey  ? e.target.value : values[cgpaKey];
    const scale = e.target.name === scaleKey ? e.target.value : (values[scaleKey] || 10);
    const converted = cgpaToPercentage(cgpa, scale);
    onChange({
      [cgpaKey]:  e.target.name === cgpaKey  ? e.target.value : values[cgpaKey],
      [scaleKey]: e.target.name === scaleKey ? e.target.value : (values[scaleKey] || 10),
      [pctKey]:   converted !== null ? converted : '',
    });
  };

  const convertedPct = isCgpa ? (values[pctKey] || '') : '';
  const cgpaVal  = values[cgpaKey]  || '';
  const scaleVal = values[scaleKey] || 10;
  const pctVal   = !isCgpa ? (values[pctKey] || '') : '';

  return (
    <div className="form-group" style={{ gridColumn: 'span 2' }}>
      <label>{label}</label>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.65rem' }}>
        {['PERCENTAGE', 'CGPA'].map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => switchMode(mode)}
            style={{
              padding: '.35rem .85rem', fontSize: '.8rem', fontWeight: 600,
              border: `2px solid ${scoreType === mode ? 'var(--primary-light)' : 'var(--border)'}`,
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              background: scoreType === mode ? 'rgba(59,130,246,.1)' : 'var(--surface2)',
              color: scoreType === mode ? 'var(--primary-light)' : 'var(--text2)',
              transition: 'all .15s',
            }}
          >
            {mode === 'PERCENTAGE' ? '% Percentage' : '📊 CGPA'}
          </button>
        ))}
      </div>

      {/* Percentage mode */}
      {!isCgpa && (
        <div style={{ position: 'relative' }}>
          <input
            type="number" name={pctKey} step="0.01" min="0" max="100"
            placeholder="e.g. 72.50"
            value={pctVal}
            onChange={handlePct}
            style={{ paddingRight: '2.5rem' }}
          />
          <span style={{
            position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', fontSize: '.88rem', fontWeight: 700, pointerEvents: 'none',
          }}>%</span>
        </div>
      )}

      {/* CGPA mode */}
      {isCgpa && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.65rem', alignItems: 'start' }}>
          {/* CGPA value */}
          <div>
            <input
              type="number" name={cgpaKey} step="0.01" min="0"
              max={scaleVal == 4 ? 4 : 10}
              placeholder={`e.g. ${scaleVal == 4 ? '3.5' : '8.5'}`}
              value={cgpaVal}
              onChange={handleCgpa}
            />
            <span className="form-hint">Your CGPA score</span>
          </div>

          {/* Scale selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem', paddingTop: '.5rem' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>SCALE</span>
            <select
              name={scaleKey}
              value={scaleVal}
              onChange={handleCgpa}
              style={{
                padding: '.5rem .6rem', border: '1px solid var(--border)',
                borderRadius: 8, fontFamily: 'inherit', fontSize: '.88rem',
                background: 'var(--surface)', cursor: 'pointer', width: 80,
              }}
            >
              <option value={10}>/ 10</option>
              <option value={4}>/ 4</option>
            </select>
          </div>

          {/* Auto-converted % result */}
          <div>
            <div style={{
              padding: '.65rem .85rem',
              background: convertedPct !== '' ? 'var(--success-light)' : 'var(--surface2)',
              border: `1px solid ${convertedPct !== '' ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: '.9rem', fontWeight: 700,
              color: convertedPct !== '' ? 'var(--success)' : 'var(--muted)',
              minHeight: '2.4rem', display: 'flex', alignItems: 'center',
            }}>
              {convertedPct !== '' ? `≈ ${convertedPct}%` : '—'}
            </div>
            <span className="form-hint">
              {scaleVal == 10 ? 'Formula: CGPA × 9.5 (UGC norm)' : 'Formula: (CGPA / 4) × 100'}
            </span>
          </div>
        </div>
      )}

      {hint && <span className="form-hint" style={{ marginTop: '.3rem', display: 'block' }}>{hint}</span>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [form, setForm] = useState({
    // UG
    ugDegree: 'B.E.', ugBranch: '', ugUniversity: '', ugPassingYear: '',
    ugScoreType: 'PERCENTAGE', ugPercentage: '', ugCgpa: null, ugCgpaScale: 10,
    // PG
    pgDegree: 'M.E.', pgBranch: '', pgUniversity: '', pgPassingYear: '',
    pgScoreType: 'PERCENTAGE', pgPercentage: '', pgCgpa: null, pgCgpaScale: 10,
    // PhD
    phdDone: false, phdUniversity: '', phdSubject: '', phdYear: '',
    // NET / SET / SLET
    netCleared: false, setCleared: false, sletCleared: false, netSetSletDetails: '',
    // Experience
    totalExperienceYears: '', teachingExperienceYears: '', industryExperienceYears: '',
    currentPost: '',
    // Publications
    sciPublications: 0, scieCitations: 0, scopusPublications: 0,
    ugcCarePublications: 0, conferencePublications: 0,
    localPublications: 0, booksChapters: 0,
    additionalInfo: '',
  });

  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({ type: '', text: '' });
  const [apiScore, setApiScore] = useState(0);

  // Load existing profile
  useEffect(() => {
    setLoading(true);
    facultyAPI.getProfile()
      .then(r => {
        const p = r.data;
        setForm(prev => ({
          ...prev, ...p,
          // Restore score type mode — default to PERCENTAGE for old profiles
          ugScoreType: p.ugScoreType || 'PERCENTAGE',
          pgScoreType: p.pgScoreType || 'PERCENTAGE',
          ugCgpaScale: p.ugCgpaScale || 10,
          pgCgpaScale: p.pgCgpaScale || 10,
        }));
        setApiScore(p.apiScore || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Generic field handler
  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // ScoreInput partial update handler
  const handleScoreChange = patch => {
    setForm(f => ({ ...f, ...patch }));
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      const r = await facultyAPI.saveProfile(form);
      setApiScore(r.data.apiScore || 0);
      setMsg({ type: 'success', text: '✅ Profile saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main>
    </div>
  );

  const hasAnyExam = form.netCleared || form.setCleared || form.sletCleared;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="flex-between page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>📚 Academic Profile</h1>
            <p>Fill in your complete academic details — used for automatic eligibility checks.</p>
          </div>
          <div className="card" style={{ padding: '.75rem 1.5rem', textAlign: 'center', minWidth: 150 }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>API Score</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'Poppins,sans-serif', lineHeight: 1.1 }}>{apiScore}</div>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '.2rem' }}>Auto-calculated</div>
          </div>
        </div>

        {msg.text && (
          <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'} mb-2`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={submit}>

          {/* ── UG ────────────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header"><h3>🎓 Under-Graduate (UG) Details</h3></div>
            <div className="form-section-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Degree</label>
                  <select name="ugDegree" value={form.ugDegree} onChange={handle}>
                    <option>B.E.</option><option>B.Tech</option><option>B.Sc</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch / Specialization</label>
                  <select name="ugBranch" value={form.ugBranch} onChange={handle}>
                    <option value="">Select Branch</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>University</label>
                  <input name="ugUniversity" placeholder="e.g. GTU, SPPU" value={form.ugUniversity} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>Passing Year</label>
                  <input name="ugPassingYear" type="number" placeholder="2005"
                    value={form.ugPassingYear} onChange={handle} min={1960} max={2030} />
                </div>

                {/* ── Score input for UG (Percentage or CGPA) ── */}
                <ScoreInput
                  label="UG Score"
                  prefix="ug"
                  values={form}
                  onChange={handleScoreChange}
                />
              </div>
            </div>
          </div>

          {/* ── PG ────────────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header"><h3>🎓 Post-Graduate (PG) Details</h3></div>
            <div className="form-section-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Degree</label>
                  <select name="pgDegree" value={form.pgDegree} onChange={handle}>
                    <option>M.E.</option><option>M.Tech</option><option>M.Sc</option>
                    <option>MBA</option><option>MCA</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch / Specialization</label>
                  <select name="pgBranch" value={form.pgBranch} onChange={handle}>
                    <option value="">Select Branch</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>University</label>
                  <input name="pgUniversity" placeholder="e.g. GTU, SPPU" value={form.pgUniversity} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>Passing Year</label>
                  <input name="pgPassingYear" type="number" placeholder="2010"
                    value={form.pgPassingYear} onChange={handle} min={1960} max={2030} />
                </div>

                {/* ── Score input for PG (Percentage or CGPA) ── */}
                <ScoreInput
                  label="PG Score"
                  prefix="pg"
                  values={form}
                  onChange={handleScoreChange}
                  hint="Minimum 55% (or equivalent CGPA) required for most posts (UGC norm)."
                />
              </div>
            </div>
          </div>

          {/* ── PhD ───────────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header">
              <h3>🔬 PhD Details</h3>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', fontWeight: 600,
                padding: '.4rem .85rem', borderRadius: 8, transition: 'all .15s',
                background: form.phdDone ? 'var(--success-light)' : 'var(--surface2)',
                border: `1px solid ${form.phdDone ? 'var(--success)' : 'var(--border)'}`,
                color: form.phdDone ? 'var(--success)' : 'var(--text2)',
              }}>
                <input type="checkbox" name="phdDone" checked={!!form.phdDone} onChange={handle} />
                {form.phdDone ? '✅ PhD Completed' : '○ PhD Not Completed'}
              </label>
            </div>
            {form.phdDone && (
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>PhD University</label>
                    <input name="phdUniversity" placeholder="University name" value={form.phdUniversity || ''} onChange={handle} />
                  </div>
                  <div className="form-group">
                    <label>Subject / Specialization</label>
                    <input name="phdSubject" placeholder="e.g. Computer Science" value={form.phdSubject || ''} onChange={handle} />
                  </div>
                  <div className="form-group">
                    <label>Year of Award</label>
                    <input name="phdYear" type="number" placeholder="2015" value={form.phdYear || ''} onChange={handle} min={1970} max={2030} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── NET / SET / SLET ──────────────────────────────────────────────── */}
          <div className="form-section" style={{ border: hasAnyExam ? '2px solid var(--primary-light)' : '1px solid var(--border)' }}>
            <div className="form-section-header" style={{ background: hasAnyExam ? 'rgba(59,130,246,.06)' : 'var(--surface2)' }}>
              <div>
                <h3>🏅 Qualifying Exam — NET / SET / SLET</h3>
                <p style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '.15rem', fontWeight: 400 }}>
                  Mandatory for teaching posts. PhD may grant exemption depending on post criteria.
                </p>
              </div>
            </div>
            <div className="form-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                {[
                  { name: 'netCleared',  title: 'NET Cleared',  sub: 'National Eligibility Test\nconducted by UGC / CSIR' },
                  { name: 'setCleared',  title: 'SET Cleared',  sub: 'State Eligibility Test\nconducted by state authority' },
                  { name: 'sletCleared', title: 'SLET Cleared', sub: 'State Level Eligibility Test\nequivalent to SET' },
                ].map(({ name, title, sub }) => (
                  <label key={name} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                    padding: '1rem', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form[name] ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: form[name] ? 'rgba(59,130,246,.08)' : 'var(--surface2)',
                    transition: 'all .15s',
                  }}>
                    <input type="checkbox" name={name} checked={!!form[name]} onChange={handle}
                      style={{ width: 18, height: 18, marginTop: '.15rem', cursor: 'pointer', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem', color: form[name] ? 'var(--primary-light)' : 'var(--text)' }}>
                        {form[name] ? '✓ ' : ''}{title}
                      </div>
                      <div style={{ fontSize: '.74rem', color: 'var(--text2)', marginTop: '.25rem', whiteSpace: 'pre-line' }}>{sub}</div>
                    </div>
                  </label>
                ))}
              </div>
              {hasAnyExam && (
                <div className="form-group">
                  <label>Exam Details</label>
                  <input name="netSetSletDetails"
                    placeholder="e.g. UGC NET — June 2019, Subject: Computer Science & Applications"
                    value={form.netSetSletDetails || ''} onChange={handle} />
                  <span className="form-hint">Month/year, subject, roll number. Upload scorecard in My Documents.</span>
                </div>
              )}
              {!hasAnyExam && !form.phdDone && (
                <div className="alert alert-warn" style={{ marginBottom: 0, fontSize: '.83rem' }}>
                  <strong>⚠️ Advisory:</strong> UGC requires either a qualifying exam (NET/SET/SLET) or a PhD for teaching posts.
                </div>
              )}
              {!hasAnyExam && form.phdDone && (
                <div className="alert alert-success" style={{ marginBottom: 0, fontSize: '.83rem' }}>
                  <strong>✅ PhD Exemption may apply.</strong> Your PhD can satisfy the NET/SET/SLET requirement for many posts.
                </div>
              )}
            </div>
          </div>

          {/* ── Experience ────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header"><h3>💼 Experience</h3></div>
            <div className="form-section-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Total Experience (Years)</label>
                  <input name="totalExperienceYears" type="number" step="0.5" placeholder="10"
                    value={form.totalExperienceYears} onChange={handle} min={0} />
                </div>
                <div className="form-group">
                  <label>Teaching Experience (Years)</label>
                  <input name="teachingExperienceYears" type="number" step="0.5" placeholder="8"
                    value={form.teachingExperienceYears} onChange={handle} min={0} />
                  <span className="form-hint">Post-qualification teaching only.</span>
                </div>
                <div className="form-group">
                  <label>Industry Experience (Years)</label>
                  <input name="industryExperienceYears" type="number" step="0.5" placeholder="2"
                    value={form.industryExperienceYears} onChange={handle} min={0} />
                </div>
                <div className="form-group">
                  <label>Current Post / Designation</label>
                  <select name="currentPost" value={form.currentPost} onChange={handle}>
                    <option value="">Select Current Post</option>
                    {POSTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Publications ──────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header"><h3>📰 Publications & Research Output</h3></div>
            <div className="form-section-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>SCI / SCIE Publications</label>
                  <input name="sciPublications" type="number" value={form.sciPublications} onChange={handle} min={0} />
                  <span className="form-hint">30 API pts each</span>
                </div>
                <div className="form-group">
                  <label>SCI / SCIE Citations</label>
                  <input name="scieCitations" type="number" value={form.scieCitations} onChange={handle} min={0} />
                  <span className="form-hint">5 API pts each</span>
                </div>
                <div className="form-group">
                  <label>Scopus Indexed</label>
                  <input name="scopusPublications" type="number" value={form.scopusPublications} onChange={handle} min={0} />
                  <span className="form-hint">20 API pts each</span>
                </div>
                <div className="form-group">
                  <label>UGC Care Publications</label>
                  <input name="ugcCarePublications" type="number" value={form.ugcCarePublications} onChange={handle} min={0} />
                  <span className="form-hint">10 API pts each</span>
                </div>
                <div className="form-group">
                  <label>Conference Papers</label>
                  <input name="conferencePublications" type="number" value={form.conferencePublications} onChange={handle} min={0} />
                  <span className="form-hint">5 API pts each</span>
                </div>
                <div className="form-group">
                  <label>Local / Other Journal</label>
                  <input name="localPublications" type="number" value={form.localPublications} onChange={handle} min={0} />
                  <span className="form-hint">2 API pts each</span>
                </div>
                <div className="form-group">
                  <label>Books / Book Chapters</label>
                  <input name="booksChapters" type="number" value={form.booksChapters} onChange={handle} min={0} />
                  <span className="form-hint">15 API pts each</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Additional ────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-header"><h3>📝 Additional Information</h3></div>
            <div className="form-section-body">
              <div className="form-group">
                <label>Awards, Patents, Funded Projects, FDP attended, etc.</label>
                <textarea name="additionalInfo" rows={4}
                  placeholder="e.g. Patent filed (2021), PI for DST project ₹5L, FDP at IIT Bombay (2023)"
                  value={form.additionalInfo || ''} onChange={handle} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Profile'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
