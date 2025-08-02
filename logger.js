const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class RequestLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, 'logs');
    this.logToFile = options.logToFile !== false; // Default true
    this.logToConsole = options.logToConsole !== false; // Default true
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = options.maxLogFiles || 5;
    this.logOutgoingRequests = options.logOutgoingRequests !== false; // Default true
    
    // Create logs directory if it doesn't exist
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.currentLogFile = this.logToFile ? path.join(this.logDir, `requests-${this.getDateString()}.log`) : null;
    
    // Initialize outgoing request logging
    if (this.logOutgoingRequests) {
      this.initOutgoingRequestLogging();
    }
  }

  getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  shouldSkipLogging(req) {
    // Skip logging for static files and health checks
    const skipPaths = [
      '/favicon.ico',
      '/assets/',
      '.css',
      '.js',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.ico',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot'
    ];
    
    return skipPaths.some(path => req.url.includes(path));
  }

  sanitizeForLog(data, maxLength = 10_000) {
    if (!data) return data;
    
    let sanitized = data;
    
    // If it's an object, stringify it
    if (typeof data === 'object') {
      try {
        sanitized = JSON.stringify(data, null, 2);
      } catch (error) {
        sanitized = '[Object - JSON stringify failed]';
      }
    }
    
    // Truncate if too long
    if (typeof sanitized === 'string' && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
    }
    
    // Mask sensitive data
    // if (typeof sanitized === 'string') {
    //   sanitized = sanitized.replace(/(password|token|key|secret|credential)["']?\s*:\s*["']?[^"',\s}]+/gi, '$1": "[MASKED]"');
    //   sanitized = sanitized.replace(/(authorization|cookie):\s*[^\r\n]+/gi, '$1: [MASKED]');
    // }
    
    return sanitized;
  }

  rotateLogFile() {
    if (!this.logToFile || !this.currentLogFile) return;
    
    try {
      // Check if current log file is too large
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size > this.maxLogSize) {
          // Rename current file with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
          fs.renameSync(this.currentLogFile, rotatedFile);
          
          // Clean up old log files
          this.cleanupOldLogs();
        }
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  cleanupOldLogs() {
    if (!this.logToFile) return;
    
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('requests-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // Keep only the newest files
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error(`Error deleting old log file ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  writeToFile(logEntry) {
    if (!this.logToFile || !this.currentLogFile) return;
    
    try {
      this.rotateLogFile();
      fs.appendFileSync(this.currentLogFile, logEntry + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  initOutgoingRequestLogging() {
    const self = this;
    
    // Patch HTTP module
    const originalHttpRequest = http.request;
    http.request = function(options, callback) {
      const startTime = Date.now();
      const req = originalHttpRequest.call(this, options, callback);
      
      self.logOutgoingRequest('HTTP', options, req, startTime);
      return req;
    };
    
    // Patch HTTPS module
    const originalHttpsRequest = https.request;
    https.request = function(options, callback) {
      const startTime = Date.now();
      const req = originalHttpsRequest.call(this, options, callback);
      
      self.logOutgoingRequest('HTTPS', options, req, startTime);
      return req;
    };
  }

  logOutgoingRequest(protocol, options, req, startTime) {
    const self = this;
    
    // Extract request details
    const url = typeof options === 'string' ? options : 
                options.href || 
                `${protocol.toLowerCase()}://${options.hostname || options.host}${options.path || '/'}`;
    
    const method = options.method || 'GET';
    const headers = options.headers || {};
    
    // Log request start
    const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Capture request body
    let requestBody = '';
    const originalWrite = req.write.bind(req);
    const originalEnd = req.end.bind(req);
    
    req.write = function(chunk, encoding) {
      if (chunk) {
        requestBody += chunk.toString();
      }
      return originalWrite(chunk, encoding);
    };
    
    req.end = function(chunk, encoding) {
      if (chunk) {
        requestBody += chunk.toString();
      }
      return originalEnd(chunk, encoding);
    };
    
    if (this.logToConsole) {
      console.log(`\x1b[36m[${this.formatTimestamp()}] OUTGOING ${method} ${url} (ID: ${requestId})\x1b[0m`);
    }
    
    // Track response
    req.on('response', (res) => {
      const responseTime = Date.now() - startTime;
      
      let responseBody = '';
      const originalOn = res.on.bind(res);
      
      // Capture response data
      res.on = function(event, listener) {
        if (event === 'data') {
          const originalListener = listener;
          const wrappedListener = function(chunk) {
            responseBody += chunk.toString();
            return originalListener(chunk);
          };
          return originalOn(event, wrappedListener);
        }
        return originalOn(event, listener);
      };
      
      res.on('end', () => {
        self.logOutgoingResponse(requestId, {
          protocol,
          method,
          url,
          requestHeaders: headers,
          requestBody: self.sanitizeForLog(requestBody, 10_000),
          responseTime,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          responseHeaders: res.headers,
          responseBody: self.sanitizeForLog(responseBody, 10_000)
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      self.logOutgoingError(requestId, {
        protocol,
        method,
        url,
        requestHeaders: headers,
        requestBody: self.sanitizeForLog(requestBody, 10_000),
        responseTime,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
    });
  }

  logOutgoingResponse(requestId, details) {
    const timestamp = this.formatTimestamp();
    
    const logEntry = {
      type: 'OUTGOING_REQUEST',
      timestamp,
      requestId,
      protocol: details.protocol,
      method: details.method,
      url: details.url,
      request: {
        headers: this.sanitizeForLog(details.requestHeaders, 10_000),
        body: details.requestBody || ''
      },
      response: {
        statusCode: details.statusCode,
        statusMessage: details.statusMessage,
        responseTime: `${details.responseTime}ms`,
        headers: this.sanitizeForLog(details.responseHeaders, 10_000),
        body: details.responseBody
      }
    };
    
    // Console logging with colors
    if (this.logToConsole) {
      const statusColor = details.statusCode >= 400 ? '\x1b[31m' : 
                          details.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      
      console.log(`${statusColor}[${timestamp}] OUTGOING ${details.method} ${details.url} - ${details.statusCode} (${details.responseTime}ms) (ID: ${requestId})${resetColor}`);
      
      if (details.statusCode >= 400) {
        console.log(`  Error Response: ${details.responseBody?.substring(0, 200) || 'No body'}`);
      }
    }
    
    // File logging
    this.writeToFile(JSON.stringify(logEntry, null, 2) + '\n' + '~'.repeat(80));
  }

  logOutgoingError(requestId, details) {
    const timestamp = this.formatTimestamp();
    
    const logEntry = {
      type: 'OUTGOING_REQUEST_ERROR',
      timestamp,
      requestId,
      protocol: details.protocol,
      method: details.method,
      url: details.url,
      request: {
        headers: this.sanitizeForLog(details.requestHeaders, 10_000),
        body: details.requestBody || ''
      },
      error: details.error,
      responseTime: `${details.responseTime}ms`
    };
    
    // Console logging
    if (this.logToConsole) {
      console.error(`\x1b[31m[${timestamp}] OUTGOING ERROR ${details.method} ${details.url} - ${details.error.message} (${details.responseTime}ms) (ID: ${requestId})\x1b[0m`);
      if (details.requestBody) {
        console.error(`  Request Body: ${details.requestBody?.substring(0, 200) || 'No body'}`);
      }
    }
    
    // File logging
    this.writeToFile(JSON.stringify(logEntry, null, 2) + '\n' + '#'.repeat(80));
  }

  logRequest(req, res, responseTime, responseData) {
    if (this.shouldSkipLogging(req)) return;
    
    const timestamp = this.formatTimestamp();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const user = req.session?.user?.username || 'Anonymous';
    
    // Request data
    const requestData = {
      timestamp,
      method: req.method,
      url: req.url,
      ip,
      userAgent,
      user,
      headers: this.sanitizeForLog(req.headers, 10_000),
      query: this.sanitizeForLog(req.query, 10_000),
      body: this.sanitizeForLog(req.body, 10_000),
      params: this.sanitizeForLog(req.params, 10_000)
    };
    
    // Response data
    const responseInfo = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      headers: this.sanitizeForLog(res.getHeaders(), 10_000),
      data: this.sanitizeForLog(responseData, 10_000)
    };
    
    // Create log entry
    const logEntry = {
      type: 'REQUEST',
      timestamp,
      request: requestData,
      response: responseInfo
    };
    
    // Console logging with colors
    if (this.logToConsole) {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      
      console.log(`${statusColor}[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms) - ${user}${resetColor}`);
      
      if (res.statusCode >= 400 && responseData) {
        console.log(`  Error: ${this.sanitizeForLog(responseData, 10_000)}`);
      }
    }
    
    // File logging
    this.writeToFile(JSON.stringify(logEntry, null, 2) + '\n' + '-'.repeat(80));
  }

  logError(error, req = null, additional = {}) {
    const timestamp = this.formatTimestamp();
    
    const errorEntry = {
      type: 'ERROR',
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      request: req ? {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection?.remoteAddress,
        user: req.session?.user?.username || 'Anonymous'
      } : null,
      additional
    };
    
    if (this.logToConsole) {
      console.error(`\x1b[31m[${timestamp}] ERROR: ${error.message}\x1b[0m`);
      if (req) {
        console.error(`  Request: ${req.method} ${req.url}`);
      }
    }
    
    this.writeToFile(JSON.stringify(errorEntry, null, 2) + '\n' + '='.repeat(80));
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      let responseData = null;
      
      // Capture response data
      const originalSend = res.send;
      res.send = function(data) {
        responseData = data;
        originalSend.call(this, data);
      };
      
      const originalJson = res.json;
      res.json = function(data) {
        responseData = data;
        originalJson.call(this, data);
      };
      
      // Log when response finishes
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.logRequest(req, res, responseTime, responseData);
      });
      
      next();
    };
  }

  // Get log statistics
  getStats() {
    if (!this.logToFile) {
      return { error: 'File logging is disabled' };
    }
    
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('requests-') && file.endsWith('.log'))
        .map(file => {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified - a.modified);
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Count different types of logs from the latest file
      let incomingRequests = 0;
      let outgoingRequests = 0;
      let errors = 0;
      
      if (files.length > 0) {
        try {
          const latestLogPath = path.join(this.logDir, files[0].name);
          const logContent = fs.readFileSync(latestLogPath, 'utf8');
          const logEntries = logContent.split(/[-~#]{80}/);
          
          logEntries.forEach(entry => {
            if (entry.trim()) {
              try {
                const parsed = JSON.parse(entry.trim());
                switch (parsed.type) {
                  case 'REQUEST':
                    incomingRequests++;
                    break;
                  case 'OUTGOING_REQUEST':
                  case 'OUTGOING_REQUEST_ERROR':
                    outgoingRequests++;
                    break;
                  case 'ERROR':
                    errors++;
                    break;
                }
              } catch (e) {
                // Ignore parsing errors for individual entries
              }
            }
          });
        } catch (e) {
          // Ignore errors reading log file
        }
      }
      
      return {
        logDir: this.logDir,
        totalFiles: files.length,
        totalSize,
        latestFile: files[0]?.name || 'None',
        outgoingRequestsEnabled: this.logOutgoingRequests,
        stats: {
          incomingRequests,
          outgoingRequests,
          errors
        },
        files: files
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = RequestLogger;
