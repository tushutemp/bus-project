import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, userRole }) => {
  const getNavItems = () => {
    const commonItems = [
      { icon: '🏠', label: 'Dashboard', path: '/' },
      { icon: '🗺️', label: 'Live Map', path: '/map' },
      { icon: '📅', label: 'Schedule', path: '/schedule' }
    ];

    const roleItems = {
      passenger: [
        { icon: '⭐', label: 'Bookmarks', path: '/bookmarks' },
        { icon: '🎫', label: 'My Tickets', path: '/tickets' }
      ],
      driver: [
        { icon: '🚌', label: 'My Trip', path: '/trip' },
        { icon: '📊', label: 'Trip History', path: '/history' },
        { icon: '🆘', label: 'SOS', path: '/sos' }
      ],
      admin: [
        { icon: '📋', label: 'Fleet Management', path: '/fleet' },
        { icon: '👥', label: 'Users', path: '/users' },
        { icon: '📈', label: 'Analytics', path: '/analytics' }
      ]
    };

    return [...commonItems, ...(roleItems[userRole] || [])];
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
          <button className="sidebar-close" onClick={onClose}>×</button>
        </div>

        <nav className="sidebar-nav">
          {getNavItems().map((item, index) => (
            <a
              key={index}
              href={item.path}
              className="nav-item"
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="app-version">Version 1.0.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;