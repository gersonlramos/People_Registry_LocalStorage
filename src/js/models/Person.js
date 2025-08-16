/**
 * Person model with validation capabilities
 */
export class Person {
  constructor(nome, dataNascimento, telefone, email) {
    this.id = this.generateId();
    this.nome = nome ? nome.toUpperCase() : "";
    this.dataNascimento = dataNascimento;
    this.telefone = telefone;
    this.email = email;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Generate a unique ID for the person
   */
  generateId() {
    return (
      "person_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Validate the person data
   * @returns {ValidationResult}
   */
  validate() {
    const errors = [];

    if (!Person.validateName(this.nome)) {
      errors.push({
        field: "nome",
        message:
          "Nome deve conter apenas letras, espaços e caracteres válidos (2-50 caracteres)",
      });
    }

    if (!Person.validateBirthDate(this.dataNascimento)) {
      errors.push({
        field: "dataNascimento",
        message: "Data de nascimento inválida ou pessoa muito idosa",
      });
    }

    if (!Person.validatePhone(this.telefone)) {
      errors.push({
        field: "telefone",
        message: "Telefone deve estar no formato brasileiro válido",
      });
    }

    if (!Person.validateEmail(this.email)) {
      errors.push({
        field: "email",
        message: "Email deve ter um formato válido",
      });
    }

    return new ValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate name field
   * @param {string} name
   * @returns {boolean}
   */
  static validateName(name) {
    if (!name || typeof name !== "string") return false;
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) return false;

    // Allow all Unicode letters, spaces, hyphens, and apostrophes (requires ES2018+)
    // If your environment does not support \p{L}, this will not work.
    const nameRegex = /^[\p{L}\s\-']+$/u;
    return nameRegex.test(trimmedName);
  }

  /**
   * Validate birth date field (Brazilian DD/MM/YYYY format)
   * @param {string} date
   * @returns {boolean}
   */
  static validateBirthDate(date) {
    if (!date) return false;

    // Parse Brazilian date format DD/MM/YYYY
    const birthDate = Person.parseBrazilianDate(date);
    if (!birthDate) return false;

    const today = new Date();

    // Check if date is not in the future
    if (birthDate > today) return false;

    // Check if person is not unreasonably old (120 years)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age > 120) return false;

    return true;
  }

  /**
   * Parse Brazilian date format DD/MM/YYYY
   * @param {string} dateString
   * @returns {Date|null}
   */
  static parseBrazilianDate(dateString) {
    if (!dateString || typeof dateString !== "string") return null;

    // Remove any non-digit characters except /
    const cleanDate = dateString.replace(/[^\d\/]/g, "");
    
    // Check if format matches DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleanDate.match(dateRegex);
    
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Basic validation
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    // Create date object (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);

    // Verify the date is valid (handles cases like 31/02/2023)
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return null;
    }

    return date;
  }

  /**
   * Validate phone field (Brazilian format)
   * @param {string} phone
   * @returns {boolean}
   */
  static validatePhone(phone) {
    if (!phone || typeof phone !== "string") return false;

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, "");

    // Brazilian phone formats: 11 digits (with 9) or 10 digits (without 9)
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;

    // Check if it starts with valid area code (11-99)
    const areaCode = parseInt(cleanPhone.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) return false;

    return true;
  }

  /**
   * Validate email field
   * @param {string} email
   * @returns {boolean}
   */
  static validateEmail(email) {
    if (!email || typeof email !== "string") return false;

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Update the person data
   * @param {Object} data
   */
  update(data) {
    if (data.nome !== undefined) this.nome = data.nome.toUpperCase();
    if (data.dataNascimento !== undefined)
      this.dataNascimento = data.dataNascimento;
    if (data.telefone !== undefined) this.telefone = data.telefone;
    if (data.email !== undefined) this.email = data.email;
    this.updatedAt = new Date();
  }

  /**
   * Convert person to plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      dataNascimento: this.dataNascimento,
      telefone: this.telefone,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Person instance from plain object
   * @param {Object} data
   * @returns {Person}
   */
  static fromJSON(data) {
    const person = new Person(
      data.nome,
      data.dataNascimento,
      data.telefone,
      data.email
    );
    person.id = data.id || person.id;
    person.createdAt = data.createdAt
      ? new Date(data.createdAt)
      : person.createdAt;
    person.updatedAt = data.updatedAt
      ? new Date(data.updatedAt)
      : person.updatedAt;
    return person;
  }
}

/**
 * Validation result class
 */
export class ValidationResult {
  constructor(isValid, errors = []) {
    this.isValid = isValid;
    this.errors = errors;
  }

  /**
   * Get errors for a specific field
   * @param {string} field
   * @returns {Array}
   */
  getErrorsForField(field) {
    return this.errors.filter((error) => error.field === field);
  }

  /**
   * Get all error messages
   * @returns {Array}
   */
  getAllMessages() {
    return this.errors.map((error) => error.message);
  }
}
