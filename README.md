# VibeMusic

A full-stack music platform built with React, Node.js, Express, and Firebase Firestore.

## Features

- Audio upload and streaming
- JWT authentication
- Playlists
- Favorites
- Search
- Recommendations
- Responsive UI
- Integrated player

## Project Structure

```text
VibeMusic/
|-- backend/
|   |-- src/
|   |   |-- config/db.js
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   `-- server.js
|   |-- uploads/
|   |-- .env
|   `-- package.json
|-- frontend/
|   |-- src/
|   |-- public/
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled
- A Firebase Admin service account key

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure backend environment

Create `backend/.env`:

```env
PORT=5000
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=7d
```

### 3. Configure Firebase

1. Create a Firebase project.
2. Enable Firestore.
3. Generate a Firebase Admin service account key.
4. Save the key as `backend/firebaseServiceAccountKey.json`.

## Run locally

Open two terminals.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

The API runs at `http://localhost:5000`.
The frontend runs at `http://localhost:5173`.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | Firebase Firestore |
| Auth | JWT, bcrypt |
| Upload | Multer |
| Styling | CSS |

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Songs

- `POST /api/songs`
- `GET /api/songs`
- `GET /api/songs/popular`
- `GET /api/songs/recent`
- `GET /api/songs/recommendations`
- `GET /api/songs/genre/:genre`
- `GET /api/songs/stream/:id`
- `PUT /api/songs/:id/like`
- `DELETE /api/songs/:id`

### Playlists

- `POST /api/playlists`
- `GET /api/playlists`
- `GET /api/playlists/public`
- `GET /api/playlists/:id`
- `PUT /api/playlists/:id`
- `PUT /api/playlists/:id/songs`
- `DELETE /api/playlists/:id`

### Search

- `GET /api/search?q=term`
