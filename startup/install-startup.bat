@echo off
chcp 65001 >nul
title Установка автозагрузки
color 0A

echo ========================================
echo    ⚡ Установка в автозагрузку
echo ========================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if not exist "%STARTUP_FOLDER%" (
    echo [ОШИБКА] Папка автозагрузки не найдена!
    pause
    exit /b 1
)

:: Получаем текущую папку проекта
set "PROJECT_FOLDER=%~dp0.."
cd /d "%PROJECT_FOLDER%"
set "PROJECT_FOLDER=%CD%"

:: Создаем VBS скрипт для скрытого запуска
set "VBS_FILE=%TEMP%\start_server.vbs"
(
    echo Set WshShell = CreateObject("WScript.Shell"^)
    echo WshShell.Run """node"" ""%PROJECT_FOLDER%\server.js""", 0, False
    echo Set WshShell = Nothing
) > "%VBS_FILE%"

:: Создаем ярлык в автозагрузке
set "SHORTCUT_FILE=%STARTUP_FOLDER%\LocalFileShare.lnk"

powershell -Command "$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%SHORTCUT_FILE%'); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '%VBS_FILE%'; $Shortcut.WorkingDirectory = '%PROJECT_FOLDER%'; $Shortcut.Save()"

if %errorlevel% neq 0 (
    echo [ОШИБКА] Создания ярлыка!
    pause
    exit /b 1
)

echo.
echo [ГОТОВО] Автозагрузка установлена!
echo.
echo Сервер будет запускаться при старте Windows
echo.
pause