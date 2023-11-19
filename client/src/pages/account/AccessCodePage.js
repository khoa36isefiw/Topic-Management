import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import { WebError } from '../../services/WebService';

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await AuthService.verifyCode(email, code, password, repeat);
      navigate('/auth/login');
    } catch (err) {
      console.log(err);
      if (err instanceof WebError) {
        setError(t(err.code));
      } else {
        setError(t('error.unknown'));
      }
    }
  };

  return (
    <Card style={{ width: '30rem' }}>
      <Card.Body>
        <Form onSubmit={handleLogin}>
          <h1 className='display-5'>Enter access code</h1>
          <p>Type in your email together with the access code provided to you.</p>
          <p>You will be redirected to the login screen once all details are provided correctly.</p>
          <Form.Group className='mb-3' controlId='formEmail'>
            <Form.Label>Email address</Form.Label>
            <Form.Control type='email' value={email} onChange={e => setEmail(e.target.value)} />
          </Form.Group>
          <Form.Group className='mb-3' controlId='formCode'>
            <Form.Label>Access code</Form.Label>
            <Form.Control type='text' value={code} onChange={e => setCode(e.target.value)} />
          </Form.Group>    
          <Form.Group className='mb-3' controlId='formPassword'>
            <Form.Label>Password</Form.Label>
            <Form.Control type='password' value={password} onChange={e => setPassword(e.target.value)} />
          </Form.Group>
          <Form.Group className='mb-3' controlId='formRepeat'>
            <Form.Label>Repeat Password</Form.Label>
            <Form.Control type='password' value={repeat} onChange={e => setRepeat(e.target.value)} />
          </Form.Group>
          { error && <Alert variant='danger' dismissible>{error}</Alert> }
          <p>Have an activated account? <Link to='/auth/login'>Sign in here</Link>.</p>
          <Button variant='primary' type='submit'>Submit</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default LoginPage;
