import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import PasswordContext, { usePassword } from '../../contexts/PasswordContext';

function PasswordText(props) {
  const { password, setPassword, visible } = usePassword();
  return (
    <Form.Control
      type={visible ? 'text' : 'password'}
      value={password}
      setPassword={e => setPassword(e.currentTarget.value)}
      {...props}
    />
  );
}

function PasswordToggler(props) {
  const { label, ...rest } = props;
  const { visible, setVisible } = usePassword();
  return (
    <Form.Check
      type='checkbox'
      checked={visible}
      onChange={e => setVisible(e.currentTarget.checked)}
      label={label || 'Show password'}
      {...rest}
    />
  );
}

function PasswordField(props) {
  const {
    children,
    value,
    onChange,
    visible,
    onToggleVisibility
  } = props;

  const [visibleValue, setVisibleValue] = useState(false);

  return (
    <PasswordContext.Provider
      value={{
        password: value || null, setPassword: onChange || (() => {}),
        visible: (typeof visible === 'boolean' ? visible : visibleValue),
        setVisible: (typeof visible === 'boolean' && onToggleVisibility ? onToggleVisibility : setVisibleValue)
      }}
    >
      {children}
    </PasswordContext.Provider>
  )
}

export default PasswordField;
export { PasswordText, PasswordToggler };
