/**
 * DEMON HUNTER - Backup Manager
 * Sistema robusto de backups automáticos para prevenir pérdida de datos
 *
 * Características:
 * - Backups automáticos cada X horas (configurable)
 * - Retención de backups por X días
 * - Compresión opcional (futuro)
 * - Restauración desde backup en caso de JSON corrupto
 * - Limpieza automática de backups antiguos
 */

const fs = require('fs').promises;
const path = require('path');
const CONSTANTS = require('../src/config/constants');
const EMOJIS = require('../src/config/emojis');

class BackupManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.backupDir = path.join(dataDir, 'backups');
    this.retentionDays = CONSTANTS.DATA.BACKUP_RETENTION_DAYS;
    this.maxBackupFiles = CONSTANTS.DATA.BACKUP_MAX_FILES;

    // Archivos a respaldar
    this.filesToBackup = ['users.json', 'clans.json', 'cooldowns.json', 'bot_config.json'];
  }

  /**
   * Inicializar sistema de backups (crear directorio si no existe)
   */
  async init() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`${EMOJIS.SUCCESS} Sistema de backups inicializado: ${this.backupDir}`);

      // Limpiar backups antiguos al iniciar
      await this.cleanOldBackups();
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error inicializando sistema de backups:`, error);
      throw error;
    }
  }

  /**
   * Crear backup de todos los archivos
   * @returns {Promise<string>} Ruta del directorio de backup creado
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTimestamp = path.join(this.backupDir, timestamp);

    try {
      // Crear directorio para este backup
      await fs.mkdir(backupTimestamp, { recursive: true });

      let filesBackedUp = 0;

      // Copiar cada archivo
      for (const filename of this.filesToBackup) {
        const sourcePath = path.join(this.dataDir, filename);
        const destPath = path.join(backupTimestamp, filename);

        try {
          // Verificar que el archivo source existe
          await fs.access(sourcePath);

          // Copiar archivo
          await fs.copyFile(sourcePath, destPath);
          filesBackedUp++;
        } catch (error) {
          if (error.code === 'ENOENT') {
            // Archivo no existe, skip
            console.log(`${EMOJIS.INFO} Backup: ${filename} no existe, omitiendo...`);
          } else {
            throw error;
          }
        }
      }

      console.log(`${EMOJIS.SUCCESS} Backup creado: ${timestamp} (${filesBackedUp} archivos)`);

      // Limpiar backups antiguos después de crear uno nuevo
      await this.cleanOldBackups();

      return backupTimestamp;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error creando backup:`, error);

      // Intentar limpiar backup parcial
      try {
        await fs.rm(backupTimestamp, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignorar error de cleanup
      }

      throw error;
    }
  }

  /**
   * Restaurar un archivo específico desde el backup más reciente
   * @param {string} filename - Nombre del archivo a restaurar (ej: 'users.json')
   * @returns {Promise<boolean>} true si se restauró, false si no había backup
   */
  async restoreFromLatestBackup(filename) {
    try {
      // Obtener lista de backups ordenados (más reciente primero)
      const backups = await this.getBackupsList();

      if (backups.length === 0) {
        console.warn(`${EMOJIS.WARNING} No hay backups disponibles para restaurar ${filename}`);
        return false;
      }

      // Intentar restaurar desde el backup más reciente
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const backupFilePath = path.join(backupPath, filename);
        const targetPath = path.join(this.dataDir, filename);

        try {
          // Verificar que el archivo de backup existe
          await fs.access(backupFilePath);

          // Validar que el JSON es válido antes de restaurar
          const backupData = await fs.readFile(backupFilePath, 'utf-8');
          JSON.parse(backupData); // Throws si es inválido

          // Crear backup del archivo corrupto (por si acaso)
          try {
            const corruptedBackup = `${targetPath}.corrupted.${Date.now()}`;
            await fs.copyFile(targetPath, corruptedBackup);
            console.log(`${EMOJIS.INFO} Archivo corrupto guardado en: ${corruptedBackup}`);
          } catch (backupCorruptedError) {
            // Ignorar si el archivo corrupto no se puede respaldar
          }

          // Restaurar desde backup
          await fs.copyFile(backupFilePath, targetPath);

          console.log(`${EMOJIS.SUCCESS} ${filename} restaurado desde backup: ${backup}`);
          return true;
        } catch (error) {
          // Este backup también está corrupto o no existe, intentar con el siguiente
          console.warn(`${EMOJIS.WARNING} Backup ${backup} no válido para ${filename}, intentando siguiente...`);
          continue;
        }
      }

      console.error(`${EMOJIS.ERROR} No se pudo restaurar ${filename} desde ningún backup`);
      return false;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error restaurando ${filename}:`, error);
      return false;
    }
  }

  /**
   * Obtener lista de backups disponibles (ordenados, más reciente primero)
   * @returns {Promise<string[]>} Lista de nombres de directorios de backup
   */
  async getBackupsList() {
    try {
      const files = await fs.readdir(this.backupDir);

      // Filtrar solo directorios y ordenar por timestamp (más reciente primero)
      const backups = [];
      for (const file of files) {
        const fullPath = path.join(this.backupDir, file);
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          backups.push({ name: file, mtime: stats.mtime });
        }
      }

      // Ordenar por fecha de modificación (más reciente primero)
      backups.sort((a, b) => b.mtime - a.mtime);

      return backups.map(b => b.name);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Limpiar backups antiguos (mantener solo los últimos X)
   */
  async cleanOldBackups() {
    try {
      const backups = await this.getBackupsList();

      if (backups.length <= this.maxBackupFiles) {
        return; // No hay nada que limpiar
      }

      // Eliminar backups más allá del límite
      const toDelete = backups.slice(this.maxBackupFiles);
      let deleted = 0;

      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup);
        try {
          await fs.rm(backupPath, { recursive: true, force: true });
          deleted++;
        } catch (error) {
          console.warn(`${EMOJIS.WARNING} No se pudo eliminar backup antiguo: ${backup}`, error.message);
        }
      }

      if (deleted > 0) {
        console.log(`${EMOJIS.INFO} Limpiados ${deleted} backups antiguos`);
      }
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error limpiando backups antiguos:`, error);
    }
  }

  /**
   * Obtener estadísticas de backups
   * @returns {Promise<object>} { count: number, totalSize: number, oldest: Date, newest: Date }
   */
  async getBackupStats() {
    try {
      const backups = await this.getBackupsList();

      if (backups.length === 0) {
        return { count: 0, totalSize: 0, oldest: null, newest: null };
      }

      let totalSize = 0;

      // Calcular tamaño total
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const files = await fs.readdir(backupPath);

        for (const file of files) {
          const filePath = path.join(backupPath, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      // Obtener fechas del más antiguo y más nuevo
      const oldestPath = path.join(this.backupDir, backups[backups.length - 1]);
      const newestPath = path.join(this.backupDir, backups[0]);

      const oldestStats = await fs.stat(oldestPath);
      const newestStats = await fs.stat(newestPath);

      return {
        count: backups.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        oldest: oldestStats.mtime,
        newest: newestStats.mtime
      };
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error obteniendo estadísticas de backups:`, error);
      return { count: 0, totalSize: 0, oldest: null, newest: null };
    }
  }

  /**
   * Iniciar backups automáticos periódicos
   * @param {number} intervalHours - Intervalo en horas
   * @returns {NodeJS.Timeout} Interval ID
   */
  startAutoBackup(intervalHours = CONSTANTS.DATA.BACKUP_INTERVAL_HOURS) {
    console.log(`${EMOJIS.LOADING} Iniciando backups automáticos cada ${intervalHours} horas...`);

    // Crear backup inmediatamente
    this.createBackup().catch(error => {
      console.error(`${EMOJIS.ERROR} Error en backup automático inicial:`, error);
    });

    // Iniciar intervalo
    const interval = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error(`${EMOJIS.ERROR} Error en backup automático:`, error);
      }
    }, intervalHours * 60 * 60 * 1000);

    return interval;
  }
}

module.exports = BackupManager;
