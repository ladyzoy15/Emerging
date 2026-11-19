# Resibo - AI Receipt Scanner & Expense Tracker

A modern web application built with React, Flask, and Docker for scanning receipts, extracting line items, VAT calculations, and tracking expenses in Philippine Peso (₱).

## Features
- **Live Camera Scanner**: Scan receipts directly using your phone or web camera with viewfinder guides.
- **Instant AI Extraction**: Automatic extraction of merchant name, date, invoice number, line items (qty, description, unit price, amount), 12% VAT breakdown, and change due.
- **Philippine Peso Currency (₱)**: Full support for Philippine standard receipts (BIR compliant breakdown).
- **Glassmorphism UI**: Beautiful, sleek, modern interface with glassmorphism design.
- **Export to Excel**: Download complete tax summaries and expense reports compatible with spreadsheet software.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Python Flask, SQLAlchemy, PyTesseract OCR, PyJWT
- **Database**: MySQL 8.0 / SQLite
- **Deployment**: Docker & Docker Compose

## Quick Start with Docker
```bash
docker compose up --build -d
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Email**: `demo@receiptai.com`
- **Password**: `demo123`
