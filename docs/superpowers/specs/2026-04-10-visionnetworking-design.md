# VisionNetworking — System Design Spec
**Date:** 2026-04-10  
**Status:** Approved

---

## Overview

VisionNetworking is an Iraq-based B2B & B2C professional networking platform. It manages 38 buildings, each housing one or more companies with 3+ brands. The core business is connecting clients across Iraq with the right suppliers by turning client BOQs (Bills of Quantities) into accurate quotations — powered by AI — then formally connecting the client with the matched company/brand.

The system has two distinct layers:
1. **Public marketing website** — brand presence, buildings/brands showcase, contact
2. **Internal backend system** — BOQ management, quotation engine, AI services, catalog management (team-only, no client or company self-service portal in this phase)

---

## Architecture — Approach B: Separate Frontend + Backend

### Components

| Component | Technology | Purpose |
|---|---|---|
| Public Marketing Site | Next.js (React) | Client-facing brand & discovery site |
| Internal Dashboard | React + Vite | Team-only operations portal |
| Backend API | FastAPI (Python) | Serves both frontends via REST |
| AI/CV Services | Python microservices | Document parsing, vision, smart matching |
| Database | PostgreSQL | All structured data |
| File Storage | S3 / MinIO | Uploads, generated PDFs, brand assets |

### Deployment
- Marketing site: Vercel or VPS
- Dashboard + API + AI services: VPS (single server or Docker Compose)
- Database: PostgreSQL on same VPS or managed (e.g. Supabase)
- File storage: MinIO (self-hosted) or AWS S3

---

## Public Marketing Site (Next.js)

### Pages & Sections

**Multi-page Next.js site with the following sections:**

1. **Navigation** — Logo, About, Buildings, Services, Success Stories, Contact CTA
2. **Hero** — Headline ("38 Buildings. 100+ Brands. One Network."), subtext, two CTAs: "Request a Quote" and "Explore Buildings"
3. **Stats Bar** — 38 Buildings · 100+ Brands · All Iraq · AI-Powered
4. **About** — Company pitch: what VisionNetworking does, how it connects clients to suppliers
5. **How It Works** — 4-step visual flow: Submit BOQ → AI Processing → Get Quotation → Connect
6. **Buildings & Brands Directory** — Grid of all 38 buildings, each showing company name and brand count. Clickable to expand/detail page.
7. **Success Stories** — Client testimonial cards
8. **Contact Form** — Name, Company, Phone/Email, Message/BOQ description. Submissions stored in the backend and surfaced in the dashboard.

### Notes
- Arabic + English language support (RTL-aware layout)
- Mobile responsive
- No authentication required on public site

---

## Internal Dashboard (React + Vite)

### Access
- Team-only, login protected (JWT auth)
- Single role for now: VisionNetworking staff

### Sidebar Modules

**Main**
- Dashboard — overview stats, recent BOQs, AI activity feed
- BOQ Manager — all BOQs, upload, parse, manage
- Quotations — generate, review, edit, export PDF
- Proposals — final proposal documents with branding

**Catalog**
- Companies — manage companies per building
- Brands — manage brands per company
- Items & Prices — item catalog per brand, bulk import via Excel

**Clients**
- Clients — client records (name, company, phone, city, notes)
- Contacts — contact form submissions from the public site

**AI Tools**
- BOQ Parser — manually trigger document parsing on uploaded BOQ
- Item Scanner — upload a product photo, get matched catalog item
- Smart Match — run matching engine on a BOQ to get ranked brand recommendations

### Dashboard Home
- Stat cards: Active BOQs, Pending Quotations, Approved This Month, Total Clients
- Recent BOQs table with status tags (Draft / Processing / Pending / Approved)
- AI activity feed (latest parser runs, scans, matches)

---

## Core Workflow — BOQ to Quotation (5 Steps)

### Step 1 — BOQ Intake
Team receives BOQ from client (walk-in, WhatsApp, email, or public contact form). Supported intake formats:
- PDF upload
- Excel upload
- Photo / image upload
- Manual item entry

### Step 2 — AI Processing
Three services run on the BOQ:
- **Document Parser**: OCR (Tesseract / AWS Textract) + LLM (Claude API) → extracts `{item_name, quantity, unit, specs}` from the file
- **CV Item Scanner**: Vision model (Claude Vision / YOLO) → identifies products from photos, maps to catalog items
- **Smart Matcher**: Vector similarity search against brand catalog embeddings → returns ranked list of `{building, company, brand, matched_items, coverage_%}`

### Step 3 — Quotation Generation
System auto-generates a quotation table from matched items and catalog prices. Team reviews, adjusts line items if needed, then finalizes. Actions: Review & Approve, Edit Items, Export PDF.

### Step 4 — Client Approval
Team shares quotation PDF with client (external to system). Client responds with approval or revision request. Team updates status in dashboard. If revision requested, returns to Step 3.

### Step 5 — Connect & Close
On approval:
- Generate final branded proposal document (PDF)
- Mark deal as "Connected" in system
- Archive deal with full history (BOQ, quotation, proposal)

---

## AI / CV Services

### BOQ Document Parser
- **Input**: PDF, Excel, or image file
- **Process**: OCR layer extracts raw text → Claude API normalizes and structures into item list
- **Output**: JSON array of `{item_name, quantity, unit, specs}`
- **Fallback**: Items that cannot be parsed are flagged for manual review

### CV Item Scanner
- **Input**: Product photo (JPG/PNG)
- **Process**: Vision model identifies item type → vector similarity against item catalog embeddings
- **Output**: `{matched_item_id, item_name, confidence_score, catalog_price}`
- **Threshold**: Matches below 70% confidence flagged for manual confirmation

### Smart Company/Brand Matcher
- **Input**: Parsed BOQ item list
- **Process**: Each item is embedded → cosine similarity against brand catalog embeddings → brands scored by coverage percentage and price competitiveness
- **Output**: Ranked list of `{building, company, brand, matched_items[], coverage_pct, estimated_total}`

---

## Database Schema (PostgreSQL)

### Catalog Hierarchy
```
buildings (id, name, location, description)
  └── companies (id, building_id, name, description)
        └── brands (id, company_id, name, category, logo_url)
              └── items (id, brand_id, name, sku, unit, description, embedding vector)
                    └── prices (id, item_id, price, currency, effective_date)
```

### Client & BOQ Flow
```
clients (id, name, company, phone, email, city, notes)
  └── boqs (id, client_id, status, file_url, created_at, notes)
        ├── boq_items (id, boq_id, item_id, raw_name, quantity, unit, matched bool)
        └── quotations (id, boq_id, status, total, pdf_url, created_at)
              └── quotation_lines (id, quotation_id, item_id, brand_id, qty, unit_price, total)
                    └── proposals (id, quotation_id, client_id, status, pdf_url, signed_at)
```

### System
```
users (id, name, email, password_hash, role, created_at)
contacts (id, name, company, phone, email, message, created_at)  -- from public contact form
```

### Notes
- `items.embedding` uses pgvector extension for similarity search
- BOQ status enum: `draft | processing | pending | approved | rejected | connected`
- Quotation status enum: `draft | sent | approved | rejected`
- Proposal status enum: `draft | sent | signed | archived`

---

## File Storage

| Bucket | Contents |
|---|---|
| `boq-uploads` | Raw BOQ files (PDF, Excel, images) uploaded by team |
| `quotation-pdfs` | Auto-generated quotation documents |
| `proposal-pdfs` | Final branded proposal documents |
| `brand-assets` | Company logos, product photos |

---

## Backend API (FastAPI)

### Key Route Groups
- `POST /auth/login` — JWT login for team
- `GET/POST /boqs` — BOQ CRUD
- `POST /boqs/{id}/parse` — trigger AI document parser
- `POST /boqs/{id}/match` — trigger smart matcher
- `POST /boqs/{id}/quotation` — generate quotation from BOQ
- `GET/PUT /quotations/{id}` — review and edit quotation
- `POST /quotations/{id}/export` — export quotation as PDF
- `POST /items/scan` — CV item scanner (photo upload)
- `GET/POST /buildings`, `/companies`, `/brands`, `/items`, `/prices` — catalog CRUD
- `GET/POST /clients` — client management
- `POST /contacts` — public contact form submission

---

## Out of Scope (This Phase)
- Client self-service portal (clients cannot log in)
- Company/brand manager portal (companies cannot log in)
- Online payment processing
- Mobile app
- Multi-language CMS (content hardcoded or in DB)
