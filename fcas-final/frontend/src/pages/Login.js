import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
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
            <h1>Streamline Your Career Growth</h1>
            <p>An automated platform for engineering faculty to manage career advancement applications, eligibility checks, and document submissions.</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon">✅</div> Automated eligibility checking</div>
            <div className="auth-feature"><div className="auth-feature-icon">📁</div> Paperless document management</div>
            <div className="auth-feature"><div className="auth-feature-icon">🔔</div> Real-time application tracking</div>
            <div className="auth-feature"><div className="auth-feature-icon">🛡️</div> Role-based access control</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Welcome Back</h2>
          <p className="sub">Sign in to your account to continue.</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={submit}>
            <div className="form-group mb-2">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="your.email@college.edu"
                value={form.email} onChange={handle} required autoFocus />
            </div>
            <div className="form-group mb-2">
              <label>Password</label>
              <input name="password" type="password" placeholder="Enter your password"
                value={form.password} onChange={handle} required />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? '⏳ Signing in...' : '→ Sign In'}
            </button>
          </form>

          <div className="auth-switch mt-2">
            New faculty member? <Link to="/register">Create an account</Link>
          </div>

          <div className="alert alert-info mt-2" style={{ fontSize: '.8rem' }}>
            <div>
              <strong>Default Admin:</strong> admin@college.edu / Admin@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
