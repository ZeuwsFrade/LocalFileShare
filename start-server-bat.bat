@echo off
chcp 65001 >nul
title Local File Share Server
color 0A

echo ========================================
echo    📁 Local File Share Server
echo ========================================
echo.

:: Проверяем наличие Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo.
    echo Пожалуйста, установите Node.js с официального сайта:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Проверяем наличие package.json
if not exist "package.json" (
    echo [ОШИБКА] Файл package.json не найден!
    echo.
    echo Убедитесь, что вы запускаете этот файл из корня проекта.
    echo.
    pause
    exit /b 1
)

:: Проверяем установку зависимостей
if not exist "node_modules" (
    echo [УСТАНОВКА] Установка зависимостей...
    echo.
    call npm install
    echo.
)

:: Создаем папку uploads, если её нет
if not exist "uploads" (
    echo [СОЗДАНИЕ] Папки для файлов...
    mkdir uploads
    echo.
)

:: Запускаем сервер
echo [ЗАПУСК] Сервера...
echo.
echo ========================================
echo.

:: Используем node напрямую для стабильности
node server.js

:: Если сервер упал, показываем ошибку
if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Сервер завершил работу с ошибкой!
    echo.
    pause
)