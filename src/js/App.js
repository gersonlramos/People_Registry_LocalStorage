import { Person } from "./models/Person.js";
import { DataManager } from "./managers/DataManager.js";
import { ThemeManager } from "./managers/ThemeManager.js";
import {
  AppError,
  ErrorTypes,
  globalErrorHandler,
} from "./utils/ErrorHandler.js";
import { PhoneFormatter } from "./utils/PhoneFormatter.js";
import { notificationSystem } from "./components/NotificationSystem.js";
import { confirmationModal } from "./components/ConfirmationModal.js";

/**
 * Main application class
 */
export class App {
  constructor() {
    this.dataManager = null;
    this.themeManager = null;
    this.currentEditIndex = null;
    this.isInitialized = false;

    // Bind methods to preserve context
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.handlePhoneInput = this.handlePhoneInput.bind(this);
    this.editPerson = this.editPerson.bind(this);
    this.removePerson = this.removePerson.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log("Initializing People Registry Application...");

      // Initialize managers
      this.dataManager = new DataManager();
      this.themeManager = new ThemeManager();

      // Setup event listeners
      this.setupEventListeners();

      // Setup error handling
      this.setupErrorHandling();

      // Initial render
      this.renderPersonList();

      this.isInitialized = true;
      console.log("Application initialized successfully");
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "App initialization",
      });
      this.showError(
        "Erro ao inicializar aplicação: " + appError.getUserMessage()
      );
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    try {
      // Form submission
      const form = document.getElementById("formulario-cadastro");
      if (form) {
        form.addEventListener("submit", this.handleFormSubmit);
      }

      // Search input
      const searchInput = document.getElementById("filtro-nome");
      if (searchInput) {
        searchInput.addEventListener("input", this.handleSearchInput);

        // Show/hide clear button based on input content
        searchInput.addEventListener("input", (e) => {
          this.toggleClearButton(e.target.value);
        });
      }

      // Clear search button
      const clearSearchBtn = document.getElementById("clear-search");
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
          this.clearSearch();
        });
      }

      // Phone formatting
      const phoneInput = document.getElementById("telefone");
      if (phoneInput) {
        phoneInput.addEventListener("input", this.handlePhoneInput);
      }

      // Date input setup for Brazilian format
      this.setupDateInput();

      // Real-time validation for all form inputs
      this.setupRealTimeValidation();

      // Keyboard navigation
      this.setupKeyboardNavigation();

      // Accessibility features
      this.setupAccessibilityFeatures();

      // Global error handling
      window.addEventListener("appError", this.handleGlobalError.bind(this));
    } catch (error) {
      throw new AppError(
        "Erro ao configurar event listeners: " + error.message,
        ErrorTypes.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Setup real-time validation for form inputs
   */
  setupRealTimeValidation() {
    const inputs = ["nome", "dataNascimento", "telefone", "email"];

    inputs.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        // Validate on blur (when user leaves the field)
        input.addEventListener("blur", (e) => this.validateField(e.target));

        // Clear validation on focus (when user starts typing again)
        input.addEventListener("focus", (e) =>
          this.clearFieldValidation(e.target)
        );

        // For email and phone, also validate on input with debouncing
        if (inputId === "email" || inputId === "telefone") {
          let timeout;
          input.addEventListener("input", (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.validateField(e.target), 500);
          });
        }
      }
    });
  }

  /**
   * Validate individual field
   * @param {HTMLElement} field
   */
  validateField(field) {
    const fieldName = field.id;
    const value = field.value.trim();

    let isValid = true;
    let errorMessage = "";

    switch (fieldName) {
      case "nome":
        isValid = Person.validateName(value);
        if (!isValid) {
          errorMessage =
            "Nome deve conter apenas letras e ter entre 2-50 caracteres";
        }
        break;

      case "dataNascimento":
        isValid = Person.validateBirthDate(value);
        if (!isValid) {
          errorMessage = "Data de nascimento inválida ou pessoa muito idosa";
        }
        break;

      case "telefone":
        isValid = Person.validatePhone(value);
        if (!isValid) {
          errorMessage = "Telefone deve estar no formato brasileiro válido";
        } else {
          // Check for duplicates
          const isDuplicate = this.checkDuplicatePhone(value);
          if (isDuplicate) {
            isValid = false;
            errorMessage = "Este telefone já está cadastrado";
          }
        }
        break;

      case "email":
        isValid = Person.validateEmail(value);
        if (!isValid) {
          errorMessage = "Email deve ter um formato válido";
        } else {
          // Check for duplicates
          const isDuplicate = this.checkDuplicateEmail(value);
          if (isDuplicate) {
            isValid = false;
            errorMessage = "Este email já está cadastrado";
          }
        }
        break;
    }

    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  /**
   * Check for duplicate email
   * @param {string} email
   * @returns {boolean}
   */
  checkDuplicateEmail(email) {
    const persons = this.dataManager.getAllPersons();
    return persons.some((person, index) => {
      // Exclude current editing person
      if (this.currentEditIndex !== null && index === this.currentEditIndex) {
        return false;
      }
      return person.email.toLowerCase() === email.toLowerCase();
    });
  }

  /**
   * Check for duplicate phone
   * @param {string} phone
   * @returns {boolean}
   */
  checkDuplicatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    const persons = this.dataManager.getAllPersons();
    return persons.some((person, index) => {
      // Exclude current editing person
      if (this.currentEditIndex !== null && index === this.currentEditIndex) {
        return false;
      }
      const personCleanPhone = person.telefone.replace(/\D/g, "");
      return personCleanPhone === cleanPhone;
    });
  }

  /**
   * Show field validation result
   * @param {HTMLElement} field
   * @param {boolean} isValid
   * @param {string} errorMessage
   */
  showFieldValidation(field, isValid, errorMessage) {
    const formGroup = field.closest(".form-group");

    // Remove existing validation classes and messages
    field.classList.remove("error", "success");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");

    const existingMessage = formGroup.querySelector(".validation-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    if (field.value.trim() === "") {
      // Don't show validation for empty fields unless it's on form submit
      return;
    }

    if (isValid) {
      field.classList.add("success");
      field.classList.add("validation-success");
      field.setAttribute("aria-invalid", "false");

      // Add success icon
      const successMessage = document.createElement("div");
      successMessage.className = "validation-message success-message";
      successMessage.id = `${field.id}-success`;
      successMessage.innerHTML = "✓ Válido";
      successMessage.setAttribute("role", "status");
      formGroup.appendChild(successMessage);

      field.setAttribute("aria-describedby", `${field.id}-success`);

      // Remove animation class after animation completes
      setTimeout(() => field.classList.remove("validation-success"), 600);
    } else {
      field.classList.add("error");
      field.classList.add("validation-error");
      field.setAttribute("aria-invalid", "true");

      // Add error message
      const errorDiv = document.createElement("div");
      errorDiv.className = "validation-message error-message";
      errorDiv.id = `${field.id}-error`;
      errorDiv.textContent = errorMessage;
      errorDiv.setAttribute("role", "alert");
      formGroup.appendChild(errorDiv);

      field.setAttribute("aria-describedby", `${field.id}-error`);

      // Announce error to screen readers
      this.announceToScreenReader(
        `Erro no campo ${field.labels[0]?.textContent}: ${errorMessage}`,
        true
      );

      // Remove animation class after animation completes
      setTimeout(() => field.classList.remove("validation-error"), 500);
    }
  }

  /**
   * Clear field validation
   * @param {HTMLElement} field
   */
  clearFieldValidation(field) {
    const formGroup = field.closest(".form-group");

    field.classList.remove(
      "error",
      "success",
      "validation-error",
      "validation-success"
    );
    const existingMessage = formGroup.querySelector(".validation-message");
    if (existingMessage) {
      existingMessage.remove();
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Error handling is already set up in the global error handler
    // This method can be extended for app-specific error handling
  }

  /**
   * Handle form submission
   * @param {Event} event
   */
  async handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector(".button-text");

    try {
      // Show loading state
      form.classList.add("loading");
      submitButton.disabled = true;
      if (buttonText) {
        buttonText.textContent = "Salvando...";
      }

      // Validate all fields before submission
      const isFormValid = this.validateAllFields();
      if (!isFormValid) {
        throw new AppError(
          "Por favor, corrija os erros no formulário",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      const formData = this.getFormData();
      const person = new Person(
        formData.nome,
        formData.dataNascimento,
        formData.telefone,
        formData.email
      );

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (this.currentEditIndex !== null) {
        // Update existing person
        await this.dataManager.updatePerson(this.currentEditIndex, person);
        this.showSuccess(`${person.nome} foi atualizado com sucesso!`);
        this.highlightPersonCard(person.id);
        this.currentEditIndex = null;
      } else {
        // Add new person
        await this.dataManager.addPerson(person);
        this.showSuccess(`${person.nome} foi cadastrado com sucesso!`);
        this.highlightPersonCard(person.id);
      }

      this.clearForm();
      this.renderPersonList();
    } catch (error) {
      if (error instanceof AppError) {
        this.showError(error.getUserMessage());

        // Show field-specific validation errors
        if (
          error.type === ErrorTypes.VALIDATION_ERROR &&
          error.details.errors
        ) {
          this.showValidationErrors(error.details.errors);
        }
      } else {
        const appError = globalErrorHandler.handleError(error, {
          context: "Form submission",
        });
        this.showError(appError.getUserMessage());
      }
    } finally {
      // Remove loading state
      form.classList.remove("loading");
      submitButton.disabled = false;
      if (buttonText) {
        buttonText.textContent =
          this.currentEditIndex !== null ? "Atualizar" : "Salvar";
      }
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean}
   */
  validateAllFields() {
    const inputs = ["nome", "dataNascimento", "telefone", "email"];
    let isValid = true;

    inputs.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        const fieldValid = this.validateField(input);
        if (!fieldValid) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  /**
   * Handle search input with debouncing
   * @param {Event} event
   */
  handleSearchInput(event) {
    try {
      const query = event.target.value;

      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Show loading state for search
      this.showSearchLoading(true);

      // Debounce search for better performance
      this.searchTimeout = setTimeout(() => {
        this.renderPersonList(query);
        this.showSearchLoading(false);
      }, 300);
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Search input",
      });
      this.showError(appError.getUserMessage());
      this.showSearchLoading(false);
    }
  }

  /**
   * Show/hide search loading state
   * @param {boolean} isLoading
   */
  showSearchLoading(isLoading) {
    const searchInput = document.getElementById("filtro-nome");
    if (searchInput) {
      if (isLoading) {
        searchInput.classList.add("searching");
      } else {
        searchInput.classList.remove("searching");
      }
    }
  }

  /**
   * Highlight search terms in text
   * @param {string} text
   * @param {string} searchTerm
   * @returns {string}
   */
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Handle phone input formatting
   * @param {Event} event
   */
  handlePhoneInput(event) {
    try {
      PhoneFormatter.createInputHandler()(event);
    } catch (error) {
      console.warn("Error formatting phone number:", error);
      // Don't show error to user for formatting issues
    }
  }

  /**
   * Setup date input for Brazilian format
   */
  setupDateInput() {
    const dateInput = document.getElementById("dataNascimento");
    if (dateInput) {
      const formGroup = dateInput.closest(".form-group");

      // Set the input to use Brazilian locale
      dateInput.setAttribute("lang", "pt-BR");

      // Create placeholder element
      const placeholder = document.createElement("div");
      placeholder.className = "date-placeholder";
      placeholder.textContent = "dd/mm/aaaa";
      formGroup.appendChild(placeholder);

      // Show/hide placeholder based on input state
      const togglePlaceholder = () => {
        if (dateInput.value || document.activeElement === dateInput) {
          placeholder.classList.add("hidden");
        } else {
          placeholder.classList.remove("hidden");
        }
      };

      // Brazilian date input formatting
      dateInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

        // Limit to 8 digits (ddmmyyyy)
        if (value.length > 8) {
          value = value.slice(0, 8);
        }

        // Format as dd/mm/yyyy
        if (value.length >= 3 && value.length <= 4) {
          value = value.slice(0, 2) + "/" + value.slice(2);
        } else if (value.length >= 5) {
          value =
            value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4);
        }

        e.target.value = value;
        togglePlaceholder();
      });

      // Event listeners
      dateInput.addEventListener("focus", togglePlaceholder);
      dateInput.addEventListener("blur", togglePlaceholder);

      // Initial state
      togglePlaceholder();
    }
  }

  /**
   * Edit person
   * @param {number} index
   */
  editPerson(index) {
    try {
      const person = this.dataManager.getPersonByIndex(index);
      if (!person) {
        throw new AppError(
          "Pessoa não encontrada",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      // Populate form with person data
      document.getElementById("nome").value = person.nome;
      document.getElementById("dataNascimento").value = person.dataNascimento;
      document.getElementById("telefone").value = person.telefone;
      document.getElementById("email").value = person.email;

      this.currentEditIndex = index;

      // Update button text
      const submitButton = document.querySelector('form button[type="submit"]');
      const buttonText = submitButton.querySelector(".button-text");
      if (buttonText) {
        buttonText.textContent = "Atualizar";
      }

      // Clear any existing validation
      this.clearAllValidation();

      // Scroll to form
      document.getElementById("formulario-cadastro").scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Edit person",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Remove person
   * @param {number} index
   */
  async removePerson(index) {
    try {
      const person = this.dataManager.getPersonByIndex(index);
      if (!person) {
        throw new AppError(
          "Pessoa não encontrada",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      // Show confirmation modal
      const confirmed = await confirmationModal.confirmDelete(person);

      if (!confirmed) {
        return;
      }

      // Store person for potential undo
      this.lastDeletedPerson = { person, index };

      await this.dataManager.deletePerson(index);
      this.showSuccess(`${person.nome} foi removido com sucesso!`, {
        duration: 8000, // Longer duration for undo
        actions: [
          {
            label: "Desfazer",
            handler: `app.undoDelete()`,
          },
        ],
      });
      this.renderPersonList();

      // Clear form if editing the deleted person
      if (this.currentEditIndex === index) {
        this.clearForm();
        this.currentEditIndex = null;
      }
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Remove person",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Get form data
   * @returns {Object}
   */
  getFormData() {
    return {
      nome: document.getElementById("nome").value.trim(),
      dataNascimento: document.getElementById("dataNascimento").value,
      telefone: document.getElementById("telefone").value.trim(),
      email: document.getElementById("email").value.trim(),
    };
  }

  /**
   * Clear form
   */
  clearForm() {
    document.getElementById("formulario-cadastro").reset();
    this.currentEditIndex = null;
    this.clearAllValidation();

    // Reset button text
    const submitButton = document.querySelector('form button[type="submit"]');
    const buttonText = submitButton.querySelector(".button-text");
    if (buttonText) {
      buttonText.textContent = "Salvar";
    }
  }

  /**
   * Clear all validation from form
   */
  clearAllValidation() {
    const inputs = ["nome", "dataNascimento", "telefone", "email"];
    inputs.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        this.clearFieldValidation(input);
      }
    });
  }

  /**
   * Render person list
   * @param {string} searchQuery
   */
  renderPersonList(searchQuery = "") {
    try {
      const persons = searchQuery
        ? this.dataManager.searchPersons(searchQuery)
        : this.dataManager.getAllPersons();

      const listElement = document.getElementById("lista-pessoas");
      if (!listElement) {
        throw new AppError(
          "Lista de pessoas não encontrada no DOM",
          ErrorTypes.UNKNOWN_ERROR
        );
      }

      if (persons.length === 0) {
        const emptyMessage = searchQuery
          ? `
            <li class="empty-state search-empty" role="status">
              <div class="empty-icon" aria-hidden="true">🔍</div>
              <div class="empty-title">Nenhuma pessoa encontrada</div>
              <div class="empty-subtitle">Tente buscar por nome, email ou telefone</div>
              <button class="clear-search" onclick="app.clearSearch()" aria-label="Limpar busca e mostrar todas as pessoas">Limpar busca</button>
            </li>
          `
          : `
            <li class="empty-state" role="status">
              <div class="empty-icon" aria-hidden="true">👥</div>
              <div class="empty-title">Nenhuma pessoa cadastrada</div>
              <div class="empty-subtitle">Adicione a primeira pessoa usando o formulário acima</div>
            </li>
          `;
        listElement.innerHTML = emptyMessage;

        // Announce to screen readers
        const message = searchQuery
          ? `Nenhuma pessoa encontrada para "${searchQuery}"`
          : "Nenhuma pessoa cadastrada";
        this.announceToScreenReader(message);
        return;
      }

      const listHTML = persons
        .map((person, originalIndex) => {
          // Find the original index in the full list
          const allPersons = this.dataManager.getAllPersons();
          const realIndex = allPersons.findIndex((p) => p.id === person.id);

          // Highlight search terms
          const highlightedName = this.highlightSearchTerm(
            person.nome,
            searchQuery
          );
          const highlightedEmail = this.highlightSearchTerm(
            person.email,
            searchQuery
          );
          const highlightedPhone = this.highlightSearchTerm(
            PhoneFormatter.formatForDisplay(person.telefone),
            searchQuery
          );

          return `
                    <li data-person-id="${person.id}" class="person-card ${
            searchQuery ? "search-result" : ""
          }" role="listitem">
                        <div class="info">
                            <div class="person-name" role="heading" aria-level="3">${highlightedName}</div>
                            <div class="person-details">
                                <div class="detail-item">
                                    <span class="detail-icon" aria-hidden="true">🎂</span>
                                    <span class="detail-value">
                                        <span class="sr-only">Data de nascimento: </span>
                                        ${this.formatDate(
                                          person.dataNascimento
                                        )}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-icon" aria-hidden="true">📞</span>
                                    <span class="detail-value">
                                        <span class="sr-only">Telefone: </span>
                                        ${highlightedPhone}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-icon" aria-hidden="true">✉️</span>
                                    <span class="detail-value">
                                        <span class="sr-only">Email: </span>
                                        ${highlightedEmail}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-icon" aria-hidden="true">📅</span>
                                    <span class="detail-value">
                                        <span class="sr-only">Criado em: </span>
                                        ${this.formatDate(person.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="actions" role="group" aria-label="Ações para ${
                          person.nome
                        }">
                            <button 
                                class="editar" 
                                onclick="app.editPerson(${realIndex})"
                                aria-label="Editar ${person.nome}"
                                title="Editar informações de ${person.nome}"
                            >
                                <span class="button-icon" aria-hidden="true">✏️</span>
                                <span>Editar</span>
                            </button>
                            <button 
                                class="remover" 
                                onclick="app.removePerson(${realIndex})"
                                aria-label="Remover ${person.nome}"
                                title="Remover ${person.nome} da lista"
                            >
                                <span class="button-icon" aria-hidden="true">🗑️</span>
                                <span>Remover</span>
                            </button>
                        </div>
                    </li>
                `;
        })
        .join("");

      listElement.innerHTML = listHTML;

      // Announce list update to screen readers
      const message = searchQuery
        ? `${persons.length} pessoa${
            persons.length !== 1 ? "s" : ""
          } encontrada${persons.length !== 1 ? "s" : ""} para "${searchQuery}"`
        : `Lista atualizada com ${persons.length} pessoa${
            persons.length !== 1 ? "s" : ""
          }`;
      this.announceToScreenReader(message);
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Render person list",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Format date for display
   * @param {string|Date} dateInput
   * @returns {string}
   */
  formatDate(dateInput) {
    try {
      let date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === "string") {
        // Check if it's already in Brazilian format DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
          return dateInput; // Already in correct format
        }
        // Try to parse as Brazilian date first
        date = Person.parseBrazilianDate(dateInput);
        if (!date) {
          // Fallback to standard Date parsing
          date = new Date(dateInput);
        }
      } else {
        return "Data inválida";
      }
      
      // Format as DD/MM/YYYY
      if (date && !isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return dateInput?.toString() || "Data inválida";
    } catch (error) {
      return dateInput?.toString() || "Data inválida";
    }
  }

  /**
   * Show success message
   * @param {string} message
   * @param {Object} options
   */
  showSuccess(message, options = {}) {
    console.log("SUCCESS:", message);
    return notificationSystem.success(message, options);
  }

  /**
   * Show error message
   * @param {string} message
   * @param {Object} options
   */
  showError(message, options = {}) {
    console.error("ERROR:", message);
    return notificationSystem.error(message, options);
  }

  /**
   * Show warning message
   * @param {string} message
   * @param {Object} options
   */
  showWarning(message, options = {}) {
    console.warn("WARNING:", message);
    return notificationSystem.warning(message, options);
  }

  /**
   * Show info message
   * @param {string} message
   * @param {Object} options
   */
  showInfo(message, options = {}) {
    console.info("INFO:", message);
    return notificationSystem.info(message, options);
  }

  /**
   * Show validation errors
   * @param {Array} errors
   */
  showValidationErrors(errors) {
    this.clearValidationErrors();

    errors.forEach((error) => {
      const field = document.getElementById(error.field);
      if (field) {
        field.classList.add("error");

        // Add error message
        const errorElement = document.createElement("div");
        errorElement.className = "error-message";
        errorElement.textContent = error.message;
        field.parentNode.appendChild(errorElement);
      }
    });
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors() {
    // Remove error classes
    document.querySelectorAll(".error").forEach((element) => {
      element.classList.remove("error");
    });

    // Remove error messages
    document.querySelectorAll(".error-message").forEach((element) => {
      element.remove();
    });
  }

  /**
   * Handle global errors
   * @param {CustomEvent} event
   */
  handleGlobalError(event) {
    const { error, context } = event.detail;
    console.error("Global error:", error, context);

    // Show user-friendly error message
    this.showError(error.getUserMessage());
  }

  /**
   * Clear search and show all persons
   */
  clearSearch() {
    const searchInput = document.getElementById("filtro-nome");
    if (searchInput) {
      searchInput.value = "";
      this.toggleClearButton("");
      this.renderPersonList("");
      searchInput.focus();
    }
  }

  /**
   * Toggle clear search button visibility
   * @param {string} value
   */
  toggleClearButton(value) {
    const clearBtn = document.getElementById("clear-search");
    if (clearBtn) {
      if (value.trim()) {
        clearBtn.classList.add("visible");
      } else {
        clearBtn.classList.remove("visible");
      }
    }
  }

  /**
   * Highlight person card after save/update
   * @param {string} personId
   */
  highlightPersonCard(personId) {
    setTimeout(() => {
      const card = document.querySelector(`[data-person-id="${personId}"]`);
      if (card) {
        card.classList.add("highlight-success");
        card.scrollIntoView({ behavior: "smooth", block: "center" });

        // Remove highlight after animation
        setTimeout(() => {
          card.classList.remove("highlight-success");
        }, 3000);
      }
    }, 100);
  }

  /**
   * Undo delete operation (placeholder for future implementation)
   * @param {string} personId
   */
  async undoDelete() {
    try {
      if (!this.lastDeletedPerson) {
        this.showWarning("Nenhuma exclusão recente para desfazer");
        return;
      }

      const { person, index } = this.lastDeletedPerson;

      // Re-add the person at the original position or at the end
      await this.dataManager.addPerson(person);

      this.showSuccess(`${person.nome} foi restaurado com sucesso!`);
      this.renderPersonList();
      this.highlightPersonCard(person.id);

      // Clear the undo data
      this.lastDeletedPerson = null;
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Undo delete",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Alt + T: Toggle theme
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        this.themeManager.toggleTheme();
        this.announceToScreenReader("Tema alterado");
      }

      // Alt + S: Focus search
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        const searchInput = document.getElementById("filtro-nome");
        if (searchInput) {
          searchInput.focus();
          this.announceToScreenReader("Campo de busca focado");
        }
      }

      // Alt + N: Focus name input (new person)
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        const nameInput = document.getElementById("nome");
        if (nameInput) {
          nameInput.focus();
          this.announceToScreenReader("Formulário de cadastro focado");
        }
      }

      // Escape: Clear form or search
      if (e.key === "Escape") {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === "filtro-nome") {
          this.clearSearch();
          this.announceToScreenReader("Busca limpa");
        } else if (this.currentEditIndex !== null) {
          this.clearForm();
          this.announceToScreenReader("Formulário limpo");
        }
      }
    });

    // Arrow key navigation for person list
    const personList = document.getElementById("lista-pessoas");
    if (personList) {
      personList.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          this.navigatePersonList(e.key === "ArrowDown" ? 1 : -1);
        }
      });
    }
  }

  /**
   * Setup accessibility features
   */
  setupAccessibilityFeatures() {
    // Detect keyboard usage
    document.addEventListener("keydown", () => {
      document.body.classList.add("keyboard-user");
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-user");
    });

    // Add skip link
    const skipLink = document.createElement("a");
    skipLink.href = "#main-title";
    skipLink.className = "skip-link";
    skipLink.textContent = "Pular para o conteúdo principal";
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Setup ARIA live regions
    this.setupAriaLiveRegions();
  }

  /**
   * Setup ARIA live regions for announcements
   */
  setupAriaLiveRegions() {
    // Create announcement region
    const announcer = document.createElement("div");
    announcer.id = "announcer";
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    document.body.appendChild(announcer);

    // Create alert region
    const alerter = document.createElement("div");
    alerter.id = "alerter";
    alerter.setAttribute("aria-live", "assertive");
    alerter.setAttribute("aria-atomic", "true");
    alerter.className = "sr-only";
    document.body.appendChild(alerter);
  }

  /**
   * Announce message to screen readers
   * @param {string} message
   * @param {boolean} isAlert
   */
  announceToScreenReader(message, isAlert = false) {
    const regionId = isAlert ? "alerter" : "announcer";
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        region.textContent = "";
      }, 1000);
    }
  }

  /**
   * Navigate person list with keyboard
   * @param {number} direction
   */
  navigatePersonList(direction) {
    const personCards = document.querySelectorAll(".person-card");
    if (personCards.length === 0) return;

    const currentIndex = Array.from(personCards).findIndex((card) =>
      card.contains(document.activeElement)
    );

    let newIndex;
    if (currentIndex === -1) {
      newIndex = direction > 0 ? 0 : personCards.length - 1;
    } else {
      newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = personCards.length - 1;
      if (newIndex >= personCards.length) newIndex = 0;
    }

    const targetCard = personCards[newIndex];
    const firstButton = targetCard.querySelector("button");
    if (firstButton) {
      firstButton.focus();
    }
  }

  /**
   * Export data to file
   */
  async exportData() {
    try {
      this.dataManager.exportData();
      this.showSuccess("Dados exportados com sucesso!");
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Export data",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Import data from file
   * @param {File} file
   */
  async importData(file) {
    try {
      const result = await this.dataManager.importData(file);

      // Show confirmation modal
      const confirmed = await confirmationModal.show({
        title: "Confirmar importação",
        message: `Importar ${result.persons.length} registros? Isso substituirá todos os dados atuais.`,
        confirmText: "Importar",
        cancelText: "Cancelar",
        type: "warning",
        details: {
          "Registros válidos": result.validation.validRecords,
          "Registros inválidos": result.validation.invalidRecords,
          "Total de registros atuais": this.dataManager.getAllPersons().length,
        },
      });

      if (!confirmed) {
        return;
      }

      await this.dataManager.replaceAllData(result.persons);
      this.showSuccess(
        `${result.persons.length} registros importados com sucesso!`
      );
      this.renderPersonList();
    } catch (error) {
      const appError = globalErrorHandler.handleError(error, {
        context: "Import data",
      });
      this.showError(appError.getUserMessage());
    }
  }

  /**
   * Get application statistics
   * @returns {Object}
   */
  getStats() {
    if (!this.isInitialized) {
      return { error: "Application not initialized" };
    }

    return {
      persons: this.dataManager.getStorageStats(),
      errors: globalErrorHandler.getErrorStats(),
      theme: this.themeManager.getCurrentTheme(),
      backups: this.dataManager.getBackupInfo(),
    };
  }
}

// Make app and components globally available for onclick handlers
window.app = null;
window.notificationSystem = notificationSystem;
window.confirmationModal = confirmationModal;
