import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Header.css';

const Header = ({ userRole, onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const getTitle = () => {
    switch (userRole) {
      case 'driver': return 'Driver Dashboard';
      case 'admin':  return 'Admin Panel';
      default:       return 'Bus Tracking System';
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>☰</button>
        <h1 className="header-title">{getTitle()}</h1>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="icon-btn notification-btn">
            🔔
            <span className="badge">3</span>
          </button>

          <div className="user-menu">
            <button className="user-btn" onClick={() => setShowUserMenu(p => !p)}>
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{displayName}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showUserMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="user-dropdown" style={{ zIndex: 100 }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{displayName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{userRole}</div>
                  </div>
                  <a href="#profile" onClick={() => setShowUserMenu(false)}>👤 Profile</a>
                  <a href="#settings" onClick={() => setShowUserMenu(false)}>⚙️ Settings</a>
                  <hr />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none',
                      border: 'none', padding: '10px 16px', cursor: 'pointer',
                      color: '#dc2626', fontWeight: 600, fontSize: '14px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontFamily: 'inherit'
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
