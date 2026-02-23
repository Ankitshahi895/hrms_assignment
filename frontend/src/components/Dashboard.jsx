import { useEffect, useState } from 'react'
import { api } from '../api.js'

const STAT_CONFIG = [
  { key: 'total_employees', label: 'Total Employees', icon: '👥', color: '#eef2ff', iconColor: '#4f46e5' },
  { key: 'departments',     label: 'Departments',     icon: '🏢', color: '#f0fdf4', iconColor: '#10b981' },
  { key: 'total_present',   label: 'Total Present',   icon: '✅', color: '#f0fdf4', iconColor: '#10b981' },
  { key: 'total_absent',    label: 'Total Absent',    icon: '❌', color: '#fef2f2', iconColor: '#ef4444' },
]

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      Loading dashboard…
    </div>
  )

  if (error) return (
    <div className="alert alert-error">⚠ {error}</div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your workforce and attendance</p>
        </div>
      </div>

      <div className="stats-grid">
        {STAT_CONFIG.map(s => (
          <div className="stat-card" key={s.key}>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{data?.[s.key] ?? 0}</div>
            </div>
            <div className="stat-icon" style={{ background: s.color }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Attendance Summary by Employee</h2>
            <p>Total present days per employee</p>
          </div>
        </div>
        <div className="table-wrap">
          {data?.employee_stats?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No employees yet</h3>
              <p>Add employees to see attendance summary</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.employee_stats?.map(e => {
                  const totalDays = (data.total_present + data.total_absent)
                    ? e.present_days  // just show raw; can't calc rate without per-emp total
                    : 0
                  return (
                    <tr key={e.id}>
                      <td><span className="emp-id-badge">{e.employee_id}</span></td>
                      <td style={{ fontWeight: 500 }}>{e.full_name}</td>
                      <td><span className="dept-badge">{e.department}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
                          {e.present_days}
                        </span>
                        <span className="text-muted text-sm"> days</span>
                      </td>
                      <td>
                        <PresentBar value={e.present_days} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function PresentBar({ value }) {
  const max = 31
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 7, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 120
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: value > 0 ? 'var(--success)' : 'var(--border)',
          borderRadius: 99,
          transition: 'width .4s ease'
        }} />
      </div>
      <span className="text-sm text-muted">{pct}%</span>
    </div>
  )
}
