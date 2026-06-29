# ⚖️ Suites AI

> **Your AI legal team, always on.**

Suites AI is an AI-powered legal workspace built for lawyers and legal professionals. It automates the most time-consuming parts of legal work — client intake, contract review, document drafting, and legal research — through intelligent AI agents, all from a single dashboard.

---

## 🖼️ Screenshots

<img width="1917" height="848" alt="Screenshot 2026-06-28 104024" src="https://github.com/user-attachments/assets/54d6fc7f-f612-4f80-9077-2238d17e8eef" />
<img width="1917" height="858" alt="Screenshot 2026-06-28 104048" src="https://github.com/user-attachments/assets/362fa638-6710-49a4-b433-9a85bd9267c5" />
<img width="1917" height="862" alt="Screenshot 2026-06-28 140736" src="https://github.com/user-attachments/assets/85749129-6a43-469f-a368-eae06942114c" />
<img width="1917" height="847" alt="Screenshot 2026-06-28 140757" src="https://github.com/user-attachments/assets/260a162a-6d71-4c5e-9735-9819ad71abb9" />
<img width="1917" height="857" alt="Screenshot 2026-06-28 140855" src="https://github.com/user-attachments/assets/a1ddd66f-19c2-47be-be29-4b9980dacd06" />
<img width="1917" height="855" alt="Screenshot 2026-06-28 140922" src="https://github.com/user-attachments/assets/b86e390f-8b53-4cbd-8730-ace73b7eb84e" />
<img width="1917" height="852" alt="Screenshot 2026-06-28 140959" src="https://github.com/user-attachments/assets/de55ed38-a3cc-4132-a361-ccc69fbd57c2" />
<img width="1917" height="856" alt="Screenshot 2026-06-28 141016" src="https://github.com/user-attachments/assets/cc86427d-df00-48a1-bd24-c8a015a04285" />
<img width="1917" height="853" alt="Screenshot 2026-06-28 141034" src="https://github.com/user-attachments/assets/82f1ed7e-4560-4592-90cd-692cd827997e" />
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

**Rishab**  
[LinkedIn](linkedin.com/in/rishab-raj-0028622b4) · [GitHub](https://github.com/RishabhRaj240)

---

> _Suites AI is built to give every lawyer access to an intelligent legal team — without the overhead._
