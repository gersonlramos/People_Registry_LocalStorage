import { AppError, ErrorTypes } from "../utils/ErrorHandler.js";

/**
 * Theme manager for handling light/dark mode switching
 */
export class ThemeManager {
  constructor() {
    this.storageKey = "selectedTheme";
    this.themes = {
      light: {
        name: "light",
        colors: {
          primary: "#F8FAFC",
          secondary: "#D9EAFD",
          accent: "#BCCCDC",
          dark: "#9AA6B2",
        },
      },
      dark: {
        name: "dark",
        colors: {
          primary: "#17153B",
          secondary: "#2E236C",
          accent: "#433D8B",
          light: "#C8ACD6",
        },
      },
    };

    this.currentTheme = this.loadTheme();
    this.initializeTheme();
  }

  /**
   * Get current theme
   * @returns {string}
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme
   * @param {string} theme
   */
  setTheme(theme) {
    try {
      if (!this.themes[theme]) {
        throw new AppError(
          `Tema inválido: ${theme}`,
          ErrorTypes.VALIDATION_ERROR
        );
      }

      this.currentTheme = theme;
      this.applyTheme(theme);
      this.saveTheme(theme);

      // Update toggle icon
      this.updateToggleIcon();

      // Dispatch theme change event
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { theme: theme, colors: this.themes[theme].colors },
        })
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao definir tema: " + error.message,
        ErrorTypes.THEME_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  /**
   * Apply theme to the document
   * @param {string} theme
   */
  applyTheme(theme) {
    try {
      const themeConfig = this.themes[theme];
      if (!themeConfig) {
        throw new AppError(
          `Configuração de tema não encontrada: ${theme}`,
          ErrorTypes.THEME_ERROR
        );
      }

      // Set CSS custom properties
      const root = document.documentElement;
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Set theme class on body
      document.body.className =
        document.body.className.replace(/theme-\w+/g, "") + ` theme-${theme}`;

      // Set data attribute for CSS targeting
      document.documentElement.setAttribute("data-theme", theme);
    } catch (error) {
      throw new AppError(
        "Erro ao aplicar tema: " + error.message,
        ErrorTypes.THEME_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Load theme from localStorage
   * @returns {string}
   */
  loadTheme() {
    try {
      const savedTheme = localStorage.getItem(this.storageKey);

      // Check if saved theme is valid
      if (savedTheme && this.themes[savedTheme]) {
        return savedTheme;
      }

      // Default to system preference or light theme
      return this.getSystemPreference();
    } catch (error) {
      console.warn("Error loading theme from storage:", error);
      return "light"; // Fallback to light theme
    }
  }

  /**
   * Save theme to localStorage
   * @param {string} theme
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn("Error saving theme to storage:", error);
      // Don't throw error for theme saving failures
    }
  }

  /**
   * Get system theme preference
   * @returns {string}
   */
  getSystemPreference() {
    try {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
      return "light";
    } catch (error) {
      return "light"; // Fallback
    }
  }

  /**
   * Initialize theme system
   */
  initializeTheme() {
    try {
      // Apply current theme
      this.applyTheme(this.currentTheme);

      // Setup theme toggle button
      this.setupThemeToggle();

      // Listen for system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", (e) => {
          // Only auto-switch if user hasn't manually set a theme
          const savedTheme = localStorage.getItem(this.storageKey);
          if (!savedTheme) {
            const systemTheme = e.matches ? "dark" : "light";
            this.setTheme(systemTheme);
          }
        });
      }
    } catch (error) {
      console.error("Error initializing theme system:", error);
    }
  }

  /**
   * Setup theme toggle button
   */
  setupThemeToggle() {
    const toggleButton = document.getElementById("theme-toggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        this.toggleTheme();
      });

      // Update button icon based on current theme
      this.updateToggleIcon();
    }
  }

  /**
   * Update theme toggle icon
   */
  updateToggleIcon() {
    const toggleButton = document.getElementById("theme-toggle");
    const themeIcon = toggleButton?.querySelector(".theme-icon");

    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === "light" ? "🌙" : "☀️";
      toggleButton.setAttribute(
        "aria-label",
        this.currentTheme === "light"
          ? "Mudar para tema escuro"
          : "Mudar para tema claro"
      );
    }
  }

  /**
   * Get theme configuration
   * @param {string} theme
   * @returns {Object|null}
   */
  getThemeConfig(theme) {
    return this.themes[theme] || null;
  }

  /**
   * Get all available themes
   * @returns {Object}
   */
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  /**
   * Check if theme is valid
   * @param {string} theme
   * @returns {boolean}
   */
  isValidTheme(theme) {
    return Boolean(this.themes[theme]);
  }

  /**
   * Reset theme to system default
   */
  resetToSystemDefault() {
    const systemTheme = this.getSystemPreference();
    localStorage.removeItem(this.storageKey);
    this.setTheme(systemTheme);
  }

  /**
   * Get current theme colors
   * @returns {Object}
   */
  getCurrentThemeColors() {
    return this.themes[this.currentTheme]?.colors || {};
  }

  /**
   * Add custom theme (for future extensibility)
   * @param {string} name
   * @param {Object} config
   */
  addCustomTheme(name, config) {
    try {
      if (!name || typeof name !== "string") {
        throw new AppError(
          "Nome do tema deve ser uma string válida",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      if (!config || !config.colors) {
        throw new AppError(
          "Configuração do tema deve conter propriedade colors",
          ErrorTypes.VALIDATION_ERROR
        );
      }

      this.themes[name] = {
        name: name,
        colors: config.colors,
        custom: true,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Erro ao adicionar tema customizado: " + error.message,
        ErrorTypes.THEME_ERROR,
        { originalError: error }
      );
    }
  }
}
