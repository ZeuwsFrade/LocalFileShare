const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск Local File Share Server...');

// Путь к проекту
const projectPath = __dirname;
const serverPath = path.join(projectPath, 'server.js');

// Проверяем наличие сервера
if (!fs.existsSync(serverPath)) {
    console.error('❌ Файл server.js не найден!');
    console.error(`   Путь: ${serverPath}`);
    process.exit(1);
}

// Запускаем сервер
const server = spawn('node', [serverPath], {
    cwd: projectPath,
    stdio: 'inherit',
    detached: true,  // Работает в фоне
    windowsHide: false // Показываем окно
});

server.on('error', (err) => {
    console.error('❌ Ошибка запуска сервера:', err.message);
});

server.on('close', (code) => {
    if (code !== 0) {
        console.log(`⚠️ Сервер завершил работу с кодом: ${code}`);
    }
});

console.log('✅ Сервер запущен!');
console.log('📱 Для остановки закройте окно консоли');

// Обработка закрытия окна
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    server.kill();
    process.exit(0);
});