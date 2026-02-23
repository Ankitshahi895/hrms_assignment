# HRMS Lite 🏢

A lightweight Human Resource Management System built with FastAPI and React.

## Live Demo

- **Frontend:** `<your-vercel-url>`
- **Backend:** `<your-render-url>`

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, React Router 6, Vite |
| Backend  | Python 3.11, FastAPI 0.111 |
| Database | SQLite (via SQLAlchemy) |
| Deploy   | Vercel (frontend), Render (backend) |

## Features

- **Employee Management** – Add, view, delete employees with ID, name, email, department
- **Attendance Tracking** – Mark Present/Absent per employee per day (updates if already marked)
- **Dashboard** – Summary stats: total employees, departments, present/absent counts + per-employee present days
- **Filters** – Search employees by name/email/ID, filter by department; filter attendance by date
- **Validations** – Email format, required fields, duplicate employee ID/email (client + server side)
- **UI States** – Loading spinners, empty states, error alerts, success alerts

---

## Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at: `http://localhost:5173`

> By default the frontend points to `http://localhost:8000`.  
> To use a custom backend URL, create `frontend/.env` with:
> ```
> VITE_API_URL=https://your-backend.onrender.com
> ```

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Copy the service URL

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set **root directory** to `frontend/`
3. Add environment variable: `VITE_API_URL=<your-render-url>`
4. Deploy

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | List all employees |
| POST | `/employees` | Create employee |
| DELETE | `/employees/{id}` | Delete employee + attendance |
| GET | `/attendance/{employee_id}` | Get attendance records |
| POST | `/attendance` | Mark/update attendance |
| GET | `/dashboard` | Summary stats |
| GET | `/health` | Health check |

---

## Assumptions & Limitations

- **Single admin, no auth** – As per requirements, no login is needed
- **SQLite** – Used for simplicity; swap `DATABASE_URL` in `main.py` for PostgreSQL/MySQL in production
- **CORS** – Set to `allow_origins=["*"]`; restrict to your frontend domain in production
- Attendance for the same employee + date is **updated** (not duplicated) if re-submitted
- No leave management, payroll, or multi-user support (out of scope)
