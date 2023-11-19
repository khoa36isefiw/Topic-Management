import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import DefenseCalendar from '../../components/DefenseCalendar';
import DefenseSummaryDialog from '../../components/DefenseSummaryDialog';
import AccountService from '../../services/AccountService';
import DefenseService from '../../services/DefenseService';
import ThesisService from '../../services/ThesisService';
import SearchBox from '../../components/SearchBox';

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [theses, setTheses] = useState([]);
  const [defenses, setDefenses] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    setAccounts(await AccountService.getAccounts());
    setTheses(await ThesisService.getTheses({ all: true, showPending: 'all' }));
    setDefenses(await DefenseService.getDefenses());
  };

  useEffect(() => {
    load();
  }, []);

  const handleResult = (type, value) => {
    switch (type) {
      case 'thesis':
        navigate(`/thesis/${value._id}`);
        break;
      case 'account':
        navigate(`/account/${value._id}`);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/*<Row className='mb-4'>
        <Form className="d-flex w-100">
          <SearchBox typeFilter={{ theses: true, accounts: true }} placeholder='Search theses, accounts...' onResult={handleResult} />
        </Form>
      </Row>*/}
      <Row className='mb-4'>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text className='text-center'>
                <h2>{theses.filter(e => e.approved && e.status !== 'final').length}</h2>
                <p><Link to='/thesis' className='stretched-link'>active theses</Link></p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text className='text-center'>
                <h2>{theses.filter(e => e.approved === false).length}</h2>
                <p><Link to='/thesis?showPending=show' className='stretched-link'>active theses requests</Link></p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text className='text-center'>
                <h2>{accounts.filter(e => !e.locked).length}</h2>
                <p><Link to='/account' className='stretched-link'>active accounts</Link></p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text className='text-center'>
                <h2>{defenses.filter(e => e.status === 'approved').length}</h2>
                <p><Link to='/defense' className='stretched-link'>active defense requests</Link></p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text className='text-center'>
                <DefenseCalendar defenses={defenses.filter(e => e.status === 'confirmed')} onEventClick={e => setSelectedEvent(e)} />
                <DefenseSummaryDialog show={!!selectedEvent} defense={selectedEvent} onClose={() => setSelectedEvent(null)} />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default DashboardPage;
