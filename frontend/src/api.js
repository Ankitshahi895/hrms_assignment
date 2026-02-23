const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.map(e => e.msg).join(', ') : msg);
  }
  return data;
}

export const api = {
  // Employees
  getEmployees:   ()           => request('GET',    '/employees'),
  createEmployee: (data)       => request('POST',   '/employees', data),
  deleteEmployee: (id)         => request('DELETE', `/employees/${id}`),

  // Attendance
  getAttendance:  (empId)      => request('GET',    `/attendance/${empId}`),
  markAttendance: (data)       => request('POST',   '/attendance', data),

  // Dashboard
  getDashboard:   ()           => request('GET',    '/dashboard'),
};
