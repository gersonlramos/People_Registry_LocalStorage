/**
 * Confirmation modal component
 */
export class ConfirmationModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.currentResolve = null;
    this.currentReject = null;
  }

  /**
   * Show confirmation modal
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  show(options = {}) {
    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      const config = {
        title: options.title || "Confirmar ação",
        message: options.message || "Tem certeza que deseja continuar?",
        confirmText: options.confirmText || "Confirmar",
        cancelText: options.cancelText || "Cancelar",
        type: options.type || "warning", // warning, danger, info
        details: options.details || null,
        ...options,
      };

      this.render(config);
      this.open();
    });
  }

  /**
   * Show delete confirmation
   * @param {Object} item
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  confirmDelete(item, options = {}) {
    return this.show({
      title: "Confirmar exclusão",
      message: `Tem certeza que deseja remover ${item.nome}?`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      type: "danger",
      details: {
        Nome: item.nome,
        Email: item.email,
        Telefone: item.telefone,
        "Data de nascimento": new Date(item.dataNascimento).toLocaleDateString(
          "pt-BR"
        ),
      },
      ...options,
    });
  }

  /**
   * Render modal
   * @param {Object} config
   */
  render(config) {
    // Remove existing modal
    this.destroy();

    // Create modal elements
    this.modal = document.createElement("div");
    this.modal.className = "confirmation-modal-overlay";

    const detailsHtml = config.details
      ? `
            <div class="confirmation-details">
                <h4>Detalhes do registro:</h4>
                <dl class="details-list">
                    ${Object.entries(config.details)
                      .map(
                        ([key, value]) => `
                        <dt>${key}:</dt>
                        <dd>${value}</dd>
                    `
                      )
                      .join("")}
                </dl>
            </div>
        `
      : "";

    this.modal.innerHTML = `
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <div class="confirmation-icon confirmation-icon-${
                      config.type
                    }">
                        ${this.getIcon(config.type)}
                    </div>
                    <h3 class="confirmation-title">${config.title}</h3>
                </div>
                <div class="confirmation-body">
                    <p class="confirmation-message">${config.message}</p>
                    ${detailsHtml}
                </div>
                <div class="confirmation-actions">
                    <button class="confirmation-btn confirmation-btn-cancel" data-action="cancel">
                        ${config.cancelText}
                    </button>
                    <button class="confirmation-btn confirmation-btn-confirm confirmation-btn-${
                      config.type
                    }" data-action="confirm">
                        ${config.confirmText}
                    </button>
                </div>
            </div>
        `;

    // Add event listeners
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.cancel();
      }
    });

    this.modal
      .querySelector('[data-action="cancel"]')
      .addEventListener("click", () => {
        this.cancel();
      });

    this.modal
      .querySelector('[data-action="confirm"]')
      .addEventListener("click", () => {
        this.confirm();
      });

    // Handle escape key
    this.handleEscape = (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.cancel();
      }
    };

    document.addEventListener("keydown", this.handleEscape);
    document.body.appendChild(this.modal);
  }

  /**
   * Open modal
   */
  open() {
    if (this.modal) {
      this.isOpen = true;
      document.body.classList.add("modal-open");

      // Trigger animation
      setTimeout(() => {
        this.modal.classList.add("modal-open");
      }, 10);

      // Focus on cancel button by default
      const cancelBtn = this.modal.querySelector('[data-action="cancel"]');
      if (cancelBtn) {
        cancelBtn.focus();
      }
    }
  }

  /**
   * Close modal
   */
  close() {
    if (this.modal && this.isOpen) {
      this.isOpen = false;
      document.body.classList.remove("modal-open");
      this.modal.classList.remove("modal-open");

      setTimeout(() => {
        this.destroy();
      }, 300);
    }
  }

  /**
   * Confirm action
   */
  confirm() {
    if (this.currentResolve) {
      this.currentResolve(true);
      this.currentResolve = null;
      this.currentReject = null;
    }
    this.close();
  }

  /**
   * Cancel action
   */
  cancel() {
    if (this.currentResolve) {
      this.currentResolve(false);
      this.currentResolve = null;
      this.currentReject = null;
    }
    this.close();
  }

  /**
   * Destroy modal
   */
  destroy() {
    if (this.modal) {
      document.removeEventListener("keydown", this.handleEscape);
      if (this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
    }
    document.body.classList.remove("modal-open");
  }

  /**
   * Get icon for modal type
   * @param {string} type
   * @returns {string}
   */
  getIcon(type) {
    const icons = {
      warning: "⚠️",
      danger: "🗑️",
      info: "ℹ️",
      success: "✅",
    };
    return icons[type] || icons.warning;
  }
}

// Create global confirmation modal instance
export const confirmationModal = new ConfirmationModal();
