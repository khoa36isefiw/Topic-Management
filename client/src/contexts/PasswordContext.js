import React from 'react';

const PasswordContext = React.createContext({
  password: '',
  visible: false,
  setPassword: (value) => {},
  setVisible: (value) => {}
});

const usePassword = () => {
  return React.useContext(PasswordContext);
};

export default PasswordContext;
export { usePassword };
