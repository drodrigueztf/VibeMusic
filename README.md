# 🎵 VibeMusic - Music Platform

A full-stack Spotify-like music platform built with React, Node.js, Express, and Firebase.

![VibeMusic](https://img.shields.io/badge/VibeMusic-Music%20Platform-00d4ff?style=for-the-badge)

## ✨ Features

- 🎵 **Audio Upload & Streaming** — Upload MP3/WAV files, stream with HTTP Range headers (206 Partial Content)
- 🔐 **Authentication** — Register, login, JWT-based sessions
- 📋 **Playlists** — Create, edit, delete, add/remove songs
- ❤️ **Favorites** — Like/unlike songs, dedicated favorites page
- 🔍 **Search** — Search by song title, artist, or genre
- 🎯 **Recommendations** — Genre-based smart recommendations
- 🎨 **Dark Mode** — Premium dark UI with glassmorphism effects
- 📱 **Responsive** — Works on desktop and mobile
- 🎧 **Full Player** — Play/pause, skip, seek, volume, shuffle, repeat

## 🏗️ Project Structure

```
VibeMusic/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── upload.js          # Multer audio upload
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Song.js            # Song schema
│   │   │   └── Playlist.js        # Playlist schema
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register, login, profile
│   │   │   ├── songController.js   # Upload, stream, CRUD, likes
│   │   │   ├── playlistController.js # Playlist CRUD
│   │   │   └── searchController.js  # Search endpoint
│   │   ├── routes/                 # Express route definitions
│   │   └── server.js              # Entry point
│   ├── uploads/                    # Audio files storage
│   ├── .env                        # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Main app layout
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── Player.jsx         # Audio player bar
│   │   │   ├── SongCard.jsx       # Song card component
│   │   │   └── PlaylistCard.jsx   # Playlist card component
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Dashboard with sections
│   │   │   ├── SearchPage.jsx     # Search + genre filters
│   │   │   ├── UploadPage.jsx     # Drag & drop upload
│   │   │   ├── LibraryPage.jsx    # User's songs & playlists
│   │   │   ├── PlaylistPage.jsx   # Playlist detail view
│   │   │   ├── FavoritesPage.jsx  # Liked songs
│   │   │   ├── LoginPage.jsx      # Login form
│   │   │   └── RegisterPage.jsx   # Register form
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state management
│   │   │   └── PlayerContext.jsx  # Global audio player
│   │   ├── services/api.js        # Axios API client
│   │   ├── App.jsx                # Root component + routes
│   │   └── index.css              # Design system + styles
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **MongoDB** running locally or a MongoDB Atlas connection string ([download](https://www.mongodb.com/try/download/community))

### Step 1: Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sharkify
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=7d
```

### Step 3: Start MongoDB

```bash
# If using local MongoDB
mongod
```

Or use [MongoDB Atlas](https://www.mongodb.com/atlas) and update `MONGO_URI` in `.env`.

### Step 4: Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
The API will start at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
The app will open at `http://localhost:5173`

### Step 5: Start Using VibeMusic! 🎵

1. Open `http://localhost:5173` in your browser
2. Click **Sign Up** to create an account
3. Go to **Upload** and add your first audio file (MP3 or WAV)
4. Play your music with the built-in player!
5. Create playlists, search songs, and like your favorites

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Upload | Multer |
| Styling | Vanilla CSS, CSS Custom Properties |
| Icons | React Icons (Ionicons) |

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user profile |

### Songs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/songs` | Upload song (auth) |
| GET | `/api/songs` | List all songs |
| GET | `/api/songs/popular` | Popular songs |
| GET | `/api/songs/recent` | Recently added |
| GET | `/api/songs/recommendations` | Recommendations |
| GET | `/api/songs/genre/:genre` | Songs by genre |
| GET | `/api/songs/stream/:id` | Stream audio |
| PUT | `/api/songs/:id/like` | Toggle like (auth) |
| DELETE | `/api/songs/:id` | Delete song (auth) |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/playlists` | Create playlist (auth) |
| GET | `/api/playlists` | My playlists (auth) |
| GET | `/api/playlists/public` | Public playlists |
| GET | `/api/playlists/:id` | Get playlist |
| PUT | `/api/playlists/:id` | Update playlist (auth) |
| PUT | `/api/playlists/:id/songs` | Add/remove song (auth) |
| DELETE | `/api/playlists/:id` | Delete playlist (auth) |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=term` | Search songs |

## 📄 License

MIT
