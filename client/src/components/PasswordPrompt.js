import { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

function PasswordPrompt(props) {
  const { show, onSubmit, onCancel } = props;
  const [password, setPassword] = useState('');
  const passwordRef = useRef(null);

  const doSubmit = e => {
    e.preventDefault();
    const entered = password;
    setPassword('');
    if (onSubmit) {
      onSubmit(entered);
    }
  };

  const doCancel = () => {
    setPassword('');
    if (onCancel) onCancel();
  };

  useEffect(() => {
    if (show && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [show])

  return (
    <Modal show={show} animation={false} centered>
      <Modal.Header>
        <Modal.Title>Retype your password</Modal.Title>
      </Modal.Header>
      <Form onSubmit={doSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="formPasswordReauth">
            <Form.Control
              type='password'
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              placeholder='Password'
              ref={passwordRef}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type='submit'>Continue</Button>
          <Button variant='secondary' onClick={doCancel}>Cancel</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default PasswordPrompt;
