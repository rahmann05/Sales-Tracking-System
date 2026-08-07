/**
 * Notification Service
 * Single Responsibility: Centralize user-facing notifications (alerts).
 * Open/Closed: Replace `alert` with a toast library later without changing consumers.
 */

/**
 * Show a success notification.
 * @param {string} message
 */
export const notifySuccess = (message) => {
    // TODO: Replace with toast library (e.g., react-toastify, sonner)
    alert(message);
};

/**
 * Show an error notification.
 * @param {string} message
 */
export const notifyError = (message) => {
    // TODO: Replace with toast library
    alert(`Error: ${message}`);
};

/**
 * Show an info notification.
 * @param {string} message
 */
export const notifyInfo = (message) => {
    // TODO: Replace with toast library
    alert(message);
};
