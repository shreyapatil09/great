# SkillThali API — Sample Requests (Postman)

Base URL: http://localhost:3000

---

## AUTH

### POST /auth/signup
```json
POST http://localhost:3000/auth/signup
Content-Type: application/json

{
  "name": "Arjun Sharma",
  "email": "arjun@college.edu",
  "password": "pass1234",
  "role": "student"
}
```
Response 201:
```json
{ "message": "Account created successfully.", "userId": 1 }
```

---

### POST /auth/login
```json
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "arjun@college.edu",
  "password": "pass1234"
}
```
Response 200:
```json
{
  "message": "Login successful.",
  "user": { "id": 1, "name": "Arjun Sharma", "email": "arjun@college.edu", "role": "student" }
}
```

---

## TASKS

### POST /tasks
```json
POST http://localhost:3000/tasks
Content-Type: application/json

{
  "title": "Portfolio Website",
  "description": "Build a 3-page responsive portfolio site.",
  "budget": 1200,
  "clientEmail": "client@company.com"
}
```
Response 201:
```json
{ "message": "Task created.", "taskId": 1 }
```

---

### GET /tasks
```
GET http://localhost:3000/tasks
```
Response 200:
```json
[
  {
    "id": 1,
    "title": "Portfolio Website",
    "description": "Build a 3-page responsive portfolio site.",
    "budget": "1200.00",
    "clientEmail": "client@company.com",
    "status": "available",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
]
```

---

### GET /tasks/client/:email
```
GET http://localhost:3000/tasks/client/client%40company.com
```
Response 200 — array of tasks posted by that client.

---

## APPLICATIONS

### POST /apply
```json
POST http://localhost:3000/applications
Content-Type: application/json

{
  "taskId": 1,
  "studentEmail": "arjun@college.edu"
}
```
Response 201:
```json
{ "message": "Application submitted.", "applicationId": 1 }
```
Error (duplicate): 409 `{ "error": "You have already applied for this task." }`

---

### GET /applications/:taskId
```
GET http://localhost:3000/applications/1
```
Response 200:
```json
[
  {
    "id": 1,
    "taskId": 1,
    "studentEmail": "arjun@college.edu",
    "status": "pending",
    "applied_at": "2025-01-01T11:00:00.000Z"
  }
]
```

---

### POST /applications/status  — Accept a student
```json
POST http://localhost:3000/applications/status
Content-Type: application/json

{
  "taskId": 1,
  "studentEmail": "arjun@college.edu",
  "status": "accepted"
}
```
Response 200:
```json
{ "message": "Application accepted." }
```
Side effects (automatic):
- All other pending applicants for taskId=1 → status: "rejected"
- Task status → "in-progress"

---

### POST /applications/status  — Reject a student
```json
POST http://localhost:3000/applications/status
Content-Type: application/json

{
  "taskId": 1,
  "studentEmail": "priya@college.edu",
  "status": "rejected"
}
```

---

## SKILLS

### POST /skills  (replaces all previous skills)
```json
POST http://localhost:3000/skills
Content-Type: application/json

{
  "studentEmail": "arjun@college.edu",
  "skills": ["HTML", "CSS", "JavaScript", "React"]
}
```
Response 200:
```json
{ "message": "Skills updated.", "skills": ["HTML", "CSS", "JavaScript", "React"] }
```

---

### GET /skills/:email
```
GET http://localhost:3000/skills/arjun%40college.edu
```
Response 200:
```json
{ "studentEmail": "arjun@college.edu", "skills": ["HTML", "CSS", "JavaScript", "React"] }
```

---

## TRANSACTIONS

### GET /transactions
```
GET http://localhost:3000/transactions
```
Response 200:
```json
[
  {
    "id": 1,
    "taskId": 1,
    "taskTitle": "Portfolio Website",
    "clientEmail": "client@company.com",
    "studentEmail": "arjun@college.edu",
    "amount": "1200.00",
    "status": "pending",
    "created_at": "2025-01-01T15:00:00.000Z"
  }
]
```

---

### POST /transactions/complete  (marks task done + creates transaction)
```json
POST http://localhost:3000/transactions/complete
Content-Type: application/json

{
  "taskId": 1
}
```
Response 200:
```json
{ "message": "Task completed. Transaction created.", "transactionId": 1 }
```

---

## FULL WORKFLOW EXAMPLE

1. Client signs up       → POST /auth/signup  (role: client)
2. Student signs up      → POST /auth/signup  (role: student)
3. Student adds skills   → POST /skills
4. Client posts task     → POST /tasks
5. Student applies       → POST /applications
6. Client accepts        → POST /applications/status  { status: "accepted" }
                           ↳ others auto-rejected, task → in-progress
7. Task is completed     → POST /transactions/complete
                           ↳ task → completed, transaction created
8. Admin views all txns  → GET /transactions
