import { AppError, ErrorTypes } from "./ErrorHandler.js";

/**
 * Data backup and recovery utilities
 */
export class DataBackup {
  constructor() {
    this.backupKey = "backup_listaPessoas";
    this.maxBackups = 5;
  }

  /**
   * Create backup of current data
   * @param {Array} data
   * @returns {string} Backup ID
   */
  createBackup(data) {
    try {
      const backup = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        version: "1.0",
        checksum: this.calculateChecksum(data),
      };

      const existingBackups = this.getBackups();
      existingBackups.unshift(backup);

      // Keep only the latest backups
      if (existingBackups.length > this.maxBackups) {
        existingBackups.splice(this.maxBackups);
      }

      localStorage.setItem(this.backupKey, JSON.stringify(existingBackups));
      return backup.id;
    } catch (error) {
      throw new AppError(
        "Erro ao criar backup: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get all backups
   * @returns {Array}
   */
  getBackups() {
    try {
      const backupsData = localStorage.getItem(this.backupKey);
      return backupsData ? JSON.parse(backupsData) : [];
    } catch (error) {
      console.warn("Error loading backups:", error);
      return [];
    }
  }

  /**
   * Restore data from backup
   * @param {string} backupId
   * @returns {Array}
   */
  restoreBackup(backupId) {
    try {
      const backups = this.getBackups();
      const backup = backups.find((b) => b.id === backupId);

      if (!backup) {
        throw new AppError(
          "Backup não encontrado",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      // Verify backup integrity
      const calculatedChecksum = this.calculateChecksum(backup.data);
      if (calculatedChecksum !== backup.checksum) {
        throw new AppError(
          "Backup corrompido - checksum inválido",
          ErrorTypes.STORAGE_ERROR
        );
      }

      return backup.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao restaurar backup: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Export data to JSON file
   * @param {Array} data
   * @param {string} filename
   */
  exportToFile(data, filename = null) {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: data,
        checksum: this.calculateChecksum(data),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename ||
        `pessoas_backup_${new Date().toISOString().split("T")[0]}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      throw new AppError(
        "Erro ao exportar dados: " + error.message,
        ErrorTypes.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Import data from file
   * @param {File} file
   * @returns {Promise<Array>}
   */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          throw new AppError(
            "Nenhum arquivo selecionado",
            ErrorTypes.VALIDATION_ERROR
          );
        }

        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
          throw new AppError(
            "Arquivo deve ser do tipo JSON",
            ErrorTypes.VALIDATION_ERROR
          );
        }

        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target.result);

            // Validate import structure
            if (!importData.data || !Array.isArray(importData.data)) {
              throw new AppError(
                "Formato de arquivo inválido",
                ErrorTypes.VALIDATION_ERROR
              );
            }

            // Verify checksum if available
            if (importData.checksum) {
              const calculatedChecksum = this.calculateChecksum(
                importData.data
              );
              if (calculatedChecksum !== importData.checksum) {
                throw new AppError(
                  "Arquivo corrompido - checksum inválido",
                  ErrorTypes.STORAGE_ERROR
                );
              }
            }

            resolve(importData.data);
          } catch (error) {
            if (error instanceof AppError) {
              reject(error);
            } else {
              reject(
                new AppError(
                  "Erro ao processar arquivo: " + error.message,
                  ErrorTypes.VALIDATION_ERROR,
                  { originalError: error }
                )
              );
            }
          }
        };

        reader.onerror = () => {
          reject(new AppError("Erro ao ler arquivo", ErrorTypes.UNKNOWN_ERROR));
        };

        reader.readAsText(file);
      } catch (error) {
        if (error instanceof AppError) {
          reject(error);
        } else {
          reject(
            new AppError(
              "Erro ao importar arquivo: " + error.message,
              ErrorTypes.UNKNOWN_ERROR,
              { originalError: error }
            )
          );
        }
      }
    });
  }

  /**
   * Validate imported data
   * @param {Array} data
   * @returns {Object}
   */
  validateImportData(data) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validRecords: 0,
      invalidRecords: 0,
    };

    if (!Array.isArray(data)) {
      result.isValid = false;
      result.errors.push("Dados devem ser um array");
      return result;
    }

    data.forEach((item, index) => {
      const itemErrors = [];

      // Check required fields
      if (!item.nome || typeof item.nome !== "string") {
        itemErrors.push(`Registro ${index + 1}: Nome inválido`);
      }

      if (!item.email || typeof item.email !== "string") {
        itemErrors.push(`Registro ${index + 1}: Email inválido`);
      }

      if (!item.telefone || typeof item.telefone !== "string") {
        itemErrors.push(`Registro ${index + 1}: Telefone inválido`);
      }

      if (!item.dataNascimento) {
        itemErrors.push(`Registro ${index + 1}: Data de nascimento inválida`);
      }

      if (itemErrors.length > 0) {
        result.invalidRecords++;
        result.errors.push(...itemErrors);
      } else {
        result.validRecords++;
      }
    });

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Calculate simple checksum for data integrity
   * @param {Array} data
   * @returns {string}
   */
  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Generate unique backup ID
   * @returns {string}
   */
  generateBackupId() {
    return (
      "backup_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Clean old backups
   */
  cleanOldBackups() {
    try {
      const backups = this.getBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep backups for 30 days

      const filteredBackups = backups.filter((backup) => {
        const backupDate = new Date(backup.timestamp);
        return backupDate > cutoffDate;
      });

      localStorage.setItem(this.backupKey, JSON.stringify(filteredBackups));
    } catch (error) {
      console.warn("Error cleaning old backups:", error);
    }
  }

  /**
   * Get backup statistics
   * @returns {Object}
   */
  getBackupStats() {
    try {
      const backups = this.getBackups();

      return {
        totalBackups: backups.length,
        oldestBackup:
          backups.length > 0 ? backups[backups.length - 1].timestamp : null,
        newestBackup: backups.length > 0 ? backups[0].timestamp : null,
        totalSize: this.calculateBackupSize(backups),
      };
    } catch (error) {
      return {
        totalBackups: 0,
        oldestBackup: null,
        newestBackup: null,
        totalSize: 0,
        error: error.message,
      };
    }
  }

  /**
   * Calculate total backup size
   * @param {Array} backups
   * @returns {number}
   */
  calculateBackupSize(backups) {
    try {
      const backupString = JSON.stringify(backups);
      return new Blob([backupString]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Auto backup on data changes
   * @param {Array} data
   */
  autoBackup(data) {
    try {
      // Only create backup if data has changed significantly
      const lastBackup = this.getBackups()[0];

      if (!lastBackup || this.shouldCreateBackup(data, lastBackup.data)) {
        this.createBackup(data);
      }
    } catch (error) {
      console.warn("Auto backup failed:", error);
    }
  }

  /**
   * Determine if backup should be created
   * @param {Array} currentData
   * @param {Array} lastBackupData
   * @returns {boolean}
   */
  shouldCreateBackup(currentData, lastBackupData) {
    // Create backup if data length changed
    if (currentData.length !== lastBackupData.length) {
      return true;
    }

    // Create backup if any record changed
    const currentChecksum = this.calculateChecksum(currentData);
    const lastChecksum = this.calculateChecksum(lastBackupData);

    return currentChecksum !== lastChecksum;
  }
}

// Create global backup instance
export const dataBackup = new DataBackup();
