import { useEffect, useState } from 'react'
import { api } from '../api.js'

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing',
  'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Other'
]

function validate(form) {
  const errors = {}
  if (!form.employee_id.trim())  errors.employee_id = 'Employee ID is required'
  if (!form.full_name.trim())    errors.full_name   = 'Full name is required'
  if (!form.department)          errors.department  = 'Department is required'
  if (!form.email.trim())        errors.email       = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                 errors.email       = 'Invalid email format'
  return errors
}

export default function Employees() {
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [alert, setAlert]           = useState(null)

  const load = () => {
    setLoading(true)
    api.getEmployees()
      .then(setEmployees)
      .catch(e => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 4000)
  }

  const handleDelete = async (emp) => {
    if (!confirm(`Delete ${emp.full_name}? This will also remove their attendance records.`)) return
    try {
      await api.deleteEmployee(emp.id)
      showAlert('success', `${emp.full_name} deleted`)
      load()
    } catch (e) {
      showAlert('error', e.message)
    }
  }

  const filtered = employees.filter(e => {
    const matchSearch = !search || [e.full_name, e.email, e.employee_id]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
    const matchDept = !deptFilter || e.department === deptFilter
    return matchSearch && matchDept
  })

  const depts = [...new Set(employees.map(e => e.department))].sort()

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <p>{employees.length} employee{employees.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'error' ? '⚠ ' : '✓ '}{alert.msg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Employee Directory</h2>
            <p>Manage all registered employees</p>
          </div>
        </div>

        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <input
              className="search-input"
              placeholder="Search by name, email or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />Loading employees…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>{employees.length === 0 ? 'No employees yet' : 'No results found'}</h3>
              <p>{employees.length === 0 ? 'Click "Add Employee" to get started' : 'Try adjusting your search or filter'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <EmployeeRow key={emp.id} emp={emp} onDelete={() => handleDelete(emp)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <AddEmployeeModal
          onClose={() => setShowModal(false)}
          onSuccess={(msg) => { showAlert('success', msg); load(); setShowModal(false) }}
          onError={(msg) => showAlert('error', msg)}
        />
      )}
    </div>
  )
}

function EmployeeRow({ emp, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [attendance, setAttendance] = useState([])
  const [attLoading, setAttLoading] = useState(false)

  const toggle = async () => {
    if (!expanded && attendance.length === 0) {
      setAttLoading(true)
      try {
        const data = await api.getAttendance(emp.id)
        setAttendance(data)
      } catch {
        setAttendance([])
      } finally {
        setAttLoading(false)
      }
    }
    setExpanded(prev => !prev)
  }

  return (
    <>
      <tr>
        <td><span className="emp-id-badge">{emp.employee_id}</span></td>
        <td style={{ fontWeight: 500 }}>{emp.full_name}</td>
        <td className="text-muted">{emp.email}</td>
        <td><span className="dept-badge">{emp.department}</span></td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={toggle}>
              {expanded ? '▲ Hide' : '▼ Records'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}>
              🗑 Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <div className="att-panel">
              {attLoading ? (
                <div className="loading-state" style={{ padding: '24px' }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                </div>
              ) : attendance.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>No attendance records for {emp.full_name}</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id}>
                        <td>{new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        })}</td>
                        <td>
                          <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function AddEmployeeModal({ onClose, onSuccess, onError }) {
  const INIT = { employee_id: '', full_name: '', email: '', department: '' }
  const [form, setForm]     = useState(INIT)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const submit = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const emp = await api.createEmployee(form)
      onSuccess(`${emp.full_name} added successfully`)
    } catch (e) {
      onError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Add New Employee</h2>
            <p>Fill in the details to register a new employee</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <Field label="Employee ID *" error={errors.employee_id}>
              <input
                placeholder="e.g. EMP-001"
                value={form.employee_id}
                onChange={e => set('employee_id', e.target.value)}
                className={errors.employee_id ? 'error' : ''}
              />
            </Field>
            <Field label="Full Name *" error={errors.full_name}>
              <input
                placeholder="e.g. Aanya Sharma"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className={errors.full_name ? 'error' : ''}
              />
            </Field>
            <Field label="Email Address *" error={errors.email} className="full">
              <input
                type="email"
                placeholder="e.g. aanya@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
            </Field>
            <Field label="Department *" error={errors.department} className="full">
              <select
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className={errors.department ? 'error' : ''}
              >
                <option value="">Select a department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : '✓ Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children, className }) {
  return (
    <div className={`form-field${className ? ` ${className}` : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
