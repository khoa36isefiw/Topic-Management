import { useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileImage from '../components/ProfileImage';
import AccountService from '../services/AccountService';
import { useNotification } from '../contexts/NotificationContext';

function AccountPage() {
  const { aid } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [password, setPassword] = useState(''); // TODO: fix registration
  const [accessCode, setAccessCode] = useState(123);
  const [type, setType] = useState('');
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [backToList, setBackToList] = useState(true);
  const { pushNotification } = useNotification();
  /* const [image, setImage] = useState(null);
  const imageRef = useRef(); */

  const isNew = !aid;

  useEffect(() => {
    if (account) {
      setEmail(account.email);
      setLastName(account.lastName);
      setFirstName(account.firstName);
      setMiddleName(account.middleName);
      setType(account.kind);
      setLocked(!!account.locked);
      setAccessCode(account.accessCode);
    }
  }, [account]);

  const load = async () => {
    if (aid) {
      setAccount(await AccountService.getAccount(aid));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(accessCode);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!aid) {
      try {
        setSaving(true);
        const account = await AccountService.createAccount({ email, lastName, firstName, middleName, password, kind: type });
        if (backToList) {
          pushNotification({
            title: 'Account created',
            message: `Account ${t('values.full_name', { firstName, lastName })} has been created.`
          });
          navigate('/account', { replace: true });
        } else {
          navigate(`/account/${account._id}`, { replace: true });
        }
      } catch (error) {
        setError(error.code ? t(error.code) : error.message);
      } finally {
        setSaving(false);
      }
    } else {
      try {
        setSaving(true);
        const account = await AccountService.updateAccount(aid, { lastName, firstName, middleName, newPassword: password });
        if (backToList) {
          pushNotification({
            title: 'Account updated',
            message: `Account ${t('values.full_name', { firstName, lastName })} has been updated.`
          });
          navigate('/account', { replace: true });
        } else {
          navigate(`/account/${account._id}`, { replace: true });
        }
      } catch (error) {
        setError(error.code ? t(error.code) : error.message);
      } finally {
        setSaving(false);
      }
    }
  };
  
  /* const handleImage = (event) => {

  }; */

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Form onSubmit={handleSave}>
        <Row>
          <Col>
            <h3>{ isNew ? 'Add new' : 'Edit' } account</h3>
          </Col>
          <Col className='d-flex flex-column align-items-end'>
            <div className='d-flex flex-row align-items-center'>
              { saving && <Spinner className='me-2' /> }
              <Button type='submit' className='ms-auto d-inline' disabled={saving}>Save</Button>
              <Button variant='secondary' className='ms-2 d-inline' onClick={() => navigate(-1)}>Back</Button>
            </div>
          </Col>
        </Row>
        <Row>
          { error && <Alert variant='danger' onClose={() => setError('')} dismissible>{error}</Alert> }
        </Row>
        <Row>
          <Col md={isNew ? 12 : 8}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="text" value={email} onChange={e => setEmail(e.currentTarget.value)} readOnly={!isNew} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formType">
              <Form.Label>Type</Form.Label>
              <Form.Select value={type} onChange={e => setType(e.currentTarget.value)} disabled={!isNew}>
                <option value=''>--- Select type ---</option>
                <option value='student'>Student</option>
                <option value='faculty'>Faculty</option>
                <option value='administrator'>Administrator</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formLastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" value={lastName} onChange={e => setLastName(e.currentTarget.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" value={firstName} onChange={e => setFirstName(e.currentTarget.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formMiddleName">
              <Form.Label>Middle Name</Form.Label>
              <Form.Control type="text" value={middleName} onChange={e => setMiddleName(e.currentTarget.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formMiddleName">
              <Form.Label>Password</Form.Label>
              <Form.Control type="text" value={password} onChange={e => setPassword(e.currentTarget.value)} />
            </Form.Group>
            {
              !isNew && (
                <Form.Group className="mb-3" controlId="formAccessCode">
                  <Form.Label>Access Code</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control type='text' value={accessCode} disabled readOnly />
                    </Col>
                    <Col>
                      <Button className='me-2' onClick={handleCopy}>Copy to clipboard</Button>
                    </Col>
                  </Row>
                </Form.Group>
              )
            }
            <Form.Group className="mb-3" controlId="formActive">
              <Form.Check type='checkbox' checked={!locked} onChange={e => setLocked(!e.currentTarget.checked)} label='Active' />
            </Form.Group>
          </Col>
          {
            !isNew && account && (
              <Col md={4} className='d-flex flex-column align-items-end'>
                <ProfileImage
                  width='224px'
                  rounded
                  accountID={account.accountID}
                />
              </Col>
            )
          }
        </Row>
        <Row>
        </Row>
      </Form>
    </>
  );
}

export default AccountPage;
