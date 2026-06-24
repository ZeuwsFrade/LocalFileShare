@echo off
chcp 65001 >nul
title Удаление автозагрузки
color 0C

echo ========================================
echo    ❌ Удаление из автозагрузки
echo ========================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_FILE=%STARTUP_FOLDER%\LocalFileShare.lnk"

if exist "%SHORTCUT_FILE%" (
    del "%SHORTCUT_FILE%"
    echo [ГОТОВО] Ярлык удален
) else (
    echo [ИНФО] Ярлык не найден
)

set "VBS_FILE=%TEMP%\start_server.vbs"
if exist "%VBS_FILE%" (
    del "%VBS_FILE%"
    echo [ГОТОВО] Временный файл удален
)

echo.
echo Автозагрузка отключена.
echo.
pause