import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { criteriaAPI } from '../../services/api';

const POSTS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Principal/HOD'];
const POST_ICONS = { 'Assistant Professor':'👩‍🏫', 'Associate Professor':'👨‍🏫', 'Professor':'🎓', 'Principal/HOD':'🏛️' };

const DEFAULTS = {
  netSetSletRequirement: 'OR_PHD',
  netAccepted: true, setAccepted: true, sletAccepted: true,
  minPgPercentage: 55, phdRequired: false,
  minTeachingExperienceYears: 0, minTotalExperienceYears: 0,
  minApiScore: 0,
  minSciPublications: 0, minScopusPublications: 0, minUgcCarePublications: 0,
  minConferencePublications: 0, minLocalPublications: 0, minTotalIndexedPublications: 0,
  weightSciPublication: 30, weightScieCitation: 5,
  weightScopusPublication: 20, weightUgcCarePublication: 10,
  weightConferencePublication: 5, weightLocalPublication: 2,
  weightBookChapter: 15, weightTeachingExperiencePerYear: 10,
  maxTeachingExperiencePoints: 100,
  phdBonus: 30, netSetSletBonus: 0,
  pgBonusThreshold1: 75, pgBonus1: 20,
  pgBonusThreshold2: 60, pgBonus2: 10,
  changeNote: '',
};

const N = ({ label, name, value, onChange, hint, min=0, step=1, suffix='' }) => (
  <div className="form-group">
    <label>{label}</label>
    <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
      <input type="number" name={name} value={value ?? 0} onChange={onChange}
        min={min} step={step}
        style={{ flex:1, padding:'.55rem .75rem', border:'1px solid var(--border)', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem' }} />
      {suffix && <span style={{ color:'var(--muted)', fontSize:'.78rem', whiteSpace:'nowrap' }}>{suffix}</span>}
    </div>
    {hint && <span className="form-hint">{hint}</span>}
  </div>
);

const Toggle = ({ label, name, checked, onChange, desc }) => (
  <label style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.65rem .85rem',
    border:`2px solid ${checked ? 'var(--success)' : 'var(--border)'}`,
    borderRadius:8, cursor:'pointer',
    background: checked ? 'var(--success-light)' : 'var(--surface2)', transition:'all .15s' }}>
    <input type="checkbox" name={name} checked={!!checked} onChange={onChange} style={{ width:16, height:16, cursor:'pointer' }} />
    <div>
      <div style={{ fontWeight:600, fontSize:'.88rem' }}>{label}</div>
      {desc && <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:'.1rem' }}>{desc}</div>}
    </div>
  </label>
);

function VersionHistory({ post, onActivate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    criteriaAPI.getHistory(post).then(r => setHistory(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, [post]);

  if (loading) return <div style={{ padding:'2rem', textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>;
  if (!history.length) return <p className="text-muted" style={{ padding:'1.5rem' }}>No history yet.</p>;

  return (
    <div style={{ maxHeight:400, overflow:'auto' }}>
      {history.map(v => (
        <div key={v.id} style={{
          padding:'.85rem 1.25rem', borderBottom:'1px solid var(--border)',
          background: v.active ? 'rgba(22,163,74,.07)' : 'var(--surface)',
          display:'flex', gap:'1rem', alignItems:'flex-start'
        }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.3rem' }}>
              <span style={{ fontWeight:800, fontSize:.95+'rem', fontFamily:'Poppins,sans-serif' }}>v{v.version}</span>
              {v.active && <span className="badge badge-active" style={{ fontSize:'.7rem' }}>● ACTIVE NOW</span>}
            </div>
            <div className="text-sm text-muted">{new Date(v.createdAt).toLocaleString('en-IN')} · by {v.createdBy||'—'}</div>
            {v.changeNote && <div style={{ fontSize:'.8rem', color:'var(--text2)', marginTop:'.3rem', fontStyle:'italic' }}>"{v.changeNote}"</div>}
            <div style={{ fontSize:'.78rem', color:'var(--text2)', marginTop:'.4rem', display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
              <span>PG ≥ {v.minPgPercentage}%</span>
              <span>PhD: {v.phdRequired ? '✅ Req.' : '○ Optional'}</span>
              <span>NET/SET/SLET: {v.netSetSletRequirement}</span>
              <span>Teach ≥ {v.minTeachingExperienceYears}y</span>
              <span>API ≥ {v.minApiScore}</span>
            </div>
          </div>
          {!v.active && (
            <button className="btn btn-sm btn-outline" onClick={() => onActivate(v.id)}>↺ Restore</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminCriteria() {
  const [tab, setTab] = useState('form');
  const [post, setPost] = useState('Assistant Professor');
  const [form, setForm] = useState(DEFAULTS);
  const [activeCriteria, setActiveCriteria] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [xlFile, setXlFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [histPost, setHistPost] = useState('Assistant Professor');
  const [histKey, setHistKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const loadActive = useCallback(() => {
    criteriaAPI.getAllActive().then(r => {
      const map = {};
      r.data.forEach(c => { map[c.postName] = c; });
      setActiveCriteria(map);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadActive(); }, [loadActive]);

  useEffect(() => {
    const c = activeCriteria[post];
    if (c) {
      const { id, version, active, createdAt, activatedAt, createdBy, ...fields } = c;
      setForm({ ...fields, changeNote: '' });
    } else {
      setForm(DEFAULTS);
    }
  }, [post, activeCriteria]);

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const toast = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:'', text:'' }), 5000); };

  const saveForm = async () => {
    if (!form.changeNote?.trim()) { toast('error', 'Please enter a change note before saving.'); return; }
    setSaving(true);
    try {
      const r = await criteriaAPI.saveCriteria({ ...form, postName: post });
      setActiveCriteria(p => ({ ...p, [post]: r.data }));
      setHistKey(k => k+1);
      toast('success', `✅ Criteria for "${post}" saved as v${r.data.version} and activated immediately.`);
    } catch (err) {
      toast('error', err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const restoreVersion = async (id) => {
    try {
      const r = await criteriaAPI.activateVersion(id);
      setActiveCriteria(p => ({ ...p, [r.data.postName]: r.data }));
      setHistKey(k => k+1);
      toast('success', `✅ Version v${r.data.version} of "${r.data.postName}" restored and activated.`);
    } catch { toast('error', 'Restore failed.'); }
  };

  const importExcel = async () => {
    if (!xlFile) return;
    setImporting(true); setImportResult(null);
    try {
      const r = await criteriaAPI.importExcel(xlFile);
      setImportResult(r.data);
      loadActive();
      setHistKey(k => k+1);
      if (r.data.imported > 0) toast('success', `✅ Imported ${r.data.imported} post criteria from Excel.`);
    } catch (err) {
      toast('error', err.response?.data?.message || 'Import failed.');
    } finally { setImporting(false); }
  };

  const downloadTemplate = async () => {
    const r = await criteriaAPI.downloadTemplate();
    const url = URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url;
    a.download = 'eligibility_criteria_template.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>⚙️ Eligibility Criteria Manager</h1>
          <p>All changes take effect immediately and are versioned. Zero hardcoded rules.</p>
        </div>

        {msg.text && <div className={`alert alert-${msg.type==='success'?'success':'error'}`} style={{ marginBottom:'1.25rem' }}>{msg.text}</div>}

        {/* Active criteria summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {POSTS.map(p => {
            const c = activeCriteria[p];
            return (
              <div key={p} className="card" style={{ cursor:'pointer', borderColor: post===p && tab==='form' ? 'var(--primary-light)' : 'var(--border)', borderWidth: post===p && tab==='form' ? 2 : 1 }}
                onClick={() => { setPost(p); setTab('form'); }}>
                <div className="card-body" style={{ padding:'1rem' }}>
                  <div style={{ fontSize:'1.6rem', marginBottom:'.3rem' }}>{POST_ICONS[p]}</div>
                  <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:'.5rem' }}>{p}</div>
                  {c ? (
                    <div style={{ fontSize:'.75rem', color:'var(--text2)', display:'flex', flexDirection:'column', gap:'.2rem' }}>
                      <span>📊 PG ≥ {c.minPgPercentage}%</span>
                      <span>{c.phdRequired ? '✅ PhD required' : '○ PhD optional'}</span>
                      <span>🎓 {c.netSetSletRequirement === 'NONE' ? 'No exam req.' : c.netSetSletRequirement === 'REQUIRED' ? 'Exam mandatory' : 'Exam OR PhD'}</span>
                      <span>⏱ Teach ≥ {c.minTeachingExperienceYears}y</span>
                      <span>📈 API ≥ {c.minApiScore}</span>
                      <span className="badge badge-active" style={{ marginTop:'.3rem', fontSize:'.68rem', width:'fit-content' }}>v{c.version} active</span>
                    </div>
                  ) : <span className="badge badge-inactive" style={{ fontSize:'.7rem' }}>Not configured</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab bar */}
        <div className="tabs">
          {[['form','📝 Edit via Form'],['excel','📊 Import from Excel'],['history','🕑 Version History']].map(([k,l]) => (
            <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ═══ TAB: FORM ═══════════════════════════════════════════════════════════ */}
        {tab === 'form' && (
          <>
            {/* Post selector */}
            <div className="card" style={{ marginBottom:'1.25rem' }}>
              <div className="card-body" style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
                {POSTS.map(p => (
                  <button key={p} onClick={() => setPost(p)}
                    className={`btn ${post===p?'btn-primary':'btn-secondary'}`}>
                    {POST_ICONS[p]} {p}
                    {activeCriteria[p] && <span style={{ marginLeft:'.4rem', opacity:.7, fontSize:'.75rem' }}>v{activeCriteria[p].version}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Section 1: Qualifying Exam ──────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-header" style={{ background:'linear-gradient(to right, rgba(124,58,237,.08), transparent)' }}>
                <h3>🎓 NET / SET / SLET — Qualifying Exam Requirements</h3>
              </div>
              <div className="form-section-body">
                <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                  <label>Requirement Mode</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
                    {[
                      ['NONE',     '⭕ Not Required',    'No qualifying exam needed for this post.'],
                      ['REQUIRED', '🔴 Mandatory',       'Candidate MUST have NET, SET, or SLET.'],
                      ['OR_PHD',   '🟡 Required OR PhD', 'Either qualifying exam OR PhD is sufficient. (UGC standard)'],
                    ].map(([val, label, desc]) => (
                      <label key={val} style={{
                        padding:'.85rem 1rem', border:`2px solid ${form.netSetSletRequirement===val ? 'var(--primary-light)' : 'var(--border)'}`,
                        borderRadius:10, cursor:'pointer', display:'flex', gap:'.75rem', alignItems:'flex-start',
                        background: form.netSetSletRequirement===val ? 'rgba(59,130,246,.07)' : 'var(--surface2)',
                        transition:'all .15s'
                      }}>
                        <input type="radio" name="netSetSletRequirement" value={val}
                          checked={form.netSetSletRequirement===val} onChange={handle}
                          style={{ marginTop:'.2rem', flexShrink:0 }} />
                        <div>
                          <div style={{ fontWeight:700, fontSize:'.9rem' }}>{label}</div>
                          <div style={{ fontSize:'.76rem', color:'var(--text2)', marginTop:'.2rem' }}>{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {form.netSetSletRequirement !== 'NONE' && (
                  <div>
                    <label style={{ fontSize:'.8rem', fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.4px', display:'block', marginBottom:'.65rem' }}>
                      Which exams are accepted for this post?
                    </label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
                      <Toggle label="NET" name="netAccepted" checked={form.netAccepted} onChange={handle}
                        desc="National Eligibility Test (UGC/CSIR)" />
                      <Toggle label="SET" name="setAccepted" checked={form.setAccepted} onChange={handle}
                        desc="State Eligibility Test" />
                      <Toggle label="SLET" name="sletAccepted" checked={form.sletAccepted} onChange={handle}
                        desc="State Level Eligibility Test" />
                    </div>
                    <N label="NET/SET/SLET Bonus API Points" name="netSetSletBonus" value={form.netSetSletBonus}
                      onChange={handle} suffix="pts" hint="Extra API points if candidate has cleared qualifying exam (0 = no bonus)" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 2: Education & Experience ───────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-header"><h3>📚 Education & Experience Requirements</h3></div>
              <div className="form-section-body">
                <div className="form-grid">
                  <N label="Min PG Percentage (%)" name="minPgPercentage" value={form.minPgPercentage}
                    onChange={handle} step={0.5} suffix="%" hint="UGC standard: 55%" />
                  <div className="form-group">
                    <label>PhD Required?</label>
                    <Toggle label={form.phdRequired ? '✅ PhD is MANDATORY' : '○ PhD NOT mandatory'}
                      name="phdRequired" checked={form.phdRequired} onChange={handle}
                      desc={form.phdRequired ? 'Candidate must have completed PhD.' : 'PhD is optional (but earns bonus API points).'} />
                  </div>
                  <N label="Min Teaching Experience" name="minTeachingExperienceYears" value={form.minTeachingExperienceYears}
                    onChange={handle} step={0.5} suffix="years" hint="Set 0 if not required" />
                  <N label="Min Total Experience" name="minTotalExperienceYears" value={form.minTotalExperienceYears}
                    onChange={handle} step={0.5} suffix="years" hint="Set 0 if not required" />
                  <N label="Min API Score" name="minApiScore" value={form.minApiScore}
                    onChange={handle} hint="Set 0 if no minimum API score required" />
                </div>
              </div>
            </div>

            {/* ── Section 3: Publication Minimums ─────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-header"><h3>📰 Minimum Publications Required</h3></div>
              <div className="form-section-body">
                <div className="form-grid">
                  <N label="Min SCI / SCIE" name="minSciPublications" value={form.minSciPublications} onChange={handle} hint="Set 0 = not required" />
                  <N label="Min Scopus" name="minScopusPublications" value={form.minScopusPublications} onChange={handle} hint="Set 0 = not required" />
                  <N label="Min UGC Care" name="minUgcCarePublications" value={form.minUgcCarePublications} onChange={handle} hint="Set 0 = not required" />
                  <N label="Min Conference Papers" name="minConferencePublications" value={form.minConferencePublications} onChange={handle} hint="Set 0 = not required" />
                  <N label="Min Local Publications" name="minLocalPublications" value={form.minLocalPublications} onChange={handle} hint="Set 0 = not required" />
                  <N label="Min Total Indexed (SCI+Scopus+UGC)" name="minTotalIndexedPublications" value={form.minTotalIndexedPublications} onChange={handle} hint="Combined minimum. Set 0 = not required" />
                </div>
              </div>
            </div>

            {/* ── Section 4: API Score Weights ─────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-header">
                <h3>⚖️ API Score Weights</h3>
                <span className="text-muted text-sm">Points earned per activity unit</span>
              </div>
              <div className="form-section-body">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem' }}>
                  <N label="SCI/SCIE Paper" name="weightSciPublication" value={form.weightSciPublication} onChange={handle} suffix="pts each" />
                  <N label="SCI/SCIE Citation" name="weightScieCitation" value={form.weightScieCitation} onChange={handle} suffix="pts each" />
                  <N label="Scopus Paper" name="weightScopusPublication" value={form.weightScopusPublication} onChange={handle} suffix="pts each" />
                  <N label="UGC Care Paper" name="weightUgcCarePublication" value={form.weightUgcCarePublication} onChange={handle} suffix="pts each" />
                  <N label="Conference Paper" name="weightConferencePublication" value={form.weightConferencePublication} onChange={handle} suffix="pts each" />
                  <N label="Local Publication" name="weightLocalPublication" value={form.weightLocalPublication} onChange={handle} suffix="pts each" />
                  <N label="Book / Chapter" name="weightBookChapter" value={form.weightBookChapter} onChange={handle} suffix="pts each" />
                  <N label="Teaching Exp per Year" name="weightTeachingExperiencePerYear" value={form.weightTeachingExperiencePerYear} onChange={handle} suffix="pts/year" />
                  <N label="Max Teaching Exp Points" name="maxTeachingExperiencePoints" value={form.maxTeachingExperiencePoints} onChange={handle} suffix="pts cap" />
                </div>
              </div>
            </div>

            {/* ── Section 5: Bonus Points ──────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-header"><h3>🎁 Bonus API Points</h3></div>
              <div className="form-section-body">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem' }}>
                  <N label="PhD Completion Bonus" name="phdBonus" value={form.phdBonus} onChange={handle} suffix="pts" hint="Added if PhD is completed" />
                  <N label="NET/SET/SLET Bonus" name="netSetSletBonus" value={form.netSetSletBonus} onChange={handle} suffix="pts" hint="Added if qualifying exam cleared" />
                  <N label="PG Bonus Threshold 1 (%)" name="pgBonusThreshold1" value={form.pgBonusThreshold1} onChange={handle} step={0.5} suffix="%" hint="If PG% ≥ this → add Bonus 1" />
                  <N label="PG Bonus 1 Points" name="pgBonus1" value={form.pgBonus1} onChange={handle} suffix="pts" />
                  <N label="PG Bonus Threshold 2 (%)" name="pgBonusThreshold2" value={form.pgBonusThreshold2} onChange={handle} step={0.5} suffix="%" hint="If PG% ≥ this → add Bonus 2" />
                  <N label="PG Bonus 2 Points" name="pgBonus2" value={form.pgBonus2} onChange={handle} suffix="pts" />
                </div>
              </div>
            </div>

            {/* ── Change Note + Save ────────────────────────────────────────────────── */}
            <div className="form-section" style={{ border:'2px solid var(--primary-light)' }}>
              <div className="form-section-header" style={{ background:'rgba(59,130,246,.06)' }}>
                <h3>📝 Change Note & Save</h3>
              </div>
              <div className="form-section-body">
                <div className="form-group">
                  <label>Reason for this change <span style={{ color:'var(--danger)' }}>*</span></label>
                  <textarea name="changeNote" rows={2} value={form.changeNote} onChange={handle}
                    placeholder="e.g. Updated as per UGC circular No. F.3-1/2009, dated Jan 2025..." />
                  <span className="form-hint">Recorded in version history. Required before saving.</span>
                </div>
                <div style={{ display:'flex', gap:'1rem', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => setForm(DEFAULTS)}>↺ Reset to Defaults</button>
                  <button className="btn btn-primary btn-lg" onClick={saveForm}
                    disabled={saving || !form.changeNote?.trim()}>
                    {saving ? '⏳ Saving...' : `💾 Save & Activate for ${post}`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ TAB: EXCEL ══════════════════════════════════════════════════════════ */}
        {tab === 'excel' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            {/* Download template */}
            <div className="card">
              <div className="card-header"><h3>📥 Step 1 — Download Template</h3></div>
              <div className="card-body">
                <p style={{ color:'var(--text2)', fontSize:'.9rem', marginBottom:'1rem' }}>
                  Download the Excel template pre-filled with all 4 posts and default UGC values. Edit the numbers and upload back.
                </p>
                <div className="alert alert-info" style={{ fontSize:'.8rem', marginBottom:'1.25rem' }}>
                  <div style={{ fontWeight:600, marginBottom:'.4rem' }}>31 columns covering:</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.2rem' }}>
                    <span>🎓 NET/SET/SLET requirements & accepted exams</span>
                    <span>📊 PG percentage, PhD required</span>
                    <span>⏱ Teaching & total experience minimums</span>
                    <span>📈 API score minimum</span>
                    <span>📰 Min publications per index (SCI, Scopus, UGC, Conference, Local)</span>
                    <span>⚖️ API score weights for each activity</span>
                    <span>🎁 Bonus points (PhD, NET/SET/SLET, PG%)</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }} onClick={downloadTemplate}>
                  📥 Download Excel Template (.xlsx)
                </button>
              </div>
            </div>

            {/* Upload */}
            <div className="card">
              <div className="card-header"><h3>📤 Step 2 — Upload Filled Template</h3></div>
              <div className="card-body">
                <div className={`upload-zone ${dragging?'dragging':''}`}
                  onDragOver={e=>{e.preventDefault();setDragging(true);}}
                  onDragLeave={()=>setDragging(false)}
                  onDrop={e=>{e.preventDefault();setDragging(false);setXlFile(e.dataTransfer.files[0]);}}
                  onClick={()=>fileRef.current?.click()}>
                  <div className="upload-icon">{xlFile?'📊':'☁️'}</div>
                  <p style={{ fontWeight:600 }}>{xlFile?xlFile.name:'Click or drag .xlsx file here'}</p>
                  <p>Only Excel .xlsx files</p>
                  <input ref={fileRef} type="file" accept=".xlsx" style={{ display:'none' }}
                    onChange={e=>setXlFile(e.target.files[0])} />
                </div>
                {xlFile && <button className="btn btn-sm btn-secondary mt-1" onClick={()=>{setXlFile(null);if(fileRef.current)fileRef.current.value='';}}>✕ Remove</button>}

                <button className="btn btn-success btn-lg" style={{ width:'100%', justifyContent:'center', marginTop:'1rem' }}
                  onClick={importExcel} disabled={!xlFile||importing}>
                  {importing ? '⏳ Importing...' : '📊 Import & Activate All Posts'}
                </button>

                <div className="alert alert-warn" style={{ fontSize:'.8rem', marginTop:'.75rem' }}>
                  ⚠️ Importing activates new criteria immediately for each post in the file. Old versions are preserved in history.
                </div>
              </div>
            </div>

            {/* Import result */}
            {importResult && (
              <div className="card" style={{ gridColumn:'1 / -1' }}>
                <div className="card-header"><h3>📊 Import Result</h3></div>
                <div className="card-body">
                  <div style={{ display:'flex', gap:'2rem', marginBottom:'1rem' }}>
                    <div><span style={{ fontSize:'2.5rem', fontWeight:800, color:'var(--success)', fontFamily:'Poppins,sans-serif' }}>{importResult.imported}</span><br /><span className="text-muted text-sm">Posts Updated</span></div>
                    <div><span style={{ fontSize:'2.5rem', fontWeight:800, color:'var(--warn)', fontFamily:'Poppins,sans-serif' }}>{importResult.skipped}</span><br /><span className="text-muted text-sm">Rows Skipped</span></div>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div className="alert alert-error mb-2">
                      <strong>Errors found:</strong>
                      <ul style={{ marginTop:'.5rem', paddingLeft:'1.25rem' }}>
                        {importResult.errors.map((e,i)=><li key={i} style={{ fontSize:'.82rem' }}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  {importResult.criteria?.length > 0 && (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Post</th><th>NET/SET/SLET</th><th>Min PG%</th><th>PhD</th><th>Teach Exp</th><th>Min API</th><th>Version</th></tr></thead>
                        <tbody>
                          {importResult.criteria.map(c => (
                            <tr key={c.id}>
                              <td><strong>{c.postName}</strong></td>
                              <td><span style={{ fontSize:'.8rem' }}>{c.netSetSletRequirement}</span></td>
                              <td>≥ {c.minPgPercentage}%</td>
                              <td>{c.phdRequired ? '✅ Yes' : '○ No'}</td>
                              <td>≥ {c.minTeachingExperienceYears}y</td>
                              <td>≥ {c.minApiScore}</td>
                              <td><span className="badge badge-active">v{c.version}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: HISTORY ════════════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'1.25rem' }}>
            <div className="card">
              <div className="card-header"><h3>Select Post</h3></div>
              <div style={{ padding:'.5rem' }}>
                {POSTS.map(p=>(
                  <button key={p} onClick={()=>setHistPost(p)}
                    className={`btn btn-sm ${histPost===p?'btn-primary':'btn-secondary'}`}
                    style={{ width:'100%', justifyContent:'flex-start', marginBottom:'.4rem' }}>
                    {POST_ICONS[p]} {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3>🕑 {histPost} — All Versions</h3>
                <span className="text-muted text-sm">Click "Restore" to roll back to any version</span>
              </div>
              <VersionHistory key={`${histPost}-${histKey}`} post={histPost} onActivate={restoreVersion} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
