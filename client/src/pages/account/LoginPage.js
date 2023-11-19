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
import './LoginPage.css'
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
    <div style={{position:'relative'}}>
      <div style={{margin: '36px 64px'}}>
        <img src='https://fit.hcmute.edu.vn/Resources/Images/SubDomain/fit/logo-cntt2021.png' alt='Khoa CNTT UTE' width={'50%'} height={'50%'} />
      </div>
      <Card style={{ width: '40rem', height:'40rem', position:'absolute', top: '10%', left:'50%', content:'', marginLeft:'96px'}}>
        <Card.Body>
          <Form onSubmit={handleLogin} className='login-form-control'>
            <h1 className='display-5 ' style={{marginTop:'24px', textAlign:'center', fontWeight:'bold'}}>Sign in</h1>
            <Form.Group className='mb-3 login-form-control' controlId='formUserID'>
              <Form.Label  >Email</Form.Label>
              <Form.Control style={{padding:'12px'}} type='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='Enter Your Email...'/>
            </Form.Group>
            <Form.Group className='mb-3 login-form-control' controlId='formPassword'>
              <Form.Label>Password</Form.Label>
              <Form.Control style={{padding:'12px', marginBottom:'12px'}} type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder='Enter Your Password...'/>
            </Form.Group>
            { error && <Alert variant='danger' dismissible>{error}</Alert> }
            {/*<p>No account? <Link to='/auth/register'>Register here</Link>.</p>*/}
            <p><Link to='/auth/code' style={{textDecoration:'none', marginTop: '24px'}}>Activate with access code</Link></p>
            <Button variant='primary'  type='submit' style={{padding: '8px 24px', fontSize:'18px', fontWeight:'bold', margin:'0 auto'}}>Sign in</Button>
          </Form>
      </Card.Body>

      </Card>
    </div>
  );
}

export default LoginPage;


