@echo off
chcp 65001 >nul
title AnyCtrl 控制面板 - 一键启动

cd /d "%~dp0"

echo ==========================================
echo  AnyCtrl 控制面板 - 一键启动
echo    - Mock 后端 : http://localhost:3000
echo    - 前端 H5   : http://localhost:8080
echo ==========================================
echo.

REM 1. 安装 mock server 依赖（仅首次）
if not exist "server\node_modules" (
    echo [1/4] 首次运行，安装 mock server 依赖...
    cd server
    call npm install
    if errorlevel 1 goto fail
    cd ..
) else (
    echo [1/4] mock server 依赖已就绪
)

REM 2. 构建 H5
if /i "%1"=="watch" goto build_ok
if exist "dist\index.html" goto build_ok
echo [2/4] 首次运行，构建 H5...
call pnpm build:h5
if errorlevel 1 goto fail
:build_ok
echo [2/4] H5 dist 已就绪

REM 3. 启动 Mock 服务（用 PowerShell 新窗口，避免 cmd 编码问题）
echo.
echo [3/4] 启动 Mock 后端 :3000 ...
start "AnyCtrl-LocalBackend" powershell -NoExit -Command "node '%~dp0server\local-server.js'"

REM 4. 启动 H5 静态服务器
echo [4/4] 启动前端 H5 :8080 ...
if /i "%1"=="watch" (
    start "AnyCtrl-Frontend-Dev" powershell -NoExit -Command "pnpm dev:h5"
) else (
    start "AnyCtrl-Frontend" powershell -NoExit -Command "Set-Location '%~dp0dist'; npx --yes http-server -p 8080 -a 0.0.0.0 -c-1"
)

ping 127.0.0.1 -n 4 >nul

echo.
echo ============================================
echo  全部已启动！
echo.
echo    前端: http://localhost:8080
echo    后端: http://localhost:3000
echo.
echo  关闭：手动关闭命令行窗口 AnyCtrl-LocalBackend / AnyCtrl-Frontend
echo  故障注入：set MOCK_TRIGGER_FAIL=4001 && node server\local-server.js
echo.
echo  按任意键退出（不会关闭后台服务）
echo ============================================
pause >nul
exit /b 0

:fail
echo.
echo [错误] 启动失败
pause >nul
exit /b 1
