@echo off
chcp 65001 >nul
title Установка Local File Share
color 0E

echo ========================================
echo    📁 Local File Share - УСТАНОВКА
echo ========================================
echo.

:: 1. Проверяем Node.js
echo [1/4] Проверка Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo.
    echo Скачайте: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [ГОТОВО] Node.js найден
echo.

:: 2. Устанавливаем зависимости
echo [2/4] Установка зависимостей...
call npm install express multer cors
echo [ГОТОВО] Зависимости установлены
echo.

:: 3. Создаем папку uploads
echo [3/4] Создание папки для файлов...
if not exist "uploads" mkdir uploads
echo [ГОТОВО] Папка создана
echo.

:: 4. Предлагаем установить автозагрузку
echo [4/4] Настройка автозагрузки
echo.
choice /C YN /M "Установить автозапуск при старте Windows"
if %errorlevel%==1 (
    call startup\install-startup.bat
)

echo.
echo ========================================
echo    ✅ УСТАНОВКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo Запустите: start-server.bat
echo.
pause