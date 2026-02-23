from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Date, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from datetime import date
import re
import uuid

# ── Database setup ──────────────────────────────────────────────────────────
DATABASE_URL = "sqlite:///./hrms.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# ── Models ───────────────────────────────────────────────────────────────────
class Employee(Base):
    __tablename__ = "employees"
    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id  = Column(String, unique=True, nullable=False)
    full_name    = Column(String, nullable=False)
    email        = Column(String, unique=True, nullable=False)
    department   = Column(String, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, nullable=False)   # FK to employees.id
    date        = Column(Date, nullable=False)
    status      = Column(String, nullable=False)   # "Present" | "Absent"


Base.metadata.create_all(engine)


# ── Pydantic schemas ─────────────────────────────────────────────────────────
class EmployeeCreate(BaseModel):
    employee_id: str
    full_name:   str
    email:       str
    department:  str


class EmployeeOut(BaseModel):
    id:          str
    employee_id: str
    full_name:   str
    email:       str
    department:  str

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    employee_id: str   # internal UUID
    date:        date
    status:      str   # "Present" | "Absent"


class AttendanceOut(BaseModel):
    id:          str
    employee_id: str
    date:        date
    status:      str

    class Config:
        from_attributes = True


# ── App & CORS ───────────────────────────────────────────────────────────────
app = FastAPI(title="HRMS Lite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


# ── Employee routes ──────────────────────────────────────────────────────────
@app.get("/employees", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.full_name).all()


@app.post("/employees", response_model=EmployeeOut, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    # --- Validations ---
    if not data.employee_id.strip():
        raise HTTPException(422, "Employee ID is required")
    if not data.full_name.strip():
        raise HTTPException(422, "Full name is required")
    if not data.department.strip():
        raise HTTPException(422, "Department is required")
    if not EMAIL_RE.match(data.email):
        raise HTTPException(422, "Invalid email address format")

    if db.query(Employee).filter(Employee.employee_id == data.employee_id.strip()).first():
        raise HTTPException(409, f"Employee ID '{data.employee_id}' already exists")
    if db.query(Employee).filter(Employee.email == data.email.lower().strip()).first():
        raise HTTPException(409, f"Email '{data.email}' already registered")

    emp = Employee(
        id=str(uuid.uuid4()),
        employee_id=data.employee_id.strip(),
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        department=data.department.strip(),
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@app.delete("/employees/{emp_id}", status_code=200)
def delete_employee(emp_id: str, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    db.query(Attendance).filter(Attendance.employee_id == emp_id).delete()
    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted successfully"}


# ── Attendance routes ────────────────────────────────────────────────────────
@app.post("/attendance", response_model=AttendanceOut, status_code=201)
def mark_attendance(data: AttendanceCreate, db: Session = Depends(get_db)):
    if data.status not in ("Present", "Absent"):
        raise HTTPException(422, "Status must be 'Present' or 'Absent'")

    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    existing = (
        db.query(Attendance)
        .filter(Attendance.employee_id == data.employee_id, Attendance.date == data.date)
        .first()
    )
    if existing:
        existing.status = data.status
        db.commit()
        db.refresh(existing)
        return existing

    att = Attendance(
        id=str(uuid.uuid4()),
        employee_id=data.employee_id,
        date=data.date,
        status=data.status,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@app.get("/attendance/{employee_id}", response_model=list[AttendanceOut])
def get_attendance(employee_id: str, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    return (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .all()
    )


# ── Dashboard summary ────────────────────────────────────────────────────────
@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    total_present   = db.query(Attendance).filter(Attendance.status == "Present").count()
    total_absent    = db.query(Attendance).filter(Attendance.status == "Absent").count()
    departments     = db.query(Employee.department).distinct().count()

    # Per-employee present count
    emp_stats = []
    employees = db.query(Employee).all()
    for e in employees:
        present = (
            db.query(Attendance)
            .filter(Attendance.employee_id == e.id, Attendance.status == "Present")
            .count()
        )
        emp_stats.append({
            "id": e.id,
            "employee_id": e.employee_id,
            "full_name": e.full_name,
            "department": e.department,
            "present_days": present,
        })

    return {
        "total_employees": total_employees,
        "total_present":   total_present,
        "total_absent":    total_absent,
        "departments":     departments,
        "employee_stats":  emp_stats,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
