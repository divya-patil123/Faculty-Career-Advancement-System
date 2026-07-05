import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const DEPARTMENTS = ['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','Electrical Engineering','Chemical Engineering','Applied Sciences','MBA/MCA','Other'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', employeeId:'', department:'', designation:'', phone:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await authAPI.register(data);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="auth-logo-box">🎓</div>
            <h2>Faculty Career<br />Advancement System</h2>
          </div>
          <div className="auth-tagline">
            <h1>Join Our Platform</h1>
            <p>Register as a faculty member to start managing your career advancement applications.</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon">📝</div> Fill your academic profile once</div>
            <div className="auth-feature"><div className="auth-feature-icon">📊</div> Auto-calculated API score</div>
            <div className="auth-feature"><div className="auth-feature-icon">🔍</div> Instant eligibility results</div>
            <div className="auth-feature"><div className="auth-feature-icon">📱</div> Track applications in real-time</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box" style={{ maxWidth: 480 }}>
          <h2>Create Account</h2>
          <p className="sub">Fill in your details to register as faculty.</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <form onSubmit={submit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" placeholder="Dr. Ramesh Kumar" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Employee ID</label>
                <input name="employeeId" placeholder="EMP001" value={form.employeeId} onChange={handle} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Email Address *</label>
                <input name="email" type="email" placeholder="ramesh@college.edu" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select name="department" value={form.department} onChange={handle}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Current Designation</label>
                <input name="designation" placeholder="Assistant Professor" value={form.designation} onChange={handle} />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handle} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" placeholder="9876543210" value={form.phone} onChange={handle} />
              </div>
            </div>
            <button className="btn btn-primary btn-lg mt-2" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? '⏳ Creating account...' : '→ Register'}
            </button>
          </form>

          <div className="auth-switch mt-2">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
