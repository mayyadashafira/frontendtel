# Telventory Systems Frontend

Frontend untuk **Telventory Systems** yang dibangun menggunakan **React** dan **Vite**. Aplikasi ini menyediakan antarmuka untuk manajemen inventaris aset dengan autentikasi, dashboard, chatbot AI, dan sistem Role-Based Access Control (RBAC).

## 🚀 Features

- User Authentication
- Role-Based Access Control (Superuser, Admin, User)
- Asset Management
- Dashboard & Analytics
- AI Chatbot (Tel AI)
- CSV Import & Export
- PDF Report

---

## 🛠 Tech Stack

- React
- Vite
- JavaScript
- Axios
- React Router
- Tailwind CSS

---

## 📂 Project Structure

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── context/
├── assets/
└── App.jsx
```

---

## ⚙️ Requirements

- Node.js 18+
- npm
- Telventory Backend (FastAPI)

---

## 🔧 Installation

Clone repository

```bash
git clone <repository-url>
cd kptel
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Frontend akan berjalan di

```
http://localhost:5173
```

---

## 🔗 Backend Connection

Pastikan backend Telventory sudah berjalan.

Default Backend URL

```
http://localhost:8787
```

Jika menggunakan URL atau port yang berbeda, salin `.env.example` menjadi `.env` lalu ubah konfigurasi:

```env
VITE_BACKEND_URL=http://localhost:8787
```

---

## 👥 User Roles

| Role | Permission |
|------|------------|
| Superuser | Full Access |
| Admin | Manage Users & Assets |
| User | Read Only |

---

## 📋 Main Features

- User Login & Registration
- Dashboard Summary
- Asset CRUD
- CSV Import
- CSV Export
- PDF Report
- AI Chatbot
- User Management

---

## 📁 Services

```text
src/services/
├── apiClient.js
├── authService.js
├── dashboardService.js
├── telAiService.js
├── createCrudService.js
└── *AssetService.js
```

---

## 🔌 API Integration

Frontend berkomunikasi dengan backend melalui REST API.

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Authentication |
| `/api/users/*` | User Management |
| `/api/assets/*` | Asset Management |
| `/api/dashboard/*` | Dashboard |
| `/api/tel-ai/*` | AI Chatbot |
| `/api/reports/*` | PDF Reports |

---

## 🤖 AI Chatbot

Tel AI menggunakan backend sebagai perantara untuk:

- Groq LLM
- Retrieval-Augmented Generation (RAG)
- Automatic Data Masking

---

## 📄 License

This project is developed for **Telventory Systems**.