import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import WebService from '../../services/WebService';

function RegisterPage() {
  /*const [idNumber, setIDNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');*/
  const [email, setEmail] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    await WebService.postJson('/auth/register', { email });
    setShowNew(true);
  };

  return (
    <Card style={{ width: '30rem' }}>
      <Card.Body>
        {
          showNew ?
            <p>An email will be sent to the email address you entered if it is registered.</p> :
            <Form onSubmit={handleRegister}>
              <h1 className='display-5'>Register</h1>
              {/*<Form.Group className='mb-3' controlId='formUserID'>
                <Form.Label>ID number</Form.Label>
                <Form.Control type='text' value={idNumber} onChange={e => setIDNumber(e.target.value)} />
              </Form.Group>
              <Form.Group className='mb-3' controlId='formLastName'>
                <Form.Label>Last name</Form.Label>
                <Form.Control type='text' value={lastName} onChange={e => setLastName(e.target.value)} />
              </Form.Group>
              <Form.Group className='mb-3' controlId='formFirstName'>
                <Form.Label>First name</Form.Label>
                <Form.Control type='text' value={firstName} onChange={e => setFirstName(e.target.value)} />
              </Form.Group>
              <Form.Group className='mb-3' controlId='formMiddleName'>
                <Form.Label>Middle name</Form.Label>
                <Form.Control type='text' value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </Form.Group>*/}
              <Form.Group className='mb-3' controlId='formEmail'>
                <Form.Label>Email</Form.Label>
                <Form.Control type='text' value={email} onChange={e => setEmail(e.target.value)} />
              </Form.Group>
              { error && <Alert color='danger'>{error}</Alert> }
              <p>Have already registered? <Link to='/auth/login'>Sign in here</Link>.</p>
              <Button variant='primary' type='submit'>Submit</Button>
            </Form>
        }
      </Card.Body>
    </Card>
  );
}

export default RegisterPage;
