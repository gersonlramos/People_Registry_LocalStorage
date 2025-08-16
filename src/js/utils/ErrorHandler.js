/**
 * Error types enumeration
 */
export const ErrorTypes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  STORAGE_QUOTA_ERROR: "STORAGE_QUOTA_ERROR",
  DUPLICATE_ERROR: "DUPLICATE_ERROR",
  THEME_ERROR: "THEME_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, details = {}) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get user-friendly error message
   * @returns {string}
   */
  getUserMessage() {
    switch (this.type) {
      case ErrorTypes.VALIDATION_ERROR:
        return this.message;
      case ErrorTypes.STORAGE_ERROR:
        return "Erro ao acessar o armazenamento local. Tente novamente.";
      case ErrorTypes.STORAGE_QUOTA_ERROR:
        return "Armazenamento local cheio. Remova alguns registros para continuar.";
      case ErrorTypes.DUPLICATE_ERROR:
        return this.message;
      case ErrorTypes.THEME_ERROR:
        return "Erro ao alterar tema. Usando tema padrão.";
      case ErrorTypes.NETWORK_ERROR:
        return "Erro de conexão. Verifique sua internet.";
      default:
        return "Ocorreu um erro inesperado. Tente novamente.";
    }
  }

  /**
   * Get error severity level
   * @returns {string}
   */
  getSeverity() {
    switch (this.type) {
      case ErrorTypes.VALIDATION_ERROR:
      case ErrorTypes.DUPLICATE_ERROR:
        return "warning";
      case ErrorTypes.STORAGE_QUOTA_ERROR:
      case ErrorTypes.NETWORK_ERROR:
        return "error";
      case ErrorTypes.THEME_ERROR:
        return "info";
      case ErrorTypes.STORAGE_ERROR:
      case ErrorTypes.UNKNOWN_ERROR:
      default:
        return "error";
    }
  }

  /**
   * Convert error to JSON for logging
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Global error handler utility
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.logError(
        new AppError(
          "Unhandled promise rejection: " + event.reason,
          ErrorTypes.UNKNOWN_ERROR,
          { originalError: event.reason }
        )
      );

      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      console.error("Uncaught error:", event.error);
      this.logError(
        new AppError(
          "Uncaught error: " + event.message,
          ErrorTypes.UNKNOWN_ERROR,
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            originalError: event.error,
          }
        )
      );
    });
  }

  /**
   * Handle and process errors
   * @param {Error|AppError} error
   * @param {Object} context
   * @returns {AppError}
   */
  handleError(error, context = {}) {
    let appError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = new AppError(
        error.message || "Unknown error occurred",
        ErrorTypes.UNKNOWN_ERROR,
        { originalError: error, context }
      );
    }

    // Log the error
    this.logError(appError);

    // Dispatch error event for UI components to handle
    window.dispatchEvent(
      new CustomEvent("appError", {
        detail: {
          error: appError,
          context: context,
        },
      })
    );

    return appError;
  }

  /**
   * Log error to internal log
   * @param {AppError} error
   */
  logError(error) {
    this.errorLog.unshift({
      ...error.toJSON(),
      id: this.generateErrorId(),
    });

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging for development
    if (
      typeof process !== "undefined" &&
      process.env &&
      (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)
    ) {
      console.error("AppError:", error);
    } else if (
      typeof process === "undefined" &&
      (typeof window !== "undefined" || typeof global !== "undefined")
    ) {
      // Fallback for browser environments
      console.error("AppError:", error);
    }
  }

  /**
   * Generate unique error ID
   * @returns {string}
   */
  generateErrorId() {
    return (
      "error_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Get error log
   * @param {number} limit
   * @returns {Array}
   */
  getErrorLog(limit = 10) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object}
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(0, 5),
    };

    this.errorLog.forEach((error) => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Count by severity (approximate based on type)
      const severity = this.getSeverityForType(error.type);
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get severity for error type
   * @param {string} type
   * @returns {string}
   */
  getSeverityForType(type) {
    switch (type) {
      case ErrorTypes.VALIDATION_ERROR:
      case ErrorTypes.DUPLICATE_ERROR:
        return "warning";
      case ErrorTypes.STORAGE_QUOTA_ERROR:
      case ErrorTypes.NETWORK_ERROR:
        return "error";
      case ErrorTypes.THEME_ERROR:
        return "info";
      default:
        return "error";
    }
  }

  /**
   * Create safe async wrapper
   * @param {Function} asyncFn
   * @param {Object} context
   * @returns {Function}
   */
  wrapAsync(asyncFn, context = {}) {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }

  /**
   * Create safe sync wrapper
   * @param {Function} fn
   * @param {Object} context
   * @returns {Function}
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }
}

// Create global error handler instance
export const globalErrorHandler = new ErrorHandler();
