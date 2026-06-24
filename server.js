const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 3000;

// Настройка CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let originalName = file.originalname;
        
        try {
            const buffer = Buffer.from(originalName, 'binary');
            originalName = buffer.toString('utf8');
        } catch (e) {
            // Игнорируем ошибки
        }
        
        originalName = originalName.replace(/[^\w\sа-яА-ЯёЁ.,()\-_]/g, '');
        
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const finalName = `${timestamp}-${nameWithoutExt}${ext}`;
        
        console.log(`📝 Имя файла: ${originalName} -> ${finalName}`);
        
        cb(null, finalName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Статические файлы
app.use(express.static('public'));

// Раздача файлов с правильной кодировкой
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        const filename = path.basename(filePath);
        const displayName = filename.replace(/^\d+-/, '');
        const encodedName = encodeURIComponent(displayName);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// 📦 Скачивание всех файлов
app.get('/download-all', (req, res) => {
    const uploadDir = './uploads';
    
    if (!fs.existsSync(uploadDir)) {
        return res.status(404).json({ error: 'Папка с файлами не найдена' });
    }
    
    let files;
    try {
        files = fs.readdirSync(uploadDir);
    } catch (error) {
        console.error('Ошибка чтения папки:', error);
        return res.status(500).json({ error: 'Ошибка чтения папки' });
    }
    
    const fileList = files.filter(file => {
        const filePath = path.join(uploadDir, file);
        try {
            return fs.statSync(filePath).isFile();
        } catch {
            return false;
        }
    });
    
    if (fileList.length === 0) {
        return res.status(404).json({ error: 'Нет файлов для скачивания' });
    }
    
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const archiveName = `files_${dateStr}.zip`;
    
    console.log(`📦 Создание архива: ${archiveName} (${fileList.length} файлов)`);
    
    try {
        const zip = new AdmZip();
        let addedFiles = 0;
        
        fileList.forEach(filename => {
            const filePath = path.join(uploadDir, filename);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    const displayName = filename.replace(/^\d+-/, '');
                    zip.addLocalFile(filePath, '', displayName);
                    addedFiles++;
                    console.log(`  📎 Добавлен: ${displayName}`);
                }
            } catch (error) {
                console.warn(`⚠️ Не удалось добавить файл: ${filename}`, error.message);
            }
        });
        
        if (addedFiles === 0) {
            console.error('❌ Не удалось добавить ни одного файла в архив');
            return res.status(500).json({ error: 'Не удалось создать архив' });
        }
        
        const zipBuffer = zip.toBuffer();
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(archiveName)}`);
        res.setHeader('Content-Length', zipBuffer.length);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        res.send(zipBuffer);
        
        console.log(`✅ Архив создан: ${archiveName} (${addedFiles} файлов, ${zipBuffer.length} байт)`);
        
    } catch (error) {
        console.error('❌ Ошибка создания архива:', error);
        return res.status(500).json({ error: 'Ошибка создания архива: ' + error.message });
    }
});

// Получить список файлов
app.get('/files', (req, res) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }
    
    try {
        const files = fs.readdirSync(uploadDir)
            .filter(filename => {
                const filePath = path.join(uploadDir, filename);
                try {
                    return fs.statSync(filePath).isFile();
                } catch {
                    return false;
                }
            })
            .map(filename => {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                
                const displayName = filename.replace(/^\d+-/, '');
                
                return {
                    name: displayName,
                    originalName: filename,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    uploadedAt: stats.mtime,
                    url: `/uploads/${encodeURIComponent(filename)}`
                };
            });
        
        files.sort((a, b) => b.uploadedAt - a.uploadedAt);
        res.json(files);
    } catch (error) {
        console.error('Ошибка чтения файлов:', error);
        res.status(500).json({ error: 'Ошибка чтения файлов' });
    }
});

// Загрузка файлов
app.post('/upload', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Ошибка загрузки:', err);
            return res.status(500).json({ error: 'Ошибка загрузки файла' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        try {
            const displayName = req.file.filename.replace(/^\d+-/, '');
            console.log(`✅ Загружен файл: ${displayName}`);
            
            res.json({
                success: true,
                message: 'Файл успешно загружен',
                file: {
                    name: displayName,
                    size: req.file.size,
                    sizeFormatted: formatFileSize(req.file.size),
                    url: `/uploads/${encodeURIComponent(req.file.filename)}`
                }
            });
        } catch (error) {
            console.error('Ошибка обработки файла:', error);
            res.status(500).json({ error: 'Ошибка обработки файла' });
        }
    });
});

// Удаление файла
app.delete('/files/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join('./uploads', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Удален файл: ${filename}`);
            res.json({ success: true, message: 'Файл удален' });
        } else {
            res.status(404).json({ error: 'Файл не найден' });
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
        res.status(500).json({ error: 'Ошибка удаления файла' });
    }
});

// Очистка всех файлов
app.delete('/files', (req, res) => {
    const uploadDir = './uploads';
    try {
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            let deletedCount = 0;
            files.forEach(file => {
                const filePath = path.join(uploadDir, file);
                try {
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                } catch (e) {
                    // Игнорируем ошибки
                }
            });
            console.log(`🗑️ Удалено ${deletedCount} файлов`);
            res.json({ success: true, message: `Удалено ${deletedCount} файлов` });
        } else {
            res.json({ success: true, message: 'Папка пуста' });
        }
    } catch (error) {
        console.error('Ошибка очистки:', error);
        res.status(500).json({ error: 'Ошибка очистки' });
    }
});

// Форматирование размера
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Сервер запущен!');
    console.log('=' .repeat(50));
    console.log('✅ Поддержка кириллицы включена');
    console.log('✅ Максимальный размер файла: 100MB');
    console.log('✅ Скачивание всех файлов: adm-zip');
    console.log('=' .repeat(50));
    
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        });
    });
    
    if (addresses.length > 0) {
        console.log('\n📱 Подключитесь с других устройств:');
        addresses.forEach(ip => {
            console.log(`   http://${ip}:${PORT}`);
        });
    }
    
    console.log(`\n💻 На этом устройстве: http://localhost:${PORT}`);
    console.log('=' .repeat(50));
    console.log('✨ Нажмите Ctrl+C для остановки\n');
});