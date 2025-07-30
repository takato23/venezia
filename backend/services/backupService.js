const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.dbPath = path.join(__dirname, '..', 'database', 'venezia.db');
    this.maxBackups = 30; // Keep last 30 backups
    this.isRunning = false;
  }

  async init() {
    console.log('🗄️ Iniciando servicio de backup...');
    
    // Create backup directory if it doesn't exist
    await this.ensureBackupDirectory();
    
    // Schedule daily backup at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.createBackup('scheduled');
    });
    
    // Schedule weekly full backup on Sundays at 3 AM
    cron.schedule('0 3 * * 0', () => {
      this.createBackup('weekly');
    });
    
    console.log('✅ Servicio de backup configurado');
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('📁 Directorio de backups creado');
    }
  }

  async createBackup(type = 'manual') {
    if (this.isRunning) {
      console.log('⚠️ Backup already in progress, skipping...');
      return null;
    }

    this.isRunning = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `venezia_${type}_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      console.log(`🔄 Creating ${type} backup...`);
      
      // Copy database file
      await fs.copyFile(this.dbPath, backupPath);
      
      // Create metadata file
      const metadata = {
        fileName: backupFileName,
        type,
        timestamp: new Date().toISOString(),
        size: (await fs.stat(backupPath)).size,
        dbPath: this.dbPath
      };
      
      await fs.writeFile(
        `${backupPath}.json`,
        JSON.stringify(metadata, null, 2)
      );
      
      // Clean old backups
      await this.cleanOldBackups();
      
      console.log(`✅ Backup created: ${backupFileName}`);
      
      this.isRunning = false;
      return metadata;
      
    } catch (error) {
      console.error('❌ Backup error:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.endsWith('.db'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f)
        }));
      
      // Sort by modification time
      const fileStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          stats: await fs.stat(file.path)
        }))
      );
      
      fileStats.sort((a, b) => b.stats.mtime - a.stats.mtime);
      
      // Remove old backups
      if (fileStats.length > this.maxBackups) {
        const toDelete = fileStats.slice(this.maxBackups);
        
        for (const file of toDelete) {
          await fs.unlink(file.path);
          // Also remove metadata file
          try {
            await fs.unlink(`${file.path}.json`);
          } catch {}
          console.log(`🗑️ Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.db'));
      
      const backups = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = path.join(this.backupDir, fileName);
          const stats = await fs.stat(filePath);
          
          // Try to read metadata
          let metadata = {};
          try {
            const metadataContent = await fs.readFile(`${filePath}.json`, 'utf-8');
            metadata = JSON.parse(metadataContent);
          } catch {}
          
          return {
            fileName,
            ...metadata,
            size: stats.size,
            created: stats.mtime
          };
        })
      );
      
      // Sort by creation date, newest first
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(fileName) {
    const backupPath = path.join(this.backupDir, fileName);
    const tempDbPath = `${this.dbPath}.temp`;
    
    try {
      // Verify backup exists
      await fs.access(backupPath);
      
      console.log(`🔄 Restoring backup: ${fileName}`);
      
      // Create a backup of current database
      await fs.copyFile(this.dbPath, tempDbPath);
      
      // Restore the backup
      await fs.copyFile(backupPath, this.dbPath);
      
      // Remove temp file
      await fs.unlink(tempDbPath);
      
      console.log('✅ Backup restored successfully');
      
      return {
        success: true,
        message: `Database restored from ${fileName}`
      };
      
    } catch (error) {
      console.error('❌ Restore error:', error);
      
      // Try to restore from temp if available
      try {
        await fs.access(tempDbPath);
        await fs.copyFile(tempDbPath, this.dbPath);
        await fs.unlink(tempDbPath);
        console.log('⚠️ Restored original database after error');
      } catch {}
      
      throw error;
    }
  }

  async exportBackup(fileName) {
    const backupPath = path.join(this.backupDir, fileName);
    
    try {
      const data = await fs.readFile(backupPath);
      return data;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  async getBackupInfo() {
    const backups = await this.listBackups();
    const dirStats = await fs.stat(this.backupDir);
    
    // Calculate total size
    let totalSize = 0;
    for (const backup of backups) {
      totalSize += backup.size;
    }
    
    return {
      backupDirectory: this.backupDir,
      totalBackups: backups.length,
      maxBackups: this.maxBackups,
      totalSize,
      oldestBackup: backups[backups.length - 1],
      newestBackup: backups[0],
      isRunning: this.isRunning
    };
  }
}

module.exports = BackupService;