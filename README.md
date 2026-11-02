# 🎓 CampusSync — College Event Management & Collaboration Portal

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg?logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

> A modern, full-stack campus event management platform built for college societies, clubs, student chapters, and faculty coordinators. Students can browse, filter, and register for campus activities, while organizers can create, schedule, and track attendance.

---

## 🌟 Highlights & Key Features

- **🔐 Role-Based Authentication**: Secure JWT-based authentication for Students, Club Organizers, and Admins with password hashing via `bcryptjs`.
- **🎪 Dynamic Event Feed & Filters**: Real-time category filtering (Technical, Cultural, Sports, Workshops, Hackathons), search bar, and status filtering.
- **🎟️ Instant RSVP & Seat Allocation**: One-click event registration with live remaining seat counts and instant confirmation ticket generation.
- **📊 Interactive Dashboard & Metrics**: Track total registrations, upcoming events, and participation stats at a glance.
- **🛡️ Zero-Config Dual Persistence**: Works right out of the box with built-in persistent local storage **AND** seamlessly connects to MongoDB if `MONGODB_URI` is provided. No teammate gets blocked by database configuration!
- **👥 Team-First Git Architecture**: Built specifically for collaborative college lab submissions with pre-configured GitHub Issue templates, PR templates, and CI workflows.

---

## 🏗️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Modern CSS & Responsive Flex/Grid, Lucide Icons |
| **Backend** | Node.js, Express.js, REST API, JSON Web Tokens (JWT), bcryptjs |
| **Database** | Dual Mode: MongoDB / Mongoose + Fallback File-based Persistence |
| **DevOps / Collaboration** | GitHub Actions (CI), Issue & PR Templates, Semantic Branching |

---

## ⚡ Quickstart Guide (Local Setup)

Follow these simple steps to run the complete project on your machine in under 2 minutes:

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/webDev-Project.git
cd webDev-Project
```

### 2. Install All Dependencies
```bash
# Installs root, server, and client packages in one command
npm run install:all
```

### 3. Setup Environment Variables
Copy `.env.example` to `server/.env`:
```bash
# Windows PowerShell
copy .env.example server\.env

# Linux / Mac
cp .env.example server/.env
```
*(Default settings work out of the box without changing anything!)*

### 4. Start the Application
Run both frontend and backend concurrently:
```bash
npm run dev
```

- 🌐 **Frontend URL**: `http://localhost:5173`
- ⚙️ **Backend API URL**: `http://localhost:5000/api`

---

## 🔑 Demo Login Accounts

Feel free to use the pre-seeded accounts or register your own:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Student** | `student@college.edu` | `student123` | Browse events, RSVP/Register, View personal tickets |
| **Organizer** | `organizer@college.edu` | `organizer123` | Create events, manage registrations, view analytics |
| **Admin** | `admin@college.edu` | `admin123` | Full administrative control, delete/edit any event |

---

## 📁 Repository Structure

```
├── .github/                       # GitHub Actions CI, PR & Issue Templates
├── client/                        # React Frontend (Vite)
│   ├── src/
│   │   ├── components/            # UI components (Navbar, EventCard, Modals)
│   │   ├── context/               # Auth & Global State
│   │   ├── services/              # API Client (Axios/Fetch)
│   │   └── App.jsx
│   └── package.json
├── server/                        # Express.js REST API
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   ├── models/                # Schemas & dual-mode data layer
│   │   ├── routes/                # Auth & Event endpoints
│   │   └── server.js              # Server entry point
│   └── package.json
├── docs/                          # Detailed project documentation
│   ├── API_DOCUMENTATION.md       # Complete REST API guide
│   ├── ARCHITECTURE.md            # System design & data flow
│   └── TEAM_ROADMAP.md            # Feature assignment list for PRs
├── CONTRIBUTING.md                # Git workflow & PR instructions for teammates
└── README.md
```

---

## 🤝 For Team Members: How to Contribute via PR

If you are a member of our project team:
1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** for our step-by-step Fork & PR guide.
2. **Check [docs/TEAM_ROADMAP.md](docs/TEAM_ROADMAP.md)** to pick your assigned feature (e.g. QR Code ticket generator, Email alerts, PDF pass download, etc.).
3. Create your feature branch (`git checkout -b feature/your-task`).
4. Commit using conventional commits (`feat: add ticket QR code`).
5. Push to your fork and submit a Pull Request!

---

## 📜 Academic Integrity & License
This project was developed for the **College Web Development Laboratory Course**.  
Distributed under the **MIT License**. See `LICENSE` for details.
