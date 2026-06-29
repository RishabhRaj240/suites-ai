# ⚖️ Suites AI

> **Your AI legal team, always on.**

Suites AI is an AI-powered legal workspace built for lawyers and legal professionals. It automates the most time-consuming parts of legal work — client intake, contract review, document drafting, and legal research — through intelligent AI agents, all from a single dashboard.

---

## 🖼️ Screenshots

> _Sign-in page and dashboard built on Lovable. All agent modules built on Antigravity._

---

## ✨ Features

| Agent | Description |
|-------|-------------|
| 👤 **Intake Agent** | Collects client information and auto-generates an AI case summary |
| 📄 **Contract Review Agent** | Analyzes uploaded contracts for risk score, key clauses, and red flags |
| ✍️ **Drafting Agent** | Generates legal notices, NDAs, demand letters, and cease & desist documents |
| 🔍 **Research Agent** | Searches legal statutes, precedents, and information via AI |
| 🗂️ **Case Memory** | Stores and retrieves full case history, linked documents, and research logs |
| 🏠 **Dashboard** | Central lawyer workspace with quick actions, metrics, and activity feed |

---

## 🛠️ Tech Stack

### Frontend
- **Lovable** — Sign-in page & main dashboard UI
- **Antigravity** — All AI agent modules (Intake, Contract Review, Drafting, Research, Memory)
- **React** — Component framework
- **Tailwind CSS** — Styling

### Backend
- **FastAPI** — REST API server handling all AI agent logic

### Database & Storage
- **Supabase** — PostgreSQL database, authentication, and file storage

### AI
- **Gemini 2.5 Flash-Lite** — Powers all five AI agents

### Deployment
- **Vercel** — Frontend hosting
- **Render** — FastAPI backend hosting

---

## 🗃️ Database Schema

```sql
users        (id, name, email, created_at)
cases        (id, user_id, client_name, case_type, description, status, created_at)
contracts    (id, case_id, file_url, risk_score, analysis_json, created_at)
drafts       (id, case_id, doc_type, content, created_at)
research_logs(id, case_id, query, result_json, created_at)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/suites-ai.git
cd suites-ai
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Supabase URL, Anon Key, and FastAPI backend URL
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your Gemini API key and Supabase service role key
uvicorn main:app --reload
```

### 4. Environment Variables

**Frontend (`.env.local`)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

**Backend (`.env`)**
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/intake` | Submit client info, returns AI case summary |
| `POST` | `/contract-review` | Accepts Supabase file URL, returns contract analysis |
| `POST` | `/draft` | Accepts document type + details, returns generated document |
| `POST` | `/research` | Accepts legal query, returns AI research results |

All endpoints require a Supabase Bearer token in the `Authorization` header.

---

## 📁 Project Structure

```
suites-ai/
├── frontend/              # React app (Lovable + Antigravity)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth.jsx           # Sign-in / Sign-up (Lovable)
│   │   │   ├── Dashboard.jsx      # Main workspace (Lovable)
│   │   │   ├── Intake.jsx         # Intake Agent (Antigravity)
│   │   │   ├── ContractReview.jsx # Contract Review Agent (Antigravity)
│   │   │   ├── Drafting.jsx       # Drafting Agent (Antigravity)
│   │   │   ├── Research.jsx       # Research Agent (Antigravity)
│   │   │   └── CaseMemory.jsx     # Case History (Antigravity)
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── backend/               # FastAPI server
│   ├── main.py
│   ├── routers/
│   │   ├── intake.py
│   │   ├── contract.py
│   │   ├── drafting.py
│   │   └── research.py
│   ├── services/
│   │   └── gemini.py
│   └── requirements.txt
│
└── README.md
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0A0A0F` |
| Surface | `#12121A` |
| Primary Accent | `#7C6FFF` (Electric Violet) |
| Secondary Accent | `#00D4AA` (Teal Mint) |
| Text Primary | `#F0F0FF` |
| Font | Inter + JetBrains Mono |

---

## 🗺️ Roadmap

- [x] Auth (Sign-in / Sign-up)
- [x] Dashboard UI
- [x] Intake Agent
- [x] Contract Review Agent
- [x] Drafting Agent
- [x] Research Agent
- [x] Case Memory
- [ ] Multi-user firm accounts
- [ ] PDF export for drafted documents
- [ ] Email integration for client communication
- [ ] Billing & subscription (Stripe)
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Built By

**Rishabh** — B.Tech CSE, Kalinga University  
[LinkedIn](https://linkedin.com/in/yourprofile) · [GitHub](https://github.com/yourusername)

---

> _Suites AI is built to give every lawyer access to an intelligent legal team — without the overhead._
