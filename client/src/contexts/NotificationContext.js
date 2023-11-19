import React from 'react';

const NotificationContext = React.createContext({
  notifications: [],
  pushNotification: (notification) => {}
});

const useNotification = () => {
  return React.useContext(NotificationContext);
};

export default NotificationContext;
export { useNotification };
