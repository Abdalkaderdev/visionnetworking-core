# VisionNetworking — Plan 1: Backend Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the FastAPI backend with PostgreSQL, JWT auth, and full CRUD for the catalog (buildings, companies, brands, items, prices), clients, and BOQ intake — everything the dashboard and AI services will build on.

**Architecture:** Single FastAPI app with SQLAlchemy ORM and Alembic migrations. Models map directly to the spec schema. Routers are one file per resource. Tests use pytest with a real test database (no mocks).

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL 15 + pgvector, python-jose (JWT), passlib (bcrypt), pytest, httpx (test client), python-multipart (file upload), boto3 (S3/MinIO), python-dotenv

---

## Project File Structure

```
visionnetworkdemo/
└── backend/
    ├── app/
    │   ├── main.py                  # FastAPI app factory, router registration
    │   ├── database.py              # SQLAlchemy engine, session, Base
    │   ├── core/
    │   │   ├── config.py            # Settings from env vars
    │   │   └── security.py          # JWT encode/decode, password hash/verify
    │   ├── models/
    │   │   ├── __init__.py          # Re-exports all models (needed for Alembic)
    │   │   ├── user.py              # User table
    │   │   ├── building.py          # Building table
    │   │   ├── company.py           # Company table
    │   │   ├── brand.py             # Brand table
    │   │   ├── item.py              # Item table (with pgvector embedding)
    │   │   ├── price.py             # Price table
    │   │   ├── client.py            # Client table
    │   │   ├── boq.py               # BOQ + BOQItem tables
    │   │   └── contact.py           # Contact form submissions
    │   ├── schemas/
    │   │   ├── auth.py              # LoginRequest, TokenResponse
    │   │   ├── user.py              # UserCreate, UserRead
    │   │   ├── building.py          # BuildingCreate, BuildingRead
    │   │   ├── company.py           # CompanyCreate, CompanyRead
    │   │   ├── brand.py             # BrandCreate, BrandRead
    │   │   ├── item.py              # ItemCreate, ItemRead
    │   │   ├── price.py             # PriceCreate, PriceRead
    │   │   ├── client.py            # ClientCreate, ClientRead
    │   │   ├── boq.py               # BOQCreate, BOQRead, BOQItemRead
    │   │   └── contact.py           # ContactCreate, ContactRead
    │   ├── routers/
    │   │   ├── auth.py              # POST /auth/login
    │   │   ├── users.py             # POST /users (create team member)
    │   │   ├── buildings.py         # CRUD /buildings
    │   │   ├── companies.py         # CRUD /companies
    │   │   ├── brands.py            # CRUD /brands
    │   │   ├── items.py             # CRUD /items
    │   │   ├── prices.py            # CRUD /prices
    │   │   ├── clients.py           # CRUD /clients
    │   │   ├── boqs.py              # CRUD /boqs + file upload
    │   │   └── contacts.py          # POST /contacts (public form)
    │   └── services/
    │       └── storage.py           # Upload file to S3/MinIO, return URL
    ├── tests/
    │   ├── conftest.py              # Test DB setup, fixtures, auth headers
    │   ├── test_auth.py
    │   ├── test_buildings.py
    │   ├── test_companies.py
    │   ├── test_brands.py
    │   ├── test_items.py
    │   ├── test_clients.py
    │   └── test_boqs.py
    ├── alembic/
    │   ├── env.py
    │   └── versions/                # Migration files (auto-generated)
    ├── alembic.ini
    ├── requirements.txt
    ├── .env.example
    └── Dockerfile
```

---

## Task 1: Project Setup & Dependencies

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/core/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: Create the backend directory and requirements**

```
cd visionnetworkdemo
mkdir -p backend/app/core backend/app/models backend/app/schemas backend/app/routers backend/app/services backend/tests backend/alembic/versions
```

Create `backend/requirements.txt`:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pgvector==0.3.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6
boto3==1.34.102
reportlab==4.2.0
```

- [ ] **Step 2: Create .env.example**

Create `backend/.env.example`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/visionnetworking
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/visionnetworking_test
SECRET_KEY=change-me-to-a-long-random-string-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_BOQ=boq-uploads
S3_BUCKET_QUOTATIONS=quotation-pdfs
S3_BUCKET_PROPOSALS=proposal-pdfs
S3_BUCKET_ASSETS=brand-assets
```

Copy to `.env` and fill in real values before running.

- [ ] **Step 3: Create config.py**

Create `backend/app/core/config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    test_database_url: str = ""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    s3_endpoint_url: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_boq: str = "boq-uploads"
    s3_bucket_quotations: str = "quotation-pdfs"
    s3_bucket_proposals: str = "proposal-pdfs"
    s3_bucket_assets: str = "brand-assets"

    class Config:
        env_file = ".env"

settings = Settings()
```

> Note: Add `pydantic-settings==2.2.1` to requirements.txt.

- [ ] **Step 4: Create database.py**

Create `backend/app/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: Install dependencies and verify**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "import fastapi; print('FastAPI OK')"
```

Expected: `FastAPI OK`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: backend project setup, config, database connection"
```

---

## Task 2: Security (JWT + Password Hashing)

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/tests/test_auth.py` (partial — completed in Task 4)

- [ ] **Step 1: Create security.py**

Create `backend/app/core/security.py`:
```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload["exp"] = expire
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
```

- [ ] **Step 2: Write tests for security functions**

Create `backend/tests/test_security.py`:
```python
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hash_and_verify():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)

def test_create_and_decode_token():
    token = create_access_token({"sub": "user@example.com"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"

def test_invalid_token_returns_none():
    assert decode_access_token("not-a-real-token") is None
```

- [ ] **Step 3: Run tests**

```bash
cd backend
pytest tests/test_security.py -v
```

Expected: 3 passed

- [ ] **Step 4: Commit**

```bash
git add app/core/security.py tests/test_security.py
git commit -m "feat: JWT token creation/decoding, password hashing"
```

---

## Task 3: Database Models

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/building.py`
- Create: `backend/app/models/company.py`
- Create: `backend/app/models/brand.py`
- Create: `backend/app/models/item.py`
- Create: `backend/app/models/price.py`
- Create: `backend/app/models/client.py`
- Create: `backend/app/models/boq.py`
- Create: `backend/app/models/contact.py`
- Create: `backend/app/models/__init__.py`

- [ ] **Step 1: Create user model**

Create `backend/app/models/user.py`:
```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="staff")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 2: Create catalog models**

Create `backend/app/models/building.py`:
```python
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, default="")
    companies = relationship("Company", back_populates="building", cascade="all, delete-orphan")
```

Create `backend/app/models/company.py`:
```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    building = relationship("Building", back_populates="companies")
    brands = relationship("Brand", back_populates="company", cascade="all, delete-orphan")
```

Create `backend/app/models/brand.py`:
```python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="")
    logo_url = Column(String, default="")
    company = relationship("Company", back_populates="brands")
    items = relationship("Item", back_populates="brand", cascade="all, delete-orphan")
```

- [ ] **Step 3: Create item and price models**

Create `backend/app/models/item.py`:
```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    name = Column(String, nullable=False)
    sku = Column(String, default="")
    unit = Column(String, default="")
    description = Column(Text, default="")
    embedding = Column(Vector(1536), nullable=True)
    brand = relationship("Brand", back_populates="items")
    prices = relationship("Price", back_populates="item", cascade="all, delete-orphan")
```

Create `backend/app/models/price.py`:
```python
from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    effective_date = Column(Date, server_default=func.current_date())
    item = relationship("Item", back_populates="prices")
```

- [ ] **Step 4: Create client, BOQ, and contact models**

Create `backend/app/models/client.py`:
```python
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    city = Column(String, default="")
    notes = Column(Text, default="")
    boqs = relationship("BOQ", back_populates="client")
```

Create `backend/app/models/boq.py`:
```python
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class BOQ(Base):
    __tablename__ = "boqs"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    status = Column(String, default="draft")  # draft|processing|pending|approved|rejected|connected
    file_url = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    client = relationship("Client", back_populates="boqs")
    items = relationship("BOQItem", back_populates="boq", cascade="all, delete-orphan")

class BOQItem(Base):
    __tablename__ = "boq_items"
    id = Column(Integer, primary_key=True, index=True)
    boq_id = Column(Integer, ForeignKey("boqs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)  # null if not matched yet
    raw_name = Column(String, nullable=False)
    quantity = Column(Float, default=1)
    unit = Column(String, default="")
    matched = Column(Boolean, default=False)
    boq = relationship("BOQ", back_populates="items")
```

Create `backend/app/models/contact.py`:
```python
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    message = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 5: Create models __init__.py**

Create `backend/app/models/__init__.py`:
```python
from app.models.user import User
from app.models.building import Building
from app.models.company import Company
from app.models.brand import Brand
from app.models.item import Item
from app.models.price import Price
from app.models.client import Client
from app.models.boq import BOQ, BOQItem
from app.models.contact import Contact
```

- [ ] **Step 6: Commit**

```bash
git add app/models/
git commit -m "feat: all SQLAlchemy models (catalog, clients, BOQ, contacts)"
```

---

## Task 4: Alembic Migrations

**Files:**
- Create: `backend/alembic.ini`
- Modify: `backend/alembic/env.py`

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

- [ ] **Step 2: Configure alembic/env.py**

Edit `backend/alembic/env.py`. Replace the `target_metadata` and `run_migrations_online` sections:
```python
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.database import Base
from app.models import *  # noqa: F401 — ensures all models are registered
from app.core.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.config_ini_section, prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Enable pgvector in PostgreSQL and generate migration**

First enable pgvector in your PostgreSQL DB:
```sql
-- Run in psql or your DB client:
CREATE EXTENSION IF NOT EXISTS vector;
```

Then generate the initial migration:
```bash
cd backend
alembic revision --autogenerate -m "initial schema"
```

Expected: Creates a file in `alembic/versions/` with all table definitions.

- [ ] **Step 4: Apply migration**

```bash
alembic upgrade head
```

Expected: All tables created in the database. No errors.

- [ ] **Step 5: Verify tables exist**

```bash
psql -U postgres -d visionnetworking -c "\dt"
```

Expected: Lists `buildings`, `companies`, `brands`, `items`, `prices`, `clients`, `boqs`, `boq_items`, `contacts`, `users`.

- [ ] **Step 6: Commit**

```bash
git add alembic/ alembic.ini
git commit -m "feat: alembic migrations, initial schema with pgvector"
```

---

## Task 5: FastAPI App + Auth Router

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/app/routers/users.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Create schemas**

Create `backend/app/schemas/auth.py`:
```python
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

Create `backend/app/schemas/user.py`:
```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create auth router**

Create `backend/app/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.email, "user_id": user.id})
    return TokenResponse(access_token=token)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 3: Create users router**

Create `backend/app/routers/users.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.core.security import hash_password
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=UserRead, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
```

- [ ] **Step 4: Create main.py**

Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users

app = FastAPI(title="VisionNetworking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Create test conftest.py**

Create `backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings

TEST_DB_URL = settings.test_database_url or settings.database_url.replace("/visionnetworking", "/visionnetworking_test")

engine = create_engine(TEST_DB_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client, db):
    user = User(name="Test User", email="test@vision.iq", password_hash=hash_password("testpass"))
    db.add(user)
    db.commit()
    resp = client.post("/auth/login", json={"email": "test@vision.iq", "password": "testpass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 6: Write auth tests**

Create `backend/tests/test_auth.py`:
```python
from app.models.user import User
from app.core.security import hash_password

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

def test_login_success(client, db):
    user = User(name="Staff", email="staff@vision.iq", password_hash=hash_password("pass123"))
    db.add(user)
    db.commit()
    resp = client.post("/auth/login", json={"email": "staff@vision.iq", "password": "pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password(client, db):
    user = User(name="Staff2", email="staff2@vision.iq", password_hash=hash_password("correct"))
    db.add(user)
    db.commit()
    resp = client.post("/auth/login", json={"email": "staff2@vision.iq", "password": "wrong"})
    assert resp.status_code == 401

def test_login_unknown_user(client):
    resp = client.post("/auth/login", json={"email": "nobody@vision.iq", "password": "x"})
    assert resp.status_code == 401
```

- [ ] **Step 7: Run tests**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: 4 passed

- [ ] **Step 8: Commit**

```bash
git add app/main.py app/schemas/auth.py app/schemas/user.py app/routers/auth.py app/routers/users.py tests/conftest.py tests/test_auth.py
git commit -m "feat: FastAPI app, JWT auth login endpoint, user creation"
```

---

## Task 6: Catalog CRUD (Buildings, Companies, Brands)

**Files:**
- Create: `backend/app/schemas/building.py`
- Create: `backend/app/schemas/company.py`
- Create: `backend/app/schemas/brand.py`
- Create: `backend/app/routers/buildings.py`
- Create: `backend/app/routers/companies.py`
- Create: `backend/app/routers/brands.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_buildings.py`

- [ ] **Step 1: Create schemas**

Create `backend/app/schemas/building.py`:
```python
from pydantic import BaseModel

class BuildingCreate(BaseModel):
    name: str
    location: str
    description: str = ""

class BuildingRead(BaseModel):
    id: int
    name: str
    location: str
    description: str
    model_config = {"from_attributes": True}
```

Create `backend/app/schemas/company.py`:
```python
from pydantic import BaseModel

class CompanyCreate(BaseModel):
    building_id: int
    name: str
    description: str = ""

class CompanyRead(BaseModel):
    id: int
    building_id: int
    name: str
    description: str
    model_config = {"from_attributes": True}
```

Create `backend/app/schemas/brand.py`:
```python
from pydantic import BaseModel

class BrandCreate(BaseModel):
    company_id: int
    name: str
    category: str = ""
    logo_url: str = ""

class BrandRead(BaseModel):
    id: int
    company_id: int
    name: str
    category: str
    logo_url: str
    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create buildings router**

Create `backend/app/routers/buildings.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.building import Building
from app.models.user import User
from app.schemas.building import BuildingCreate, BuildingRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/buildings", tags=["buildings"])

@router.get("", response_model=list[BuildingRead])
def list_buildings(db: Session = Depends(get_db)):
    return db.query(Building).all()

@router.get("/{building_id}", response_model=BuildingRead)
def get_building(building_id: int, db: Session = Depends(get_db)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    return b

@router.post("", response_model=BuildingRead, status_code=201)
def create_building(body: BuildingCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = Building(**body.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.put("/{building_id}", response_model=BuildingRead)
def update_building(building_id: int, body: BuildingCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b

@router.delete("/{building_id}", status_code=204)
def delete_building(building_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    db.delete(b)
    db.commit()
```

- [ ] **Step 3: Create companies and brands routers**

Create `backend/app/routers/companies.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=list[CompanyRead])
def list_companies(building_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Company)
    if building_id:
        q = q.filter(Company.building_id == building_id)
    return q.all()

@router.get("/{company_id}", response_model=CompanyRead)
def get_company(company_id: int, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return c

@router.post("", response_model=CompanyRead, status_code=201)
def create_company(body: CompanyCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = Company(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.put("/{company_id}", response_model=CompanyRead)
def update_company(company_id: int, body: CompanyCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
```

Create `backend/app/routers/brands.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.brand import Brand
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/brands", tags=["brands"])

@router.get("", response_model=list[BrandRead])
def list_brands(company_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Brand)
    if company_id:
        q = q.filter(Brand.company_id == company_id)
    return q.all()

@router.get("/{brand_id}", response_model=BrandRead)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    return b

@router.post("", response_model=BrandRead, status_code=201)
def create_brand(body: BrandCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = Brand(**body.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.put("/{brand_id}", response_model=BrandRead)
def update_brand(brand_id: int, body: BrandCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b

@router.delete("/{brand_id}", status_code=204)
def delete_brand(brand_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(b)
    db.commit()
```

- [ ] **Step 4: Register routers in main.py**

Edit `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, buildings, companies, brands

app = FastAPI(title="VisionNetworking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, users.router, buildings.router, companies.router, brands.router]:
    app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Write buildings tests**

Create `backend/tests/test_buildings.py`:
```python
def test_list_buildings_empty(client):
    resp = client.get("/buildings")
    assert resp.status_code == 200
    assert resp.json() == []

def test_create_building_requires_auth(client):
    resp = client.post("/buildings", json={"name": "B1", "location": "Baghdad"})
    assert resp.status_code == 401

def test_create_and_get_building(client, auth_headers):
    resp = client.post("/buildings", json={"name": "Building 01", "location": "Baghdad", "description": "Main"}, headers=auth_headers)
    assert resp.status_code == 201
    building_id = resp.json()["id"]

    resp = client.get(f"/buildings/{building_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Building 01"

def test_update_building(client, auth_headers):
    resp = client.post("/buildings", json={"name": "Old Name", "location": "Basra"}, headers=auth_headers)
    bid = resp.json()["id"]
    resp = client.put(f"/buildings/{bid}", json={"name": "New Name", "location": "Basra"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"

def test_delete_building(client, auth_headers):
    resp = client.post("/buildings", json={"name": "To Delete", "location": "Mosul"}, headers=auth_headers)
    bid = resp.json()["id"]
    resp = client.delete(f"/buildings/{bid}", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get(f"/buildings/{bid}")
    assert resp.status_code == 404
```

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_buildings.py -v
```

Expected: 5 passed

- [ ] **Step 7: Commit**

```bash
git add app/schemas/ app/routers/buildings.py app/routers/companies.py app/routers/brands.py app/main.py tests/test_buildings.py
git commit -m "feat: buildings, companies, brands CRUD endpoints"
```

---

## Task 7: Items & Prices CRUD

**Files:**
- Create: `backend/app/schemas/item.py`
- Create: `backend/app/schemas/price.py`
- Create: `backend/app/routers/items.py`
- Create: `backend/app/routers/prices.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_items.py`

- [ ] **Step 1: Create schemas**

Create `backend/app/schemas/item.py`:
```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    brand_id: int
    name: str
    sku: str = ""
    unit: str = ""
    description: str = ""

class ItemRead(BaseModel):
    id: int
    brand_id: int
    name: str
    sku: str
    unit: str
    description: str
    model_config = {"from_attributes": True}
```

Create `backend/app/schemas/price.py`:
```python
from pydantic import BaseModel
from datetime import date

class PriceCreate(BaseModel):
    item_id: int
    price: float
    currency: str = "USD"
    effective_date: date | None = None

class PriceRead(BaseModel):
    id: int
    item_id: int
    price: float
    currency: str
    effective_date: date | None
    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create items router**

Create `backend/app/routers/items.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemCreate, ItemRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/items", tags=["items"])

@router.get("", response_model=list[ItemRead])
def list_items(brand_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Item)
    if brand_id:
        q = q.filter(Item.brand_id == brand_id)
    return q.all()

@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("", response_model=ItemRead, status_code=201)
def create_item(body: ItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = Item(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, body: ItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in body.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
```

- [ ] **Step 3: Create prices router**

Create `backend/app/routers/prices.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.price import Price
from app.models.user import User
from app.schemas.price import PriceCreate, PriceRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/prices", tags=["prices"])

@router.get("", response_model=list[PriceRead])
def list_prices(item_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Price)
    if item_id:
        q = q.filter(Price.item_id == item_id)
    return q.all()

@router.post("", response_model=PriceRead, status_code=201)
def create_price(body: PriceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    price = Price(**body.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    return price

@router.delete("/{price_id}", status_code=204)
def delete_price(price_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    price = db.query(Price).filter(Price.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
    db.delete(price)
    db.commit()
```

- [ ] **Step 4: Register routers in main.py**

Edit `backend/app/main.py` — add `items` and `prices` to imports and the router list:
```python
from app.routers import auth, users, buildings, companies, brands, items, prices

# in the loop:
for router in [auth.router, users.router, buildings.router, companies.router,
               brands.router, items.router, prices.router]:
    app.include_router(router)
```

- [ ] **Step 5: Write items tests**

Create `backend/tests/test_items.py`:
```python
import pytest

@pytest.fixture
def brand_id(client, auth_headers):
    b = client.post("/buildings", json={"name": "B", "location": "Baghdad"}, headers=auth_headers).json()
    c = client.post("/companies", json={"building_id": b["id"], "name": "Co"}, headers=auth_headers).json()
    br = client.post("/brands", json={"company_id": c["id"], "name": "Brand A", "category": "Electrical"}, headers=auth_headers).json()
    return br["id"]

def test_create_and_list_item(client, auth_headers, brand_id):
    resp = client.post("/items", json={"brand_id": brand_id, "name": "Valve 3/4", "unit": "pcs"}, headers=auth_headers)
    assert resp.status_code == 201
    item_id = resp.json()["id"]

    resp = client.get(f"/items?brand_id={brand_id}")
    assert resp.status_code == 200
    assert any(i["id"] == item_id for i in resp.json())

def test_add_price_to_item(client, auth_headers, brand_id):
    item = client.post("/items", json={"brand_id": brand_id, "name": "Cable 4mm"}, headers=auth_headers).json()
    resp = client.post("/prices", json={"item_id": item["id"], "price": 3.50, "currency": "USD"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["price"] == 3.50
```

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_items.py -v
```

Expected: 2 passed

- [ ] **Step 7: Commit**

```bash
git add app/schemas/item.py app/schemas/price.py app/routers/items.py app/routers/prices.py app/main.py tests/test_items.py
git commit -m "feat: items and prices CRUD endpoints"
```

---

## Task 8: Clients & BOQ Intake

**Files:**
- Create: `backend/app/schemas/client.py`
- Create: `backend/app/schemas/boq.py`
- Create: `backend/app/schemas/contact.py`
- Create: `backend/app/routers/clients.py`
- Create: `backend/app/routers/boqs.py`
- Create: `backend/app/routers/contacts.py`
- Create: `backend/app/services/storage.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_boqs.py`

- [ ] **Step 1: Create schemas**

Create `backend/app/schemas/client.py`:
```python
from pydantic import BaseModel

class ClientCreate(BaseModel):
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    city: str = ""
    notes: str = ""

class ClientRead(BaseModel):
    id: int
    name: str
    company: str
    phone: str
    email: str
    city: str
    notes: str
    model_config = {"from_attributes": True}
```

Create `backend/app/schemas/boq.py`:
```python
from pydantic import BaseModel
from datetime import datetime

class BOQCreate(BaseModel):
    client_id: int
    notes: str = ""

class BOQItemRead(BaseModel):
    id: int
    boq_id: int
    item_id: int | None
    raw_name: str
    quantity: float
    unit: str
    matched: bool
    model_config = {"from_attributes": True}

class BOQRead(BaseModel):
    id: int
    client_id: int
    status: str
    file_url: str
    notes: str
    created_at: datetime
    items: list[BOQItemRead] = []
    model_config = {"from_attributes": True}

class BOQStatusUpdate(BaseModel):
    status: str
```

Create `backend/app/schemas/contact.py`:
```python
from pydantic import BaseModel
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    message: str = ""

class ContactRead(BaseModel):
    id: int
    name: str
    company: str
    phone: str
    email: str
    message: str
    created_at: datetime
    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create storage service**

Create `backend/app/services/storage.py`:
```python
import boto3
import uuid
from app.core.config import settings

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url or None,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )

def upload_file(file_bytes: bytes, filename: str, bucket: str) -> str:
    s3 = get_s3_client()
    key = f"{uuid.uuid4()}/{filename}"
    s3.put_object(Bucket=bucket, Key=key, Body=file_bytes)
    endpoint = settings.s3_endpoint_url or "https://s3.amazonaws.com"
    return f"{endpoint}/{bucket}/{key}"
```

- [ ] **Step 3: Create clients router**

Create `backend/app/routers/clients.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("", response_model=list[ClientRead])
def list_clients(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Client).all()

@router.get("/{client_id}", response_model=ClientRead)
def get_client(client_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c

@router.post("", response_model=ClientRead, status_code=201)
def create_client(body: ClientCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = Client(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.put("/{client_id}", response_model=ClientRead)
def update_client(client_id: int, body: ClientCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c
```

- [ ] **Step 4: Create BOQs router**

Create `backend/app/routers/boqs.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.boq import BOQ
from app.models.user import User
from app.schemas.boq import BOQCreate, BOQRead, BOQStatusUpdate
from app.routers.auth import get_current_user
from app.services.storage import upload_file
from app.core.config import settings

router = APIRouter(prefix="/boqs", tags=["boqs"])

VALID_STATUSES = {"draft", "processing", "pending", "approved", "rejected", "connected"}

@router.get("", response_model=list[BOQRead])
def list_boqs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(BOQ).order_by(BOQ.created_at.desc()).all()

@router.get("/{boq_id}", response_model=BOQRead)
def get_boq(boq_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    return boq

@router.post("", response_model=BOQRead, status_code=201)
def create_boq(body: BOQCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = BOQ(**body.model_dump())
    db.add(boq)
    db.commit()
    db.refresh(boq)
    return boq

@router.post("/{boq_id}/upload", response_model=BOQRead)
def upload_boq_file(boq_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    contents = file.file.read()
    url = upload_file(contents, file.filename, settings.s3_bucket_boq)
    boq.file_url = url
    db.commit()
    db.refresh(boq)
    return boq

@router.patch("/{boq_id}/status", response_model=BOQRead)
def update_boq_status(boq_id: int, body: BOQStatusUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    boq.status = body.status
    db.commit()
    db.refresh(boq)
    return boq
```

- [ ] **Step 5: Create contacts router**

Create `backend/app/routers/contacts.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contact import Contact
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.post("", response_model=ContactRead, status_code=201)
def submit_contact(body: ContactCreate, db: Session = Depends(get_db)):
    contact = Contact(**body.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("", response_model=list[ContactRead])
def list_contacts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Contact).order_by(Contact.created_at.desc()).all()
```

- [ ] **Step 6: Register all routers in main.py**

Edit `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, buildings, companies, brands, items, prices, clients, boqs, contacts

app = FastAPI(title="VisionNetworking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth.router, users.router, buildings.router, companies.router,
    brands.router, items.router, prices.router,
    clients.router, boqs.router, contacts.router,
]:
    app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Write BOQ tests**

Create `backend/tests/test_boqs.py`:
```python
import pytest

@pytest.fixture
def client_id(client, auth_headers):
    resp = client.post("/clients", json={"name": "Al-Rashid Co.", "city": "Baghdad"}, headers=auth_headers)
    return resp.json()["id"]

def test_create_boq(client, auth_headers, client_id):
    resp = client.post("/boqs", json={"client_id": client_id, "notes": "First BOQ"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["status"] == "draft"
    assert resp.json()["client_id"] == client_id

def test_update_boq_status(client, auth_headers, client_id):
    boq = client.post("/boqs", json={"client_id": client_id}, headers=auth_headers).json()
    resp = client.patch(f"/boqs/{boq['id']}/status", json={"status": "processing"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "processing"

def test_invalid_status_rejected(client, auth_headers, client_id):
    boq = client.post("/boqs", json={"client_id": client_id}, headers=auth_headers).json()
    resp = client.patch(f"/boqs/{boq['id']}/status", json={"status": "flying"}, headers=auth_headers)
    assert resp.status_code == 400

def test_contact_form_no_auth(client):
    resp = client.post("/contacts", json={"name": "Ahmad", "email": "a@b.com", "message": "Need quote"})
    assert resp.status_code == 201

def test_list_contacts_requires_auth(client):
    resp = client.get("/contacts")
    assert resp.status_code == 401
```

- [ ] **Step 8: Run all tests**

```bash
pytest tests/ -v
```

Expected: All tests pass (17+ tests)

- [ ] **Step 9: Commit**

```bash
git add app/schemas/client.py app/schemas/boq.py app/schemas/contact.py \
        app/routers/clients.py app/routers/boqs.py app/routers/contacts.py \
        app/services/storage.py app/main.py tests/test_boqs.py
git commit -m "feat: clients, BOQ intake, contacts endpoints + file upload to S3"
```

---

## Task 9: Run Server & Smoke Test

**Files:** None created — verification only.

- [ ] **Step 1: Start the server**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Expected: Server starts, no import errors.

- [ ] **Step 2: Open interactive API docs**

Visit: `http://localhost:8000/docs`

Verify all route groups appear: auth, users, buildings, companies, brands, items, prices, clients, boqs, contacts.

- [ ] **Step 3: Create first admin user via psql**

Since user creation requires auth, seed the first user directly:
```bash
python -c "
from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password
db = SessionLocal()
u = User(name='Admin', email='admin@visionnetworking.iq', password_hash=hash_password('changeme123'))
db.add(u)
db.commit()
print('Admin user created')
"
```

- [ ] **Step 4: Test login via docs**

In the Swagger UI at `http://localhost:8000/docs`, use `POST /auth/login` with:
```json
{"email": "admin@visionnetworking.iq", "password": "changeme123"}
```

Expected: Returns `access_token`.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: Plan 1 complete — backend foundation running"
```

---

## Self-Review Checklist

- [x] Auth (JWT login, protected routes) — Task 5
- [x] Buildings CRUD — Task 6
- [x] Companies CRUD — Task 6
- [x] Brands CRUD — Task 6
- [x] Items CRUD — Task 7
- [x] Prices CRUD — Task 7
- [x] Clients CRUD — Task 8
- [x] BOQ intake + file upload — Task 8
- [x] BOQ status transitions — Task 8
- [x] Contact form (public) — Task 8
- [x] pgvector extension on items table — Task 3 + 4
- [x] Database migrations — Task 4
- [x] Tests for all routers — Tasks 5–8
- [x] S3/MinIO file storage service — Task 8

**Out of scope for Plan 1 (covered in later plans):**
- Quotation generation → Plan 2
- AI parsing / CV scanner / smart matcher → Plan 3
- Public marketing site → Plan 4
- Internal dashboard → Plan 5
