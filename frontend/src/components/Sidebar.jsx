import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/',           icon: '◼',  label: 'Dashboard'  },
  { to: '/employees',  icon: '👥', label: 'Employees'  },
  { to: '/attendance', icon: '📋', label: 'Attendance' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">H</div>
        <div>
          <span>HRMS Lite</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>HRMS Lite v1.0</div>
        <div>Single Admin Mode</div>
      </div>
    </aside>
  )
}
