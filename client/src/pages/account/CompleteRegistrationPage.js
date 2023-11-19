import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { Link, useSearchParams } from 'react-router-dom';
import WebService from '../../services/WebService';

function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  const validToken = !!token;

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    await WebService.postJson('/auth/verify', { password, repeat, token });
    setShowNew(true);
  };

  return (
    <>
      <Card style={{ width: '30rem' }}>
        <Card.Body>
          {
            showNew ? 
              <p>Your account is now successfuly activated. <Link to='/auth/login'>Sign in here</Link>.</p> :
              (validToken ?
                <Form onSubmit={handleRegister}>
                  <h1 className='display-5'>Activate account</h1>
                  <Form.Group className='mb-3' controlId='formPassword'>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' value={password} onChange={e => setPassword(e.target.value)} />
                  </Form.Group>
                  <Form.Group className='mb-3' controlId='formRepeat'>
                    <Form.Label>Repeat Password</Form.Label>
                    <Form.Control type='password' value={repeat} onChange={e => setRepeat(e.target.value)} />
                  </Form.Group>
                  { error && <Alert color='danger'>{error}</Alert> }
                  <Button variant='primary' type='submit'>Register</Button>
                </Form> :
                <p>Received an invalid token</p>)
          }
        </Card.Body>
      </Card>
    </>
  );
}

export default CompleteRegistrationPage;
