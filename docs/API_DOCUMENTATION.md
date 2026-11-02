# 📡 CampusSync API Documentation

Base URL: `http://localhost:5000/api`

All requests and responses use standard `application/json` content-type unless specified otherwise.
For protected routes, include the Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Aarav Sharma",
  "email": "aarav@college.edu",
  "password": "Password123!",
  "role": "student", // Options: "student", "organizer", "admin"
  "collegeId": "CS2023045",
  "department": "Computer Science"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_9812",
    "name": "Aarav Sharma",
    "email": "aarav@college.edu",
    "role": "student",
    "collegeId": "CS2023045",
    "department": "Computer Science"
  }
}
```

### Login User
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "aarav@college.edu",
  "password": "Password123!"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_9812",
    "name": "Aarav Sharma",
    "email": "aarav@college.edu",
    "role": "student"
  }
}
```

### Get Current Profile
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Access**: Protected (Requires Bearer token)
- **Response** (`200 OK`):
```json
{
  "success": true,
  "user": {
    "id": "usr_9812",
    "name": "Aarav Sharma",
    "email": "aarav@college.edu",
    "role": "student"
  }
}
```

---

## 🎪 2. Events Endpoints

### Get All Events (with filters & search)
- **Method**: `GET`
- **Endpoint**: `/events`
- **Access**: Public
- **Query Parameters**:
  - `category`: e.g. `Technical`, `Cultural`, `Sports`, `Workshop`, `Gaming`
  - `search`: search keywords in title or description
  - `status`: `upcoming`, `ongoing`, `past`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "count": 4,
  "events": [
    {
      "id": "evt_101",
      "title": "HackCampus 2026: 24h Hackathon",
      "description": "Annual flagship inter-college hackathon focusing on AI and Web3.",
      "category": "Technical",
      "venue": "Main Auditorium & Lab 3",
      "date": "2026-11-20T09:00:00.000Z",
      "capacity": 200,
      "registeredCount": 142,
      "organizer": {
        "id": "usr_org_1",
        "name": "ACM Student Chapter",
        "email": "acm@college.edu"
      },
      "tags": ["Coding", "AI", "Hackathon"],
      "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"
    }
  ]
}
```

### Get Single Event Details
- **Method**: `GET`
- **Endpoint**: `/events/:id`
- **Access**: Public
- **Response** (`200 OK`):
```json
{
  "success": true,
  "event": {
    "id": "evt_101",
    "title": "HackCampus 2026: 24h Hackathon",
    "description": "...",
    "category": "Technical",
    "venue": "Main Auditorium & Lab 3",
    "date": "2026-11-20T09:00:00.000Z",
    "capacity": 200,
    "registeredCount": 142,
    "attendees": ["usr_9812", "usr_9813"]
  }
}
```

### Create New Event
- **Method**: `POST`
- **Endpoint**: `/events`
- **Access**: Protected (Role: `organizer` or `admin`)
- **Request Body**:
```json
{
  "title": "RoboWars 2026",
  "description": "Combat robotics showdown between university teams.",
  "category": "Technical",
  "venue": "Campus Amphitheater",
  "date": "2026-12-05T10:00:00.000Z",
  "capacity": 150,
  "tags": ["Robotics", "Hardware", "Competition"],
  "image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800"
}
```
- **Response** (`201 Created`): Returns created event object.

### Register / RSVP for Event
- **Method**: `POST`
- **Endpoint**: `/events/:id/register`
- **Access**: Protected (Any logged-in student/user)
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Successfully registered for HackCampus 2026",
  "ticketId": "TCK-EVT101-9812",
  "event": {
    "id": "evt_101",
    "registeredCount": 143
  }
}
```

### Cancel Registration
- **Method**: `DELETE`
- **Endpoint**: `/events/:id/register`
- **Access**: Protected
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

### Delete Event
- **Method**: `DELETE`
- **Endpoint**: `/events/:id`
- **Access**: Protected (Organizer who created it, or Admin)

---

## 📊 3. Stats / Analytics Endpoint

### Get Platform Overview Stats
- **Method**: `GET`
- **Endpoint**: `/events/stats/overview`
- **Access**: Public
- **Response** (`200 OK`):
```json
{
  "success": true,
  "stats": {
    "totalEvents": 12,
    "totalRegistrations": 485,
    "activeClubs": 8,
    "upcomingEvents": 5
  }
}
```
