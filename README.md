# Connectly — Real-Time Chat Application

A production-shaped, full-stack real-time messaging application built with the MERN stack and Socket.IO. Inspired by the core mechanics of apps like WhatsApp and Telegram, with an original design system and independent implementation.

> Built as a portfolio/resume project to demonstrate full-stack engineering: auth & security, REST API design, real-time systems architecture, and a polished React frontend.

## Features

- **Auth**: register/login/logout, JWT (httpOnly cookies), bcrypt password hashing, persistent sessions, protected routes
- **1:1 chat**: auto-created conversations, conversation list with live last-message preview and unread badges, user search
- **Real-time messaging**: instant send/receive over Socket.IO, typing indicators, online/offline presence with last seen, delivered/read receipts
- **Message operations**: edit, delete for me / delete for everyone, reply-to, timestamps
- **Group chat**: create groups, add/remove members, admin roles, rename, leave
- **Media sharing**: images and files via Cloudinary, no binary data stored in MongoDB
- **Notifications**: real-time, driven by actual events — new message, group message, added to group
- **Security**: rate limiting, Helmet, CORS lockdown, centralized error handling, authorization checks on every mutating action
- **Tests**: Jest + Supertest covering auth, conversations, messages, and authorization boundaries

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client, Context API, Lucide Icons
**Backend:** Node.js, Express, Socket.IO, JWT, bcrypt, Multer, Cloudinary SDK
**Database:** MongoDB + Mongoose
**Testing:** Jest, Supertest, mongodb-memory-server
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Architecture

```
User → React (Vite) → Axios / Socket.IO Client → Express / Socket.IO Server
     → Auth Middleware → Controllers / Services → MongoDB (Mongoose)
```

Real-time message path:
```
User A → Socket.IO Client → Socket.IO Server → Conversation Room → User B's Socket → React UI
```

REST and Socket.IO share a **services layer** (`conversationService`, `messageService`) so both the HTTP API and the WebSocket handlers create/validate data through the exact same code path — no duplicated business logic between the two transports.

## Project Structure

```
connectly/
├── client/    # React + Vite frontend
│   └── src/
│       ├── components/   # sidebar, chat, modals, ui
│       ├── pages/        # Login, Register, Home, Profile
│       ├── layouts/      # AuthLayout, AppLayout
│       ├── context/      # AuthContext, SocketContext, ChatContext
│       ├── services/     # REST API clients
│       └── socket/       # Socket.IO client singleton
└── server/    # Express + Socket.IO backend
    └── src/
        ├── models/       # User, Conversation, Message, Notification
        ├── controllers/  # REST request handlers
        ├── services/     # Shared business logic (REST + sockets)
        ├── socket/       # Socket.IO server, auth, event handlers
        ├── middleware/   # auth, error handling, rate limiting, uploads
        └── routes/       # Express route definitions
```

## Environment Setup

**Backend** (`server/.env`):
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/connectly
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your key>
CLOUDINARY_API_SECRET=<your secret>
```

**Frontend** (`client/.env`):
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Installation & Running Locally

```bash
# Backend
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev             # http://localhost:5000

# Frontend (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev             # http://localhost:5173
```

## Running Tests

```bash
cd server
npm test
```

Covers: registration, login, auth middleware, conversation creation (find-or-create), sending/fetching messages, authorization boundaries (non-participants blocked, only-sender-can-edit), and message deletion permissions.

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | `POST /register`, `POST /login`, `POST /logout`, `GET /me` |
| Users | `GET /search`, `GET /:id`, `PUT /profile`, `PUT /password` |
| Conversations | `GET /`, `POST /`, `GET /:id` |
| Messages | `GET /:conversationId`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Groups | `POST /`, `PUT /:id`, `POST /:id/members`, `DELETE /:id/members/:userId`, `POST /:id/leave` |
| Notifications | `GET /`, `PUT /:id/read`, `PUT /read-all` |
| Uploads | `POST /` (multipart, field name `file`) |

All routes except `/auth/register` and `/auth/login` require authentication via the JWT cookie.

## Socket.IO Events

| Event | Direction | Purpose |
|---|---|---|
| `join_conversation` / `leave_conversation` | client → server | room management |
| `send_message` | client → server (ack) | persist + broadcast a message |
| `receive_message` | server → client | new message delivered to the room |
| `typing_start` / `typing_stop` | client ↔ server | ephemeral typing indicator |
| `message_delivered` / `message_read` | client ↔ server | receipt tracking |
| `user_online` / `user_offline` | server → client | presence |
| `new_notification` | server → client | pushed to a user's personal room |

## Database Schema

Four Mongoose models — `User`, `Conversation`, `Message`, `Notification` — with indexes chosen for the app's actual query patterns:
- `Message: {conversation, createdAt}` — powers paginated message history (the highest-traffic query in the app)
- `Conversation: {participants}` — powers "list my conversations" and "find-or-create a 1:1 chat"
- `Notification: {recipient, read, createdAt}` — powers the unread notification feed

## Deployment

This walks through taking Connectly from `localhost` to a live public URL, using free tiers throughout.

### 1. MongoDB Atlas (production database)

1. At [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas), create a free M0 cluster (if you don't already have one from local dev).
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere) — Render's IPs aren't static, so this is required unless you're on a paid tier with a fixed egress IP.
4. **Connect → Drivers** → copy the connection string. This is your production `MONGO_URI`.

### 2. Cloudinary

Already set up from Phase 6 — reuse the same Cloud Name / API Key / API Secret for production.

### 3. Backend → Render

1. Push your `server/` folder to a GitHub repo (or push the whole `connectly/` monorepo).
2. On [render.com](https://render.com), **New → Web Service**, connect your repo.
3. Settings:
   - **Root Directory**: `server` (if using a monorepo)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. **Environment variables** (Render dashboard → Environment):
   ```
   PORT=5000
   NODE_ENV=production
   MONGO_URI=<your Atlas connection string>
   JWT_SECRET=<a long random string — generate a new one for production>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=<your Vercel URL, added after step 4 — e.g. https://connectly.vercel.app>
   CLOUDINARY_CLOUD_NAME=<...>
   CLOUDINARY_API_KEY=<...>
   CLOUDINARY_API_SECRET=<...>
   ```
5. Deploy. Render gives you a URL like `https://connectly-api.onrender.com`. Note it — the frontend needs it next.

> **Free-tier note:** Render's free web services spin down after inactivity and take ~30-60 seconds to wake on the next request. This is normal, not a bug — worth mentioning if a recruiter tries the live link and it's slow to respond the first time.

### 4. Frontend → Vercel

1. On [vercel.com](https://vercel.com), **New Project**, import the same repo.
2. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment variables**:
   ```
   VITE_API_URL=https://connectly-api.onrender.com/api
   VITE_SOCKET_URL=https://connectly-api.onrender.com
   ```
4. Deploy. Vercel gives you a URL like `https://connectly.vercel.app`.
5. **Go back to Render** and update `CLIENT_URL` to this exact Vercel URL, then redeploy the backend — CORS and cookies will reject requests from an origin that doesn't match.

A `vercel.json` is included in `client/` with a SPA rewrite rule — without it, refreshing a client-side route like `/profile` directly would 404, since Vercel would otherwise look for a literal `/profile` file.

### 5. Production CORS & cookies — why this matters

Your frontend (`vercel.app`) and backend (`onrender.com`) are different domains in production, unlike `localhost` where they're just different ports. This changes two things the code already accounts for:
- **CORS**: `app.js` restricts `origin` to exactly `CLIENT_URL` — get this URL wrong (trailing slash, http vs https) and every request will be silently blocked by the browser.
- **Cookies**: `token.js` sets `sameSite: 'none'` and `secure: true` in production — required for a cookie to be sent cross-site at all. This only works over HTTPS, which both Render and Vercel provide by default.

### 6. Socket.IO in production

No extra config needed beyond `CLIENT_URL` being correct — Socket.IO reuses the same CORS settings as the REST API (`socket/index.js`). One real limitation to know for an interview: **Render's free tier runs a single instance**, so Socket.IO works out of the box. If you ever scaled to multiple backend instances, you'd need the `@socket.io/redis-adapter` so that a message sent to a socket connected on Instance A can reach a recipient connected on Instance B — without it, rooms only work within a single process.

### 7. Verify the live deployment

- Visit your Vercel URL, register two accounts, and confirm real-time messaging works between them exactly like it did locally.
- Check the Render logs if anything fails — `MongoDB connected` should appear on boot, same as local.


## Screenshots

*(Add screenshots of the login page, chat view, and group chat here before publishing.)*

## Future Improvements

- Redis adapter for Socket.IO to support horizontal scaling across multiple server instances
- Message search
- Voice/video calling
- End-to-end encryption
- Push notifications (web push / mobile)

## Author

Built by Alok — 4th-year Computer Science student. Connect on [LinkedIn]() · [GitHub]()
