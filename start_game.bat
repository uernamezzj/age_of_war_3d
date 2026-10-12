@echo off
chcp 936 >nul
title 战争进化史 3D - 本地启动服务
cd /d "%~dp0"

echo ===================================================
echo     战争进化史 3D (Age of War 3D) 启动器
echo ===================================================
echo.
echo 正在检查 Python 运行环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 并添加到 PATH。
    pause
    exit /b 1
)

echo 正在后台启动本地 HTTP 服务 (端口: 8080)...
start /b "" python -m http.server 8080 >nul 2>&1

timeout /t 1 >nul
echo 正在打开默认浏览器进入游戏...
start "" http://localhost:8080/index.html

echo.
echo ===================================================
echo 游戏已成功启动！
echo 访问地址: http://localhost:8080/index.html
echo 如需关闭服务，直接关闭本命令行窗口即可。
echo ===================================================
echo.
pause
