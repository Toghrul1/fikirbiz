# FikirBiz — Layihəni İşə Salmaq

## Backend

```bash
source backend/venv/bin/activate && cd backend && uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Frontend

```bash
cd frontend && npm run dev
```

Layihə: http://localhost:5173

## Hər İkisi Eyni Anda

Terminal 1:
```bash
source backend/venv/bin/activate && cd backend && uvicorn app.main:app --reload --port 8000
```

Terminal 2:
```bash
cd frontend && npm run dev
```
