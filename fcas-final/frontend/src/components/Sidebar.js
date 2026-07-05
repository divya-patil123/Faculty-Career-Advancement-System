import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label, exact }) => (
  <NavLink to={to} end={exact}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span className="nav-icon">{icon}</span>{label}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🎓</div>
          <div className="sidebar-brand-text"><h3>FCAS</h3><p>Career Advancement System</p></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin() ? (
          <>
            <div className="nav-section"><div className="nav-section-label">Overview</div>
              <NavItem to="/admin" icon="📊" label="Dashboard" exact />
            </div>
            <div className="nav-section"><div className="nav-section-label">Applications</div>
              <NavItem to="/admin/applications" icon="📋" label="All Applications" />
            </div>
            <div className="nav-section"><div className="nav-section-label">Users</div>
              <NavItem to="/admin/faculty" icon="👨‍🏫" label="Faculty Members" />
              <NavItem to="/admin/manage"  icon="🛡️"  label="Admin Users" />
            </div>
            <div className="nav-section"><div className="nav-section-label">Configuration</div>
              <NavItem to="/admin/criteria" icon="⚙️" label="Eligibility Criteria" />
            </div>
          </>
        ) : (
          <>
            <div className="nav-section"><div className="nav-section-label">Overview</div>
              <NavItem to="/dashboard" icon="🏠" label="Dashboard" exact />
            </div>
            <div className="nav-section"><div className="nav-section-label">My Profile</div>
              <NavItem to="/profile"   icon="👤" label="Academic Profile" />
              <NavItem to="/documents" icon="📁" label="My Documents" />
            </div>
            <div className="nav-section"><div className="nav-section-label">Career Advancement</div>
              <NavItem to="/eligibility"     icon="✅" label="Check Eligibility" />
              <NavItem to="/apply"           icon="📝" label="Apply for Post" />
              <NavItem to="/my-applications" icon="📋" label="My Applications" />
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{isAdmin() ? 'Administrator' : (user?.department || 'Faculty')}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>← Sign Out</button>
      </div>
    </div>
  );
}
