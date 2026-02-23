import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar    from './components/Sidebar.jsx'
import Dashboard  from './components/Dashboard.jsx'
import Employees  from './components/Employees.jsx'
import Attendance from './components/Attendance.jsx'

const TITLES = {
  '/':           { title: 'Dashboard',  sub: 'Workforce overview' },
  '/employees':  { title: 'Employees',  sub: 'Manage your team' },
  '/attendance': { title: 'Attendance', sub: 'Track daily attendance' },
}

export default function App() {
  const loc = useLocation()
  const meta = TITLES[loc.pathname] || TITLES['/']

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className="admin-badge">
            <div className="admin-avatar">A</div>
            Admin
          </div>
        </header>

        <main className="page-body">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/employees"  element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
