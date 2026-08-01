# Sinar Anugrah - React & Express Modular Setup

Aplikasi full-stack yang memisahkan antara frontend **React (Vite)** dan backend **Express.js API** dengan arsitektur modular *best practice*.

## Struktur Folder Project

```text
SINAR ANUGRAH/
├── client/                         # Frontend React (Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page level components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API service wrappers (Fetch/Axios)
│   │   ├── utils/                  # Helper utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                         # Backend Express REST API (Modular Architecture)
│   ├── src/
│   │   ├── config/                 # Environment & DB configurations
│   │   ├── controllers/            # Request handlers (req, res)
│   │   ├── services/               # Business logic layer
│   │   ├── models/                 # Data access / Schemas
│   │   ├── routes/                 # Express API routes definition
│   │   ├── middlewares/            # Custom middlewares (Auth, Error handling)
│   │   ├── utils/                  # Server helper utilities & responses
│   │   └── app.js                  # Express app setup
│   ├── index.js                    # Server entry point listener
│   └── .env.example
│
├── package.json                    # Root package.json (Concurrently runner)
└── README.md
```

## Cara Menjalankan Project

### 1. Install Dependensi
Jalankan perintah ini dari root folder untuk menginstall dependensi root, client, dan server sekaligus:

```bash
npm run install:all
```

### 2. Konfigurasi Environment Variable
Salin file `.env.example` di dalam folder `server/` menjadi `.env`:

```bash
cp server/.env.example server/.env
```

### 3. Menjalankan Server & Client Secara Serentak
Jalankan perintah berikut di root folder:

```bash
npm run dev
```

Perintah di atas akan menjalankan:
- **Express Backend**: `http://localhost:5000`
- **React Frontend**: `http://localhost:5173`

Vite disetup dengan proxy otomatis mengarah ke `http://localhost:5000/api` sehingga tidak ada kendala CORS pada mode development.
