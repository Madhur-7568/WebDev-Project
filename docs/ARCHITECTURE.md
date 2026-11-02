# 🏛️ CampusSync Architecture & System Design

CampusSync is built as a modular, decoupled Full-Stack web application designed for high developer productivity, clear separation of concerns, and ease of team collaboration.

---

## 📐 System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React + Vite)"]
        UI[Tailwind UI Components]
        State[React State & Auth Context]
        APIClient[Axios / Fetch Service Layer]
    end

    subgraph Server ["Server Layer (Node.js + Express)"]
        Router[REST API Router]
        AuthMW[JWT Auth Middleware]
        Controllers[Auth & Event Controllers]
        Store[Data Storage Layer]
    end

    subgraph Data ["Data Persistence Layer"]
        JSONStore[Built-in JSON File Store (Zero-Setup Mode)]
        MongoStore[(MongoDB Atlas / Local)]
    end

    UI --> State
    State --> APIClient
    APIClient -- HTTP / JSON --> Router
    Router --> AuthMW
    AuthMW --> Controllers
    Controllers --> Store
    Store -. Fallback .-> JSONStore
    Store -. Configured .-> MongoStore
```

---

## 📁 Directory Structure Breakdown

```
CampusSync/
├── .github/                       # GitHub automation & team templates
│   ├── ISSUE_TEMPLATE/            # Standard bug & feature request forms
│   ├── PULL_REQUEST_TEMPLATE.md   # PR review checklist
│   └── workflows/ci.yml           # Automated GitHub Actions test pipeline
│
├── client/                        # Frontend application (Vite + React)
│   ├── public/                    # Static assets & favicon
│   ├── src/
│   │   ├── components/            # Reusable UI widgets (Navbar, Cards, Modals)
│   │   ├── context/               # Global state (Authentication, User session)
│   │   ├── services/              # API communication layer
│   │   ├── styles/                # CSS & design tokens
│   │   ├── App.jsx                # Main application view & router
│   │   └── main.jsx               # React DOM entry point
│   └── package.json
│
├── server/                        # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/                # Environment & Database connections
│   │   ├── controllers/           # Business logic for Auth & Events
│   │   ├── middleware/            # JWT verification & Error handlers
│   │   ├── models/                # Schemas & dual-mode data storage
│   │   ├── routes/                # Express endpoint definitions
│   │   └── server.js              # Server bootstrapper & Express app
│   └── package.json
│
├── docs/                          # Project specifications & roadmap
│   ├── API_DOCUMENTATION.md       # Complete REST API guide
│   ├── ARCHITECTURE.md            # System design & architecture
│   └── TEAM_ROADMAP.md            # Feature assignment & tasks for team
│
├── CONTRIBUTING.md                # Git fork, branch, commit, & PR guide
├── README.md                      # Project homepage & quickstart
└── package.json                   # Root orchestrator scripts
```

---

## ⚙️ Key Technical Decisions

1. **Dual-Mode Persistence Layer**:
   - One of the biggest hurdles in college projects is database setup divergence across team members (Windows without MongoDB service, Mac homebrew errors, etc.).
   - CampusSync incorporates a robust fallback: it connects to **MongoDB** if `MONGODB_URI` is provided, and automatically uses a local persistent file/in-memory data store with realistic seed data if MongoDB is absent.
   - **Zero friction onboarding**: Any team member can clone, run `npm start`, and immediately begin development!

2. **Decoupled Architecture**:
   - Frontend and backend can run on separate ports (`5173` and `5000`) or be deployed independently (e.g. Vercel for client, Render/Railway for server).
   - Clean API contract enables frontend developers to build mock UI without waiting on backend, and backend devs to test using curl/Postman.

3. **Secure Auth Pattern**:
   - Password hashing with industry-standard salt rounds (`bcryptjs`).
   - Stateless JWT tokens passed via Authorization headers.
   - Role-Based Access Control (`student`, `organizer`, `admin`).

