import { Person } from "../models/Person.js";
import { AppError, ErrorTypes } from "../utils/ErrorHandler.js";
import { dataBackup } from "../utils/DataBackup.js";

/**
 * Data manager for handling person records with LocalStorage
 */
export class DataManager {
  constructor() {
    this.storageKey = "listaPessoas";
    this.persons = [];
    this.loadPersons();
  }

  /**
   * Get all persons
   * @returns {Person[]}
   */
  getAllPersons() {
    return [...this.persons];
  }

  /**
   * Add a new person
   * @param {Person} person
   * @returns {Promise<boolean>}
   */
  async addPerson(person) {
    try {
      if (!(person instanceof Person)) {
        throw new AppError(
          "Invalid person object",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      const validation = person.validate();
      if (!validation.isValid) {
        throw new AppError(
          "Validation failed: " + validation.getAllMessages().join(", "),
          ErrorTypes.VALIDATION_ERROR,
          { errors: validation.errors }
        );
      }

      if (this.isDuplicate(person)) {
        throw new AppError(
          "Pessoa já cadastrada com este email ou telefone",
          ErrorTypes.DUPLICATE_ERROR
        );
      }

      this.persons.push(person);
      await this.savePersons();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao adicionar pessoa: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Update a person by index
   * @param {number} index
   * @param {Person} updatedPerson
   * @returns {Promise<boolean>}
   */
  async updatePerson(index, updatedPerson) {
    try {
      if (index < 0 || index >= this.persons.length) {
        throw new AppError("Índice inválido", ErrorTypes.VALIDATION_ERROR);
      }

      if (!(updatedPerson instanceof Person)) {
        throw new AppError(
          "Invalid person object",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      const validation = updatedPerson.validate();
      if (!validation.isValid) {
        throw new AppError(
          "Validation failed: " + validation.getAllMessages().join(", "),
          ErrorTypes.VALIDATION_ERROR,
          { errors: validation.errors }
        );
      }

      if (this.isDuplicate(updatedPerson, index)) {
        throw new AppError(
          "Pessoa já cadastrada com este email ou telefone",
          ErrorTypes.DUPLICATE_ERROR
        );
      }

      // Preserve original ID and creation date
      const originalPerson = this.persons[index];
      updatedPerson.id = originalPerson.id;
      updatedPerson.createdAt = originalPerson.createdAt;
      updatedPerson.updatedAt = new Date();

      this.persons[index] = updatedPerson;
      await this.savePersons();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao atualizar pessoa: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Delete a person by index
   * @param {number} index
   * @returns {Promise<boolean>}
   */
  async deletePerson(index) {
    try {
      if (index < 0 || index >= this.persons.length) {
        throw new AppError("Índice inválido", ErrorTypes.VALIDATION_ERROR);
      }

      this.persons.splice(index, 1);
      await this.savePersons();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao remover pessoa: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Search persons by query
   * @param {string} query
   * @returns {Person[]}
   */
  searchPersons(query) {
    if (!query || typeof query !== "string") {
      return this.getAllPersons();
    }

    const searchTerm = query.toLowerCase().trim();
    return this.persons.filter(
      (person) =>
        person.nome.toLowerCase().includes(searchTerm) ||
        person.email.toLowerCase().includes(searchTerm) ||
        person.telefone.includes(searchTerm)
    );
  }

  /**
   * Check if person is duplicate based on email or phone
   * @param {Person} person
   * @param {number} excludeIndex
   * @returns {boolean}
   */
  isDuplicate(person, excludeIndex = -1) {
    return this.persons.some((existingPerson, index) => {
      if (index === excludeIndex) return false;
      return (
        existingPerson.email === person.email ||
        existingPerson.telefone === person.telefone
      );
    });
  }

  /**
   * Get person by index
   * @param {number} index
   * @returns {Person|null}
   */
  getPersonByIndex(index) {
    if (index < 0 || index >= this.persons.length) {
      return null;
    }
    return this.persons[index];
  }

  /**
   * Get person by ID
   * @param {string} id
   * @returns {Person|null}
   */
  getPersonById(id) {
    return this.persons.find((person) => person.id === id) || null;
  }

  /**
   * Load persons from LocalStorage
   */
  loadPersons() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsedData = JSON.parse(data);
        this.persons = parsedData.map((personData) =>
          Person.fromJSON(personData)
        );
      } else {
        this.persons = [];
      }
    } catch (error) {
      console.error("Error loading persons from storage:", error);
      this.persons = [];
      throw new AppError(
        "Erro ao carregar dados do armazenamento",
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Save persons to LocalStorage
   * @returns {Promise<void>}
   */
  async savePersons() {
    try {
      // Create backup before saving
      dataBackup.autoBackup(this.persons.map((person) => person.toJSON()));

      const data = JSON.stringify(
        this.persons.map((person) => person.toJSON())
      );
      localStorage.setItem(this.storageKey, data);
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        throw new AppError(
          "Armazenamento local cheio. Remova alguns registros.",
          ErrorTypes.STORAGE_QUOTA_ERROR,
          { originalError: error }
        );
      }
      throw new AppError(
        "Erro ao salvar dados no armazenamento",
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Clear all persons
   * @returns {Promise<boolean>}
   */
  async clearAllPersons() {
    try {
      this.persons = [];
      await this.savePersons();
      return true;
    } catch (error) {
      throw new AppError(
        "Erro ao limpar dados: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get storage statistics
   * @returns {Object}
   */
  getStorageStats() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const dataSize = data ? new Blob([data]).size : 0;

      return {
        totalPersons: this.persons.length,
        storageSize: dataSize,
        storageSizeFormatted: this.formatBytes(dataSize),
      };
    } catch (error) {
      return {
        totalPersons: this.persons.length,
        storageSize: 0,
        storageSizeFormatted: "0 B",
        error: error.message,
      };
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Export data to file
   * @param {string} filename
   */
  exportData(filename = null) {
    try {
      const data = this.persons.map((person) => person.toJSON());
      dataBackup.exportToFile(data, filename);
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
   * @returns {Promise<Object>}
   */
  async importData(file) {
    try {
      const importedData = await dataBackup.importFromFile(file);
      const validation = dataBackup.validateImportData(importedData);

      if (!validation.isValid) {
        throw new AppError(
          `Dados inválidos: ${validation.errors.join(", ")}`,
          ErrorTypes.VALIDATION_ERROR,
          { validation }
        );
      }

      // Convert imported data to Person objects
      const importedPersons = importedData.map((personData) =>
        Person.fromJSON(personData)
      );

      return {
        persons: importedPersons,
        validation: validation,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao importar dados: " + error.message,
        ErrorTypes.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Replace all data with imported data
   * @param {Array} persons
   * @returns {Promise<boolean>}
   */
  async replaceAllData(persons) {
    try {
      // Create backup before replacing
      dataBackup.createBackup(this.persons.map((person) => person.toJSON()));

      this.persons = persons;
      await this.savePersons();
      return true;
    } catch (error) {
      throw new AppError(
        "Erro ao substituir dados: " + error.message,
        ErrorTypes.STORAGE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get backup information
   * @returns {Object}
   */
  getBackupInfo() {
    return dataBackup.getBackupStats();
  }

  /**
   * Restore from backup
   * @param {string} backupId
   * @returns {Promise<boolean>}
   */
  async restoreFromBackup(backupId) {
    try {
      const backupData = dataBackup.restoreBackup(backupId);
      const restoredPersons = backupData.map((personData) =>
        Person.fromJSON(personData)
      );

      this.persons = restoredPersons;
      await this.savePersons();
      return true;
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
}
