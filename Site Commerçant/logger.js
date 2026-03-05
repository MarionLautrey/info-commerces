const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Format personnalisé
let logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

// Logger
let logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    
// Logs d'action
    new transports.File({ 
      filename: 'logs/action.log', 
      level: 'info', 
      format: combine(
        format((info) => info.level === 'info' ? info : false)(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),

// Logs d'erreur
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error', 
      format: combine(
        format((info) => info.level === 'error' ? info : false)(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
  ],
});

// Fonction pour récupérer l'IP 
logger.getIP = function(req) {
  return req?.headers['x-forwarded-for']?.split(',').shift() || req?.connection?.remoteAddress|| req?.ip || 'unknown';};

module.exports = logger;

// Ce code appartient à la société IDEAL SOLUTIONS