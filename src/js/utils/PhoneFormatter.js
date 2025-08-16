/**
 * Phone number formatting utilities for Brazilian phone numbers
 */
export class PhoneFormatter {
  /**
   * Format phone number as user types
   * @param {string} value
   * @returns {string}
   */
  static formatAsTyping(value) {
    if (!value) return "";

    // Remove all non-digit characters
    let cleanValue = value.replace(/\D/g, "");

    // Limit to 11 digits
    if (cleanValue.length > 11) {
      cleanValue = cleanValue.slice(0, 11);
    }

    // Apply formatting based on length
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 7) {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    } else if (cleanValue.length <= 11) {
      const areaCode = cleanValue.slice(0, 2);
      const firstPart = cleanValue.slice(2, 7);
      const secondPart = cleanValue.slice(7);
      return `(${areaCode}) ${firstPart}-${secondPart}`;
    }

    return value;
  }

  /**
   * Format phone number for display
   * @param {string} phone
   * @returns {string}
   */
  static formatForDisplay(phone) {
    if (!phone) return "";

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length === 10) {
      // Format: (11) 1234-5678
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(
        2,
        6
      )}-${cleanPhone.slice(6)}`;
    } else if (cleanPhone.length === 11) {
      // Format: (11) 91234-5678
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(
        2,
        7
      )}-${cleanPhone.slice(7)}`;
    }

    return phone; // Return as-is if not a valid Brazilian format
  }

  /**
   * Clean phone number (remove formatting)
   * @param {string} phone
   * @returns {string}
   */
  static clean(phone) {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  }

  /**
   * Validate Brazilian phone number format
   * @param {string} phone
   * @returns {boolean}
   */
  static isValid(phone) {
    if (!phone) return false;

    const cleanPhone = this.clean(phone);

    // Must be 10 or 11 digits
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      return false;
    }

    // Area code must be between 11 and 99
    const areaCode = parseInt(cleanPhone.slice(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return false;
    }

    // For 11-digit numbers, if the third digit is 9, it's a mobile number (valid).
    // If not, allow as valid (could be a landline in some regions).
    // Optionally, you can add more specific checks here if needed.

    return true;
  }

  /**
   * Get phone number type
   * @param {string} phone
   * @returns {string}
   */
  static getType(phone) {
    const cleanPhone = this.clean(phone);

    if (cleanPhone.length === 10) {
      return "landline";
    } else if (cleanPhone.length === 11 && cleanPhone[2] === "9") {
      return "mobile";
    }

    return "unknown";
  }

  /**
   * Create input event handler for phone formatting
   * @returns {Function}
   */
  static createInputHandler() {
    return function (event) {
      const input = event.target;
      const cursorPosition = input.selectionStart;
      const oldValue = input.value;
      const newValue = PhoneFormatter.formatAsTyping(input.value);

      input.value = newValue;

      // Adjust cursor position after formatting
      if (newValue.length > oldValue.length) {
        // Characters were added (formatting), move cursor forward
        input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      } else if (newValue.length < oldValue.length && cursorPosition > 0) {
        // Characters were removed, adjust cursor position
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    };
  }
}
