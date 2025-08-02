const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const RequestLogger = require('./logger');
const app = express();

const PORT = process.env.PORT || 3000;

// load firebase credentials from serviceAccount.json if exists
const parentDir = path.join(__dirname, '..');
const credPath = path.join(parentDir, 'serviceAccount.json');
if (fs.existsSync(credPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(credPath))
  });
} else {
  console.warn('serviceAccount.json not found. Firebase features will be disabled.');
}

const remoteConfig = admin.remoteConfig ? admin.remoteConfig() : null;

// Initialize request logger
const logger = new RequestLogger({
  logToFile: true,
  logToConsole: true,
  logDir: path.join(__dirname, 'logs'),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Add request logging middleware
app.use(logger.middleware());

// Serve static files from the built Angular project
app.use('/assets', express.static(path.join(__dirname, 'firebase-remote-config-ui/dist/firebase-remote-config-ui/browser/assets')));
app.use(express.static(path.join(__dirname, 'firebase-remote-config-ui/dist/firebase-remote-config-ui/browser')));

// Legacy static files for backward compatibility
app.use('/public', express.static(path.join(__dirname, 'public')));

// simplistic user roles
const users = {
  admin: { password: 'admin', role: 'admin' },
  viewer: { password: 'viewer', role: 'viewer' }
};

function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  
  // For API calls, return JSON error instead of redirect
  if (req.path.startsWith('/api')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  
  // For API calls, return JSON error instead of plain text
  if (req.path.startsWith('/api')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  res.status(403).send('Forbidden');
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    req.session.user = user;
    res.status(200).json({ message: 'Login successful', role: user.role });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Отримання конкретної версії конфігурації (повинно бути перед загальним /api/template)
app.get('/api/template/version/:versionNumber', ensureAuth, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const versionNumber = req.params.versionNumber;
    
    if (!versionNumber) {
      return res.status(400).json({ error: 'versionNumber is required' });
    }
    
    const template = await remoteConfig.getTemplate({ versionNumber: parseInt(versionNumber) });
    res.status(200).json(template);
  } catch (error) {
    console.error('Error getting template version:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/template', ensureAuth, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  try {
    const { versionNumber } = req.query;
    let template;
    
    if (versionNumber) {
      // Отримання конкретної версії
      template = await remoteConfig.getTemplate({ versionNumber: parseInt(versionNumber) });
    } else {
      // Отримання поточної версії
      template = await remoteConfig.getTemplate();
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update', ensureAuth, ensureAdmin, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { validateOnly } = req.query;
    const templateData = req.body;
    
    // Отримуємо поточний шаблон
    const currentTemplate = await remoteConfig.getTemplate();
    
    // Оновлюємо поля з запиту
    if (templateData.parameters) currentTemplate.parameters = templateData.parameters;
    if (templateData.parameterGroups) currentTemplate.parameterGroups = templateData.parameterGroups;
    if (templateData.conditions) currentTemplate.conditions = templateData.conditions;
    
    // Валідуємо шаблон
    await remoteConfig.validateTemplate(currentTemplate);
    
    if (validateOnly === 'true') {
      // Тільки валідація, не публікуємо
      res.status(200).json({ message: 'Template validation successful', template: currentTemplate });
    } else {
      // Публікуємо шаблон
      const publishedTemplate = await remoteConfig.publishTemplate(currentTemplate);
      res.status(200).json({ message: 'Template updated successfully', template: publishedTemplate });
    }
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT метод для сумісності з frontend
app.put('/api/template', ensureAuth, ensureAdmin, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { validateOnly } = req.query;
    const templateData = req.body;
    
    // Отримуємо поточний шаблон
    const currentTemplate = await remoteConfig.getTemplate();
    
    // Оновлюємо поля з запиту
    if (templateData.parameters) currentTemplate.parameters = templateData.parameters;
    if (templateData.parameterGroups) currentTemplate.parameterGroups = templateData.parameterGroups;
    if (templateData.conditions) currentTemplate.conditions = templateData.conditions;
    
    // Валідуємо шаблон
    await remoteConfig.validateTemplate(currentTemplate);
    
    if (validateOnly === 'true') {
      // Тільки валідація, не публікуємо
      res.status(200).json(currentTemplate);
    } else {
      // Публікуємо шаблон
      const publishedTemplate = await remoteConfig.publishTemplate(currentTemplate);
      res.status(200).json(publishedTemplate);
    }
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/versions', ensureAuth, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { pageSize, pageToken, endVersionNumber, startTime, endTime } = req.query;
    
    const options = {};
    if (pageSize) options.pageSize = parseInt(pageSize);
    if (pageToken) options.pageToken = pageToken;
    if (endVersionNumber) options.endVersionNumber = parseInt(endVersionNumber);
    if (startTime) options.startTime = startTime;
    if (endTime) options.endTime = endTime;
    
    // Якщо параметри не задані, встановлюємо дефолтні
    if (!options.pageSize) options.pageSize = 30;
    
    const versionsResponse = await remoteConfig.listVersions(options);
    
    // Повертаємо структуру, сумісну з frontend
    res.status(200).json({
      versions: versionsResponse.versions || [],
      nextPageToken: versionsResponse.nextPageToken
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rollback', ensureAuth, ensureAdmin, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { versionNumber } = req.body;
    
    if (!versionNumber) {
      return res.status(400).json({ error: 'versionNumber is required' });
    }
    
    const rolledBackTemplate = await remoteConfig.rollback(parseInt(versionNumber));
    res.status(200).json({ 
      message: 'Rollback successful',
      template: rolledBackTemplate 
    });
  } catch (error) {
    console.error('Error during rollback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Додаткові API методи згідно з специфікацією

// Завантаження дефолтних значень у різних форматах
app.get('/api/downloadDefaults', ensureAuth, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { format = 'JSON' } = req.query;
    const template = await remoteConfig.getTemplate();
    
    let contentType;
    let fileExtension;
    let data;
    
    switch (format.toUpperCase()) {
      case 'JSON':
        contentType = 'application/json';
        fileExtension = 'json';
        data = JSON.stringify(template.parameters || {}, null, 2);
        break;
      case 'XML':
        contentType = 'application/xml';
        fileExtension = 'xml';
        data = convertToXML(template.parameters || {});
        break;
      case 'PLIST':
        contentType = 'application/x-plist';
        fileExtension = 'plist';
        data = convertToPLIST(template.parameters || {});
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format. Use JSON, XML, or PLIST' });
    }
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="remote-config-defaults.${fileExtension}"`
    });
    
    res.status(200).json({
      contentType,
      data,
      extensions: []
    });
  } catch (error) {
    console.error('Error downloading defaults:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch API для клієнтів (спрощена версія)
app.post('/api/fetch', async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { appInstanceId, appId } = req.body;
    
    if (!appInstanceId || !appId) {
      return res.status(400).json({ error: 'appInstanceId and appId are required' });
    }
    
    const template = await remoteConfig.getTemplate();
    
    // Спрощена логіка - повертаємо всі параметри як entries
    const entries = {};
    if (template.parameters) {
      Object.keys(template.parameters).forEach(key => {
        const param = template.parameters[key];
        entries[key] = param.defaultValue?.value || '';
      });
    }
    
    res.status(200).json({
      entries,
      appName: appId,
      state: 'UPDATE',
      templateVersion: template.version?.versionNumber || 1,
      experimentDescriptions: [],
      personalizationMetadata: {},
      rolloutMetadata: []
    });
  } catch (error) {
    console.error('Error during fetch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Історія змін конфігурації
app.get('/api/history', ensureAuth, async (req, res) => {
  if (!remoteConfig) {
    return res.status(500).json({ error: 'Remote Config not initialized' });
  }
  
  try {
    const { pageSize = 300, pageToken, endVersionNumber, startTime, endTime } = req.query;
    
    const versions = await remoteConfig.listVersions({
      pageSize: parseInt(pageSize),
      pageToken,
      endVersionNumber: endVersionNumber ? parseInt(endVersionNumber) : undefined
    });
    
    // Фільтруємо по часу якщо вказано
    let filteredVersions = versions.versions || [];
    if (startTime || endTime) {
      filteredVersions = filteredVersions.filter(version => {
        const versionTime = new Date(version.updateTime);
        if (startTime && versionTime < new Date(startTime)) return false;
        if (endTime && versionTime > new Date(endTime)) return false;
        return true;
      });
    }
    
    res.status(200).json({
      versions: filteredVersions,
      nextPageToken: versions.nextPageToken
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Допоміжні функції для конвертації форматів
function convertToXML(parameters) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<parameters>\n';
  Object.keys(parameters).forEach(key => {
    const value = parameters[key].defaultValue?.value || '';
    xml += `  <parameter name="${key}">${escapeXML(value)}</parameter>\n`;
  });
  xml += '</parameters>';
  return xml;
}

function convertToPLIST(parameters) {
  let plist = '<?xml version="1.0" encoding="UTF-8"?>\n';
  plist += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
  plist += '<plist version="1.0">\n<dict>\n';
  Object.keys(parameters).forEach(key => {
    const value = parameters[key].defaultValue?.value || '';
    plist += `  <key>${key}</key>\n  <string>${escapeXML(value)}</string>\n`;
  });
  plist += '</dict>\n</plist>';
  return plist;
}

function escapeXML(str) {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Build management routes
app.get('/api/build/status', (req, res) => {
  const distPath = path.join(__dirname, 'firebase-remote-config-ui/dist/firebase-remote-config-ui/browser');
  const indexPath = path.join(distPath, 'index.html');
  
  try {
    const exists = fs.existsSync(indexPath);
    if (exists) {
      const stats = fs.statSync(indexPath);
      res.status(200).json({
        built: true,
        buildTime: stats.mtime,
        path: distPath
      });
    } else {
      res.status(200).json({
        built: false,
        message: 'Angular project not built. Run npm run build in firebase-remote-config-ui directory.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/build/info', (req, res) => {
  const projectPath = path.join(__dirname, 'firebase-remote-config-ui');
  const packageJsonPath = path.join(projectPath, 'package.json');
  const distPath = path.join(projectPath, 'dist/firebase-remote-config-ui/browser');
  
  try {
    let packageInfo = {};
    let buildInfo = {};
    
    // Read package.json
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageInfo = {
        name: packageJson.name,
        version: packageJson.version,
        scripts: packageJson.scripts,
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {})
      };
    }
    
    // Check build status
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      buildInfo = {
        built: true,
        buildTime: stats.mtime,
        size: stats.size
      };
      
      // Get build artifacts
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        buildInfo.artifacts = files.map(file => {
          const filePath = path.join(distPath, file);
          const fileStats = fs.statSync(filePath);
          return {
            name: file,
            size: fileStats.size,
            isDirectory: fileStats.isDirectory()
          };
        });
      }
    } else {
      buildInfo = {
        built: false,
        message: 'Project not built'
      };
    }
    
    res.status(200).json({
      project: packageInfo,
      build: buildInfo,
      paths: {
        project: projectPath,
        dist: distPath
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/build', (req, res) => {
  const distPath = path.join(__dirname, 'firebase-remote-config-ui/dist');
  
  try {
    if (fs.existsSync(distPath)) {
      // Recursively delete dist directory
      fs.rmSync(distPath, { recursive: true, force: true });
      res.status(200).json({
        success: true,
        message: 'Build artifacts cleaned successfully'
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No build artifacts to clean'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/build', async (req, res) => {
  const { spawn } = require('child_process');
  const projectPath = path.join(__dirname, 'firebase-remote-config-ui');
  
  try {
    // Check if npm is available and use correct command for Windows
    const isWindows = process.platform === 'win32';
    const npmCommand = isWindows ? 'npm.cmd' : 'npm';
    
    const buildProcess = spawn(npmCommand, ['run', 'build'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: isWindows // Add shell option for Windows
    });
    
    let output = '';
    let errorOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Build completed successfully',
          output: output
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Build failed',
          error: errorOutput,
          output: output
        });
      }
    });
    
    buildProcess.on('error', (error) => {
      res.status(500).json({
        success: false,
        message: 'Failed to start build process',
        error: error.message
      });
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Build process error',
      error: error.message
    });
  }
});

app.post('/api/install', async (req, res) => {
  const { spawn } = require('child_process');
  const projectPath = path.join(__dirname, 'firebase-remote-config-ui');
  
  try {
    const isWindows = process.platform === 'win32';
    const npmCommand = isWindows ? 'npm.cmd' : 'npm';
    
    const installProcess = spawn(npmCommand, ['install'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: isWindows // Add shell option for Windows
    });
    
    let output = '';
    let errorOutput = '';
    
    installProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    installProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({
          success: true,
          message: 'Dependencies installed successfully',
          output: output
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Installation failed',
          error: errorOutput,
          output: output
        });
      }
    });
    
    installProcess.on('error', (error) => {
      res.status(500).json({
        success: false,
        message: 'Failed to start installation process',
        error: error.message
      });
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Installation process error',
      error: error.message
    });
  }
});

app.get('/api/dev/status', (req, res) => {
  // Check if Angular dev server is running (usually on port 4200)
  const net = require('net');
  const devPort = 4200;
  
  const socket = new net.Socket();
  
  socket.setTimeout(1000);
  socket.on('connect', () => {
    socket.destroy();
    res.status(200).json({
      running: true,
      port: devPort,
      url: `http://localhost:${devPort}`
    });
  });
  
  socket.on('timeout', () => {
    socket.destroy();
    res.status(200).json({
      running: false,
      port: devPort,
      message: 'Development server not running'
    });
  });
  
  socket.on('error', () => {
    res.status(200).json({
      running: false,
      port: devPort,
      message: 'Development server not running'
    });
  });
  
  socket.connect(devPort, 'localhost');
});

// Logging API endpoints
app.get('/api/logs/stats', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const stats = logger.getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all log files
app.get('/api/logs/list', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({ files: [] });
    }
    
    const files = fs.readdirSync(logsDir)
      .filter(file => file.startsWith('requests-') && file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          downloadUrl: `/api/logs/download/${file}`
        };
      })
      .sort((a, b) => b.modified - a.modified);
    
    res.status(200).json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download specific log file
app.get('/api/logs/download/:filename', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    const filename = req.params.filename;
    
    const filePath = path.join(logsDir, filename);
    
    // Security check - ensure filename is safe
    if (!filename.startsWith('requests-') || !filename.endsWith('.log') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all log files
app.delete('/api/logs/all', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('requests-') && file.endsWith('.log'));
      
      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        fs.unlinkSync(filePath);
      });
      
      res.status(200).json({ 
        message: `Deleted ${files.length} log files`,
        deletedFiles: files
      });
    } else {
      res.status(200).json({ message: 'No log files to delete' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specific log file
app.delete('/api/logs/:filename', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    const filename = req.params.filename;
    
    const filePath = path.join(logsDir, filename);
    
    // Security check
    if (!filename.startsWith('requests-') || !filename.endsWith('.log') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    fs.unlinkSync(filePath);
    res.status(200).json({ message: `Log file ${filename} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get log entries with filtering
app.get('/api/logs/entries/:filename', ensureAuth, ensureAdmin, (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    const filename = req.params.filename;
    const { type, limit = 100 } = req.query;
    
    const filePath = path.join(logsDir, filename);
    
    // Security check
    if (!filename.startsWith('requests-') || !filename.endsWith('.log') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    const logContent = fs.readFileSync(filePath, 'utf8');
    const logEntries = logContent.split(/[-~#]{80}/)
      .map(entry => {
        if (entry.trim()) {
          try {
            return JSON.parse(entry.trim());
          } catch (e) {
            return null;
          }
        }
        return null;
      })
      .filter(entry => entry !== null);
    
    // Filter by type if specified
    let filteredEntries = logEntries;
    if (type) {
      const typeFilter = type.toUpperCase();
      filteredEntries = logEntries.filter(entry => {
        switch (typeFilter) {
          case 'INCOMING':
            return entry.type === 'REQUEST';
          case 'OUTGOING':
            return entry.type === 'OUTGOING_REQUEST' || entry.type === 'OUTGOING_REQUEST_ERROR';
          case 'ERRORS':
            return entry.type === 'ERROR' || entry.type === 'OUTGOING_REQUEST_ERROR';
          default:
            return entry.type === typeFilter;
        }
      });
    }
    
    // Limit results
    const limitedEntries = filteredEntries.slice(0, parseInt(limit));
    
    res.status(200).json({
      filename,
      totalEntries: logEntries.length,
      filteredEntries: filteredEntries.length,
      returnedEntries: limitedEntries.length,
      entries: limitedEntries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy routes (redirect to Angular app)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/login', (req, res) => {
  res.redirect('/');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/');
});

app.get('/versions', (req, res) => {
  res.redirect('/');
});

// Catch-all handler: send back Angular's index.html file for SPA routing
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'firebase-remote-config-ui/dist/firebase-remote-config-ui/browser/index.html');
  
  // Check if Angular build exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to legacy index.html or error page
    const legacyIndexPath = path.join(__dirname, 'public/index.html');
    if (fs.existsSync(legacyIndexPath)) {
      res.sendFile(legacyIndexPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Firebase Remote Config</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .info { background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #1976d2; }
                .commands { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0; }
                .links { margin: 20px 0; }
                .links a { display: inline-block; background: #1976d2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 5px; }
                .links a:hover { background: #1565c0; }
            </style>
        </head>
        <body>
            <h1>🔥 Firebase Remote Config</h1>
            
            <div class="info">
                <h3>📋 Angular Application Not Built</h3>
                <p>The Angular frontend needs to be built before it can be served. Please follow these steps:</p>
                
                <h4>Option 1: Build manually</h4>
                <div class="commands">
                    <code>cd firebase-remote-config-ui</code><br>
                    <code>npm install</code><br>
                    <code>npm run build</code>
                </div>
                
                <h4>Option 2: Use Admin Panel</h4>
                <p>Visit the admin panel to build and manage the project using the web interface.</p>
            </div>
            
            <div class="links">
                <a href="/admin">🔧 Open Admin Panel</a>
                <a href="/public/index.html">📄 Legacy Interface</a>
                <a href="/api/build/status">📊 Build Status API</a>
            </div>
            
            <h3>🛠️ Available Endpoints</h3>
            <ul>
                <li><strong>GET /admin</strong> - Build management interface</li>
                <li><strong>GET /api/build/status</strong> - Check build status</li>
                <li><strong>POST /api/build</strong> - Trigger build process</li>
                <li><strong>DELETE /api/build</strong> - Clean build artifacts</li>
                <li><strong>POST /api/install</strong> - Install dependencies</li>
                <li><strong>GET /api/dev/status</strong> - Check dev server status</li>
            </ul>
        </body>
        </html>
      `);
    }
  }
});

// Global error handler with logging
app.use((err, req, res, next) => {
  logger.logError(err, req, {
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  });
  
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(isDevelopment && { stack: err.stack })
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || Date.now().toString()
  });
});

// Handle 404 errors
app.use((req, res) => {
  logger.logError(new Error('Route not found'), req, {
    attemptedRoute: req.url
  });
  
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.url,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port http://localhost:${PORT}`);
  console.log(`Logging to: ${path.join(__dirname, 'logs')}`);
});