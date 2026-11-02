# 🗺️ CampusSync Team Feature Roadmap & PR Assignments

This document outlines ready-to-pick features for team members. Each feature is designed to be an independent Pull Request (PR) that can be developed and merged without breaking existing code.

---

## 🎯 Task Distribution Matrix for Team Members

| # | Feature Track | Recommended Tech / Lib | Difficulty | Assigned To | Status |
|---|---------------|-------------------------|------------|-------------|--------|
| **PR-01** | **QR Code Ticket Generation** | `qrcode` (npm), Canvas | Easy-Medium | Team Member 1 | 📝 Open |
| **PR-02** | **Email Notifications & RSVP Confirmation** | `nodemailer` | Medium | Team Member 2 | 📝 Open |
| **PR-03** | **Interactive Calendar View** | FullCalendar / Date-fns | Medium | Team Member 3 | 📝 Open |
| **PR-04** | **Downloadable Event Pass (PDF)** | `jspdf` / `html2canvas` | Medium | Team Member 4 | 📝 Open |
| **PR-05** | **Event Review, Ratings & Feedback** | Express + React Modal | Easy | Team Member 5 | 📝 Open |
| **PR-06** | **College Department / Club Analytics** | Chart.js / Recharts | Medium-Hard | Team Member 6 | 📝 Open |
| **PR-07** | **Dark Mode & Modern Theme Toggle** | Tailwind / CSS variables | Easy | Team Member 7 | 📝 Open |

---

## 📋 Detailed PR Specifications

### 🎫 PR-01: QR Code Ticket Generator
- **Goal**: When a student registers for an event, generate a scannable QR Code containing their unique Ticket ID (`TCK-EVT...`), Student ID, and Event Name.
- **Backend changes**:
  - Add `/api/events/:id/verify-ticket` endpoint for organizers to scan and mark attendance.
- **Frontend changes**:
  - In the "My Registrations" tab or Ticket Modal, display the generated QR code.
- **Branch Name**: `feature/qr-ticket-generator`

---

### 📧 PR-02: Automated Email Notifications (RSVP Confirmation)
- **Goal**: Send an automated confirmation email to the student upon successful registration with event venue, date, and guidelines.
- **Backend changes**:
  - Integrate `nodemailer` using Gmail SMTP or Ethereal test account.
  - Send email in `eventController.registerForEvent`.
- **Branch Name**: `feature/email-notifications`

---

### 📅 PR-03: Calendar View for Campus Events
- **Goal**: Add a calendar toggle view on the homepage so students can see events highlighted on days of the month.
- **Frontend changes**:
  - Create `CalendarView.jsx` component.
  - Clicking on a date filters events happening on that specific day.
- **Branch Name**: `feature/calendar-view`

---

### 📄 PR-04: Downloadable PDF Event Ticket / Pass
- **Goal**: Give registered students a button: "Download Ticket (PDF)" styled like an official college event badge.
- **Frontend changes**:
  - Install `jspdf` or use printable CSS `@media print`.
  - Format ticket with College Name, Event Title, Date, Venue, Student Name, Roll Number, and QR code.
- **Branch Name**: `feature/pdf-ticket-download`

---

### ⭐ PR-05: Event Feedback & Ratings System
- **Goal**: Allow students to rate past events (1-5 stars) and write comments/reviews.
- **Backend changes**:
  - Add `reviews: [{ userId, rating, comment, date }]` to the Event model.
  - Endpoint `POST /api/events/:id/review`.
- **Branch Name**: `feature/event-reviews-ratings`

---

### 📊 PR-06: Organizer Analytics Dashboard
- **Goal**: An analytics page for organizers showing charts of registration trends, category-wise popularity, and attendance rates.
- **Frontend changes**:
  - Use Chart.js or Recharts to visualize registration numbers.
- **Branch Name**: `feature/organizer-analytics`

---

## 🚦 PR Submission Workflow Reminder
1. Pick one feature from the table above.
2. Create branch: `git checkout -b feature/<feature-name>`.
3. Code & test locally.
4. Push and open PR with title `feat: add <feature-name>`.
5. Request review from team leader!

