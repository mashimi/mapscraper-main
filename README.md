# MapScraper Pro — Enterprise Google Maps Data Intelligence

A full-stack, production-grade Google Maps scraping system with real-time streaming, AI-powered lead enrichment, and bulk batch orchestration. Designed for scale, stealth, and reliability.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Batch Commander (Python)                 │
│   CSV → Async Job Submission → Polling → Results Export     │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /api/jobs
                         │ GET /api/jobs/:id
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Server (Node.js)                    │
│  Puppeteer + Stealth                      Socket.io Server  │
│  Gemini AI Sentiment                      Express / Helmet  │
└───────────────────────┬─────────────────────────────────────┘
                        │ Socket.io (Real-time)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 React Dashboard (TypeScript)                 │
│  Extraction UI | Live Results | CSV/JSON Export | Logs      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
mapscraper-main/
├── client/                        # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.tsx                # Main dashboard component
│   │   ├── main.tsx               # Entry point
│   │   ├── index.css              # Tailwind + global styles
│   │   └── components/
│   │       ├── Sidebar.tsx        # Navigation sidebar
│   │       ├── JobCard.tsx        # Job status card
│   │       ├── LeadTable.tsx      # Scraped leads table
│   │       └── StatCard.tsx       # Analytics stat card
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                        # Node.js + Express backend
│   ├── src/
│   │   ├── index.ts               # Server entry, Socket.io setup
│   │   ├── controllers/
│   │   │   └── scraper.controller.ts
│   │   ├── models/
│   │   │   └── scrape-job.model.ts
│   │   └── services/
│   │       ├── scraper.service.ts  # Puppeteer Google Maps scraper
│   │       ├── ai.service.ts       # Gemini AI sentiment analysis
│   │       └── job-store.ts        # In-memory job state store
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
├── batch-commander/               # Python bulk job orchestrator
│   ├── batch_commander.py         # Async producer/consumer pipeline
│   ├── api_client.py              # HTTP client for backend API
│   ├── managers.py                # Checkpoint, JobTracker, Stats
│   ├── models.py                  # Pydantic response models
│   ├── config.py                  # Pydantic Settings
│   ├── generate_csv.py            # CSV generation utility
│   ├── african_suppliers.csv      # Sample input data
│   ├── requirements.txt
│   └── .env
│
├── check_modules.js               # Dependency checker utility
└── .gitignore
```

---

## Features

### 🕵️ Stealth Scraping
- Puppeteer with **puppeteer-extra** and **stealth plugin** to avoid detection
- Configurable proxy support
- Human-like interaction patterns

### 🤖 AI Enrichment
- **Google Gemini AI** integration for automatic lead sentiment analysis
- Enriches business listings with AI-generated insights

### ⚡ Real-Time Streaming
- **Socket.io** pushes leads to the dashboard as they're scraped — no page refresh needed
- Live job status updates with per-job progress tracking

### 📊 Bulk Batch Orchestration
- **Python async CLI** tool (`batch-commander/`) for large-scale jobs
- Reads keywords/locations from CSV
- Async job submission with concurrency control
- Resume/checkpoint support — stop and restart without losing progress
- Detailed logging, progress bars, failed job tracking

### 🎨 Professional Dashboard
- Tailwind CSS dark theme with glassmorphism design
- Live extraction pipeline view
- Lead database with CSV/JSON export
- Proxy stealth status panel
- Live system logs terminal
- Settings panel (AI model selection, scraping threads)

---

## Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **Python** 3.10+
- **Google Gemini API key** (set in `server/.env`)
- **Google Chrome** (for Puppeteer)

### 1. Backend Server

```bash
cd server
cp .env.example .env       # set your GEMINI_API_KEY
npm install
npm run dev                # starts on http://localhost:4000
```

### 2. Frontend Dashboard

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

### 3. Batch Commander (Optional — for bulk scraping)

```bash
cd batch-commander
pip install -r requirements.txt
# Prepare your CSV of keywords/locations, then:
python batch_commander.py --csv african_suppliers.csv
```

---

## API Endpoints

| Method | Endpoint            | Description                  |
|--------|---------------------|------------------------------|
| POST   | `/api/jobs`         | Start a new scrape job       |
| GET    | `/api/jobs/:jobId`  | Get job status & results     |
| GET    | `/health`           | Server health check          |
| GET    | `/api/health`       | API health check             |

### WebSocket Events

| Event               | Direction     | Description                   |
|---------------------|---------------|-------------------------------|
| `connect`           | Client → Server | Socket connection            |
| `disconnect`        | Client → Server | Socket disconnection         |
| `job_update_<id>`   | Server → Client | Real-time job progress/leads |

---

## Batch Commander CLI

```bash
# Basic usage
python batch_commander.py --csv data.csv

# With custom concurrency
python batch_commander.py --csv data.csv --submits 10 --polls 20

# Resume from checkpoint
python batch_commander.py --csv data.csv --resume

# Dry run (validate CSV without submitting)
python batch_commander.py --csv data.csv --dry-run
```

### CLI Arguments

| Flag                | Default | Description                          |
|---------------------|---------|--------------------------------------|
| `--csv`             | —       | Path to input CSV file (required)    |
| `--submits`         | 5       | Max concurrent job submissions       |
| `--polls`           | 10      | Max concurrent status polls          |
| `--delay`           | 1.0     | Delay between submissions (seconds)  |
| `--poll-delay`      | 2.0     | Delay between polls (seconds)        |
| `--resume`          | false   | Resume from last checkpoint          |
| `--dry-run`         | false   | Validate CSV without submitting      |

---

## Configuration

### Server (`server/.env`)

```
GEMINI_API_KEY=your_gemini_api_key
PORT=4000
```

### Batch Commander (`batch-commander/.env`)

```
API_BASE_URL=http://localhost:4000
```

---

## Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS       |
| Backend    | Node.js, Express, TypeScript, Socket.io        |
| Scraping   | Puppeteer, puppeteer-extra, stealth plugin     |
| AI         | Google Gemini AI (Generative Language API)     |
| CLI/Tool   | Python 3.10+, httpx, asyncio, tenacity, tqdm   |
| Validation | Zod (TS), Pydantic (Python)                    |

---

## License

MIT