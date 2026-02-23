import { useEffect, useState } from 'react'
import { api } from '../api.js'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function Attendance() {
  const [employees, setEmployees]     = useState([])
  const [selectedEmp, setSelectedEmp] = useState('')
  const [date, setDate]               = useState(today())
  const [status, setStatus]           = useState('Present')
  const [records, setRecords]         = useState([])
  const [dateFilter, setDateFilter]   = useState('')

  const [empLoading, setEmpLoading]     = useState(true)
  const [attLoading, setAttLoading]     = useState(false)
  const [saving, setSaving]             = useState(false)
  const [alert, setAlert]               = useState(null)

  useEffect(() => {
    api.getEmployees()
      .then(data => {
        setEmployees(data)
        if (data.length > 0) setSelectedEmp(data[0].id)
      })
      .catch(e => showAlert('error', e.message))
      .finally(() => setEmpLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedEmp) { setRecords([]); return }
    setAttLoading(true)
    api.getAttendance(selectedEmp)
      .then(setRecords)
      .catch(e => showAlert('error', e.message))
      .finally(() => setAttLoading(false))
  }, [selectedEmp])

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 4000)
  }

  const submit = async () => {
    if (!selectedEmp) { showAlert('error', 'Please select an employee'); return }
    if (!date)        { showAlert('error', 'Please select a date'); return }

    setSaving(true)
    try {
      await api.markAttendance({ employee_id: selectedEmp, date, status })
      showAlert('success', `Attendance marked as ${status}`)
      const updated = await api.getAttendance(selectedEmp)
      setRecords(updated)
    } catch (e) {
      showAlert('error', e.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = dateFilter
    ? records.filter(r => r.date === dateFilter)
    : records

  const present = records.filter(r => r.status === 'Present').length
  const absent  = records.filter(r => r.status === 'Absent').length

  const selectedEmpObj = employees.find(e => e.id === selectedEmp)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>Mark and view daily attendance records</p>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'error' ? '⚠ ' : '✓ '}{alert.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Mark Attendance Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Mark Attendance</h2>
              <p>Record today's attendance status</p>
            </div>
          </div>
          <div className="card-body">
            {empLoading ? (
              <div className="loading-state" style={{ padding: '24px 0' }}>
                <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">👥</div>
                <h3>No employees</h3>
                <p>Add employees first to mark attendance</p>
              </div>
            ) : (
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-field">
                  <label>Employee *</label>
                  <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.employee_id} – {e.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={date}
                    max={today()}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Status *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Present', 'Absent'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: 8,
                          border: `2px solid ${status === s ? (s === 'Present' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                          background: status === s ? (s === 'Present' ? 'var(--success-light)' : 'var(--danger-light)') : 'transparent',
                          color: status === s ? (s === 'Present' ? '#065f46' : '#991b1b') : 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: 13.5,
                          cursor: 'pointer',
                          transition: 'all .15s ease',
                          fontFamily: 'inherit'
                        }}
                      >
                        {s === 'Present' ? '✅' : '❌'} {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  onClick={submit}
                  disabled={saving || !selectedEmp}
                >
                  {saving ? 'Saving…' : '📋 Mark Attendance'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Records Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Attendance Records</h2>
              <p>
                {selectedEmpObj
                  ? `${selectedEmpObj.full_name} · ${present} Present / ${absent} Absent`
                  : 'Select an employee'}
              </p>
            </div>
            {records.length > 0 && (
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                style={{ fontSize: 13, padding: '6px 10px' }}
                placeholder="Filter by date"
              />
            )}
          </div>

          {dateFilter && (
            <div style={{ padding: '8px 20px 0' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')}>
                ✕ Clear date filter
              </button>
            </div>
          )}

          <div className="table-wrap">
            {attLoading ? (
              <div className="loading-state">
                <div className="spinner" />Loading records…
              </div>
            ) : !selectedEmp ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No employee selected</h3>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>{dateFilter ? 'No records for this date' : 'No attendance records'}</h3>
                <p>{!dateFilter && 'Mark attendance to see records here'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => {
                    const d = new Date(a.date + 'T00:00:00')
                    return (
                      <tr key={a.id}>
                        <td className="text-muted text-sm">{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>
                          {d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="text-muted">
                          {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                        </td>
                        <td>
                          <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {records.length > 0 && !attLoading && (
            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 20,
              fontSize: 13
            }}>
              <span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{present}</span>
                <span className="text-muted"> Present</span>
              </span>
              <span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{absent}</span>
                <span className="text-muted"> Absent</span>
              </span>
              <span>
                <span style={{ fontWeight: 700 }}>{records.length}</span>
                <span className="text-muted"> Total</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
