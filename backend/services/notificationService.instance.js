// Singleton instance of NotificationService
// This allows other services and routes to access the same notification service instance

let notificationServiceInstance = null;

const getNotificationService = () => {
  if (!notificationServiceInstance) {
    console.warn('NotificationService instance not initialized. Some features may not work.');
  }
  return notificationServiceInstance;
};

const setNotificationService = (instance) => {
  notificationServiceInstance = instance;
};

module.exports = {
  getNotificationService,
  setNotificationService
};