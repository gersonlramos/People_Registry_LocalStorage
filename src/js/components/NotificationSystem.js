/**
 * Notification system for user feedback
 */
export class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    this.createContainer();
  }

  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.className = "notification-container";
    document.body.appendChild(this.container);
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type
   * @param {Object} options
   */
  show(message, type = "info", options = {}) {
    const notification = {
      id: this.generateId(),
      message,
      type,
      duration: options.duration || this.defaultDuration,
      dismissible: options.dismissible !== false,
      actions: options.actions || [],
      timestamp: new Date(),
    };

    this.notifications.unshift(notification);

    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      const oldNotification = this.notifications.pop();
      this.removeNotificationElement(oldNotification.id);
    }

    this.renderNotification(notification);

    // Auto-dismiss if duration is set
    if (notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  /**
   * Show success notification
   * @param {string} message
   * @param {Object} options
   */
  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  /**
   * Show error notification
   * @param {string} message
   * @param {Object} options
   */
  error(message, options = {}) {
    return this.show(message, "error", {
      duration: 0, // Don't auto-dismiss errors
      ...options,
    });
  }

  /**
   * Show warning notification
   * @param {string} message
   * @param {Object} options
   */
  warning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  /**
   * Show info notification
   * @param {string} message
   * @param {Object} options
   */
  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  /**
   * Dismiss notification
   * @param {string} id
   */
  dismiss(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.removeNotificationElement(id);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    this.notifications.forEach((notification) => {
      this.removeNotificationElement(notification.id);
    });
    this.notifications = [];
  }

  /**
   * Render notification element
   * @param {Object} notification
   */
  renderNotification(notification) {
    const element = document.createElement("div");
    element.id = `notification-${notification.id}`;
    element.className = `notification notification-${notification.type}`;

    const icon = this.getIcon(notification.type);
    const actionsHtml =
      notification.actions.length > 0
        ? `<div class="notification-actions">
                ${notification.actions
                  .map(
                    (action) =>
                      `<button class="notification-action" onclick="${action.handler}">${action.label}</button>`
                  )
                  .join("")}
               </div>`
        : "";

    element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${notification.message}</div>
                ${
                  notification.dismissible
                    ? '<button class="notification-close" onclick="notificationSystem.dismiss(\'' +
                      notification.id +
                      "')\">×</button>"
                    : ""
                }
            </div>
            ${actionsHtml}
            ${
              notification.duration > 0
                ? '<div class="notification-progress"></div>'
                : ""
            }
        `;

    // Add to container
    this.container.appendChild(element);

    // Trigger animation
    setTimeout(() => {
      element.classList.add("notification-enter");
    }, 10);

    // Start progress bar animation if duration is set
    if (notification.duration > 0) {
      const progressBar = element.querySelector(".notification-progress");
      if (progressBar) {
        progressBar.style.animationDuration = `${notification.duration}ms`;
        progressBar.classList.add("notification-progress-active");
      }
    }
  }

  /**
   * Remove notification element
   * @param {string} id
   */
  removeNotificationElement(id) {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.add("notification-exit");
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }

  /**
   * Get icon for notification type
   * @param {string} type
   * @returns {string}
   */
  getIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || icons.info;
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return (
      "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Get notification statistics
   * @returns {Object}
   */
  getStats() {
    return {
      total: this.notifications.length,
      byType: this.notifications.reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {}),
      recent: this.notifications.slice(0, 5),
    };
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.dismissAll();
  }
}

// Create global notification system instance
export const notificationSystem = new NotificationSystem();
