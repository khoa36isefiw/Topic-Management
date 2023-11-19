import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import NavItem from 'react-bootstrap/NavItem';
import NavLink from 'react-bootstrap/NavLink';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Row from 'react-bootstrap/Row';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { Search } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { LinkContainer } from 'react-router-bootstrap';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ProfileImage from '../components/ProfileImage';
import NotificationContext from '../contexts/NotificationContext';
import { useAccount } from '../providers/account';
import AuthService from '../services/AuthService';
import SearchBox from '../components/SearchBox';
import { Typeahead } from 'react-bootstrap-typeahead';
import Modal from 'react-bootstrap/Modal';

function MainLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { account } = useAccount();
  const [selected, setSelected] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toastTimer, setToastTimer] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/auth/login');
  };

  const handleResult = (type, value) => {
    navigate(`/thesis/${value._id}`);
    setSelected([]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setToastTimer(Date.now());
      setNotifications(prev => {
        const time = Date.now();
        return prev.filter(e => !e.delay || e.timestamp + e.delay >= time);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const pushNotification = notification => {
    setNotifications(prev => {
      const { category, title, message, delay } = notification;
      const next = [...prev];
      const timestamp = Date.now();
      const obj = { id: timestamp, timestamp, category, title, message, delay: delay !== undefined ? delay : 5000 };
      next.push(obj);
      return next;
    });
  };

  const removeNotification = notificationID => {
    setNotifications(prev => {
      return prev.filter(e => e.id !== notificationID);
    });
  };

  const sidebar = kind => {
    switch (kind) {
      case 'administrator':
        return [
          { name: 'Home', path: '/' },
          { name: 'Defense', path: '/defense' },
          { name: 'Announcements', path: '/announcement' },
          { name: 'Thesis Projects', path: '/thesis' },
          { name: 'Accounts', path: '/account' },
          { name: 'Schedule', path: '/schedule' }
        ];
      case 'faculty':
        return [
          { name: 'Home', path: '/' },
          { name: 'Defense', path: '/defense' },
          { name: 'Thesis Projects', path: '/thesis' },
          { name: 'Schedule', path: '/schedule' }
        ];
      case 'student':
      default:
        return [
          { name: 'Home', path: '/' },
          { name: 'Defense', path: '/defense' },
          { name: 'My Thesis', path: '/thesis/my' },
          { name: 'Schedule', path: '/schedule' }
        ];
    }
  }

  return (
    <>
      <Modal show={showSearch} size='xl' onHide={() => setShowSearch(false)}>
        <Modal.Header closeButton>
          Search
        </Modal.Header>
        <Modal.Body>
          <SearchBox
            autoFocus
            typeFilter={{
              theses: true,
              accounts: account && account.kind === 'administrator'
            }}
            placeholder={account && account.kind === 'administrator' ? 'Search theses, accounts...' : 'Search theses...'}
            onResult={handleResult}
          />
        </Modal.Body>
      </Modal>
      <NotificationContext.Provider value={{ notifications, pushNotification }}>
        <ToastContainer id={`toast-${toastTimer}`} className='position-fixed bottom-0 end-0 mb-4 me-4' style={{ zIndex: 11 }}>
          {
            notifications.map(e => (
              <Toast onClose={() => removeNotification(e.id)} animation>
                <Toast.Header>
                  <strong className='me-auto'>{e.title}</strong>
                  <small>{dayjs(e.id).fromNow()}</small>
                </Toast.Header>
                <Toast.Body>{e.message}</Toast.Body>
              </Toast>
            ))
          }
        </ToastContainer>
        <Navbar bg="light" expand="lg">
          <Container>
            <LinkContainer to='/'>
              <Navbar.Brand className='fw-bold fs-4'>AnimoPlan</Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end w-100">
              <Nav className="ms-3">
                <Button className='me-2' variant='link' onClick={() => setShowSearch(true)}><Search /></Button>
                <Dropdown align="end" as={NavItem} id="account-dropdown">
                  <Dropdown.Toggle as={NavLink}>
                    <ProfileImage
                      roundedCircle
                      thumbnail
                      className='me-1'
                      accountID={account.accountID}
                      width={30}
                    />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <ProfileImage
                      roundedCircle
                      className='mx-5 my-3'
                      accountID={account.accountID}
                      width={120}
                    />
                    <div className='text-center'>{t('values.full_name_regular', account)}</div>
                    <div className='text-center text-muted'>{t(`values.account_kind.${account.kind}`)} account</div>
                    <NavDropdown.Divider />
                    <LinkContainer to='/settings'>
                      <NavDropdown.Item>Settings</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>Sign out</NavDropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container>
          <Row className='bg-white' style={{ minHeight: '100vh' }}>
            <Col sm={4} md={3} lg={2} className='pt-3 pb-5 px-3' style={{ backgroundColor: '#f8f8f8' }}>
              <Nav variant='pills' className='flex-column' activeKey={location.pathname}>
                {
                  sidebar(account.kind).map(e => (
                    <LinkContainer to={e.path}>
                      <Nav.Link eventKey={e.path} className='fw-semibold'>{e.name}</Nav.Link>
                    </LinkContainer>
                  ))
                }
              </Nav>
            </Col>
            <Col sm={8} md={9} lg={10} className='pt-3 pb-5'>
              <Outlet />
            </Col>
          </Row>
        </Container>
      </NotificationContext.Provider>
    </>
  );
}

export default MainLayout;
