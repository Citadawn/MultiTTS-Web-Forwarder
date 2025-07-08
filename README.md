# MultiTTS-Web-Forwarder

## MultiTTS 网页转发器

---

## 项目简介 | Project Introduction
MultiTTS 网页转发器是一个前后端分离的全栈应用，前端基于 Vue3 + Vite，后端基于 Node.js。该项目用于多通道 TTS（文本转语音）请求的网页转发和管理，适合需要统一管理和分发 TTS 服务的场景。

MultiTTS-Web-Forwarder is a full-stack application with a separated frontend (Vue3 + Vite) and backend (Node.js). It is designed for forwarding and managing multi-channel TTS (Text-to-Speech) requests via a web interface, suitable for scenarios requiring unified TTS service management and dispatching.

---

## 目录结构 | Project Structure
```
.
├── backend/      # 后端服务 Backend Service (Node.js/Express)
├── frontend/     # 前端项目 Frontend Project (Vue3/Vite)
├── start-all.bat # 一键启动脚本 Startup Script
├── README.md
└── LICENSE
```

---

## 快速开始 | Quick Start

### 1. 克隆项目 | Clone the repository
```bash
git clone https://github.com/你的用户名/MultiTTS-Web-Forwarder.git
cd MultiTTS-Web-Forwarder
```

### 2. 安装依赖 | Install dependencies

#### 前端 | Frontend
```bash
cd frontend
npm install
```

#### 后端 | Backend
```bash
cd ../backend
npm install
```

### 3. 启动项目 | Start the project

#### 启动前端 | Start Frontend
```bash
cd frontend
npm run dev
```

#### 启动后端 | Start Backend
```bash
cd backend
npm start
```

#### 或使用一键启动脚本（Windows）| Or use the startup script (Windows)
```bash
./start-all.bat
```

---

## 环境变量 | Environment Variables
如有需要，请在 `backend/` 和 `frontend/` 目录下分别创建 `.env` 文件，并参考 `.env.example`（如有）。
If needed, create `.env` files in both `backend/` and `frontend/` directories. Refer to `.env.example` if available.

---

## 主要依赖 | Main Dependencies
- 前端 | Frontend: Vue3, Vite
- 后端 | Backend: Node.js, Express

---

## 许可证 | License
本项目采用 MIT License，详见 LICENSE 文件。
This project is licensed under the MIT License. See LICENSE for details.

---

## 联系方式 | Contact
如有问题请提 Issue，或通过 GitHub 联系作者。
For questions, please open an Issue or contact the author via GitHub. 