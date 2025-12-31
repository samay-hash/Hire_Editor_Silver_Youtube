A production-ready YouTube approval system where editors upload videos, creators review and approve them, and approved videos are automatically uploaded to YouTube — ensuring security, control, and zero re-uploads.

🛠 Tech Stack

Frontend

React

TailwindCSS

Axios

React Router

LocalStorage auth persistence

Backend

Node.js + Express

MongoDB + Mongoose

JWT authentication (User + Admin roles)

bcrypt password hashing

Zod input validation

Multer for video uploads

Google APIs (YouTube Data API v3)

OAuth2 (secure YouTube integration)

🔐 Authentication & Roles

Separate User / Admin login systems

JWT-based protected routes

Middleware authorization

Creator invites editors securely

Token stored safely in headers (token: <jwt>)

🎥 Video Workflow

1️⃣ Editor uploads video to platform
2️⃣ Creator receives it in Pending videos
3️⃣ Creator approves / rejects
4️⃣ On approval → server uploads video directly to YouTube
5️⃣ Status updates automatically

No downloading. No re-uploading. Full control.

📂 Key Features

Secure invite-based editor onboarding

Role-based dashboards

Approval queue system

Automatic YouTube upload

Complete audit trail

Scalable & production-oriented folder structure

🚀 Why this project matters

Solves real creator workflow problems

Saves bandwidth & time

Adds safety layer before publishing

Designed like real SaaS tools
