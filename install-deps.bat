@echo off
chcp 65001 >nul
title Установка зависимостей
color 0E

echo ========================================
echo    📦 Установка зависимостей проекта
echo ========================================
echo.

:: Проверяем Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo.
    echo Скачайте Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Устанавливаем зависимости
echo [УСТАНОВКА] Зависимостей...
call npm install express multer cors

if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Ошибка установки!
    echo.
    pause
    exit /b 1
)

echo.
echo [ГОТОВО] Зависимости установлены!
echo.
echo Теперь запустите: start-server.bat
echo.
pause