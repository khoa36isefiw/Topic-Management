import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from '../../providers/account';
import AuthService from '../../services/AuthService';
import { WebError } from '../../services/WebService';

function LoginPage() {
  const { t } = useTranslation();
  const { setAccount } = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const { data } = await AuthService.login(email, password);
      setAccount({
        accountID: data.accountID,
        roles: [],
        kind: data.kind.toLowerCase(),
        lastName: data.lastName,
        firstName: data.firstName
      });
      navigate('/');
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
          <h1 className='display-5'>Sign in</h1>
          <Form.Group className='mb-3' controlId='formUserID'>
            <Form.Label>Email</Form.Label>
            <Form.Control type='email' value={email} onChange={e => setEmail(e.target.value)} />
          </Form.Group>
          <Form.Group className='mb-3' controlId='formPassword'>
            <Form.Label>Password</Form.Label>
            <Form.Control type='password' value={password} onChange={e => setPassword(e.target.value)} />
          </Form.Group>
          { error && <Alert variant='danger' dismissible>{error}</Alert> }
          {/*<p>No account? <Link to='/auth/register'>Register here</Link>.</p>*/}
          <p><Link to='/auth/code'>Activate with access code</Link></p>
          <Button variant='primary' type='submit'>Sign in</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default LoginPage;
