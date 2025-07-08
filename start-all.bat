@echo off
REM 一键启动后端和前端服务
start cmd /k "cd backend && node index.js"
start cmd /k "cd frontend && npm run dev" 