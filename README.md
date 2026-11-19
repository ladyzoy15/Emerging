# ReceiptAI – AI Receipt Scanner & Expense Tracker

A professional web application for business owners, accountants, and freelancers to automate receipt management and expense tracking using OCR technology.

![ReceiptAI](https://img.shields.io/badge/ReceiptAI-v1.0.0-1B2A4A?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

## Features

- **Receipt Upload & OCR Processing** – Upload receipt images (JPG, PNG, PDF) and extract data automatically using Tesseract OCR
- **AI-Assisted Categorization** – Automatic expense categorization based on merchant and receipt content
- **Expense Management** – Full CRUD operations with search, filter, sort, and pagination
- **Dashboard Analytics** – Monthly expense summaries, category breakdowns, and recent transactions
- **Tax Summary Reports** – VAT tracking with VATable, VAT-Exempt, and Non-VAT sales breakdown
- **Excel Export** – Export expense records and tax summaries to professionally formatted XLSX files
- **Secure Authentication** – JWT-based auth with bcrypt password hashing
- **Responsive Design** – Works on desktop, tablet, and mobile devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Lucide Icons, Axios |
| Backend | Python Flask, SQLAlchemy ORM, PyJWT |
| Database | MySQL 8.0 |
| OCR | Tesseract OCR (pytesseract) |
| Export | openpyxl |
| DevOps | Docker, Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   cd ReceiptAI
   ```

2. **Configure environment** (optional – defaults work out of the box)
   ```bash
   cp .env.example .env
   # Edit .env if you want to change passwords/secrets
   ```

3. **Build and run**
   ```bash
   docker compose up --build
   ```

4. **Access the application**

   | Service | URL |
   |---------|-----|
   | Frontend | [http://localhost:5173](http://localhost:5173) |
   | Backend API | [http://localhost:5000](http://localhost:5000) |
   | MySQL | localhost:3306 |

5. **Login with demo account**
   ```
   Email: demo@receiptai.com
   Password: demo123
   ```

## Project Structure

```
ReceiptAI/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReceiptsPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/          # API service layer
│   │   ├── layouts/           # Layout components
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
│
├── backend/                   # Python Flask backend
│   ├── app/
│   │   ├── routes/            # API route blueprints
│   │   │   ├── auth.py
│   │   │   ├── receipts.py
│   │   │   ├── expenses.py
│   │   │   ├── dashboard.py
│   │   │   └── reports.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic services
│   │   │   ├── ocr_service.py
│   │   │   └── export_service.py
│   │   └── utils/             # Utilities (auth helpers)
│   ├── uploads/               # Receipt file storage
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
│
├── database/
│   └── init.sql               # Database initialization
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/receipts/upload` | Upload receipt files |
| GET | `/api/receipts/` | List user's receipts |
| GET | `/api/receipts/:id` | Get single receipt |
| DELETE | `/api/receipts/:id` | Delete receipt |
| POST | `/api/receipts/:id/process` | Process receipt with OCR |
| GET | `/api/receipts/:id/file` | Download receipt file |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/` | List expenses (with filters) |
| GET | `/api/expenses/:id` | Get single expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/export` | Export expenses to Excel |
| GET | `/api/expenses/categories` | List categories |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard summary data |
| GET | `/api/reports/tax-summary` | Tax summary report |
| GET | `/api/reports/tax-summary/export` | Export tax summary |

## Stopping the Application

```bash
docker compose down
```

To stop and remove all data (volumes):
```bash
docker compose down -v
```

## Important Notice

This system is intended to organize accounting records and assist with tax preparation. It does **not** provide automatic BIR compliance, official BIR accreditation, or automatic tax filing. Always preserve original receipt images and consult a qualified accountant for official filings.

## License

MIT License
