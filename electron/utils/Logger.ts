import * as fs from 'fs';
import { app } from 'electron';
import * as path from 'path';

const isProd =  app.isPackaged
const initPath = process.platform === "win32" ?  app.getPath('userData') : process.resourcesPath;
const folderDirectory = isProd ? initPath : process.cwd()
const logDir = path.join(folderDirectory, 'logs');
const logFile = path.join(logDir, 'debug.log');

try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
} catch (e) {
    console.error(`Failed to create log directory: ${logDir}`, e);
}

const createNotif = (message :string, type : 'LOG' | 'WARN' | 'ERROR') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}][${type}] ${message}\n`;
    if(isProd) fs.appendFileSync(logFile, logMessage);
    else console.warn(logMessage)
}

export const mainLogger = {
    log: (message: string) => createNotif(message, 'LOG'),
    warn: (message: string) => createNotif(message, 'WARN'),
    error: (message: string) => createNotif(message, 'ERROR')
};

// Use log() instead of console.log()
mainLogger.log('App starting...');