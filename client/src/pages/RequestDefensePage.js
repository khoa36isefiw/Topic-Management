import { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Helmet from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAccount } from '../providers/account';
import DefenseService from '../services/DefenseService';
import ThesisService from '../services/ThesisService';

function RequestDefensePage() {
  const navigate = useNavigate();
  const { rid } = useParams();
  const { account } = useAccount();

  const [timeView, setTimeView] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotInterval, setSlotInterval] = useState(30 * 60 * 1000);
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);
  const [addEventsDialog, setAddEventsDialog] = useState(false);

  const [eventTitleHint, setEventTitleHint] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDate, setEventDate] = useState('');

  const handleRangeSelect = e => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.view.type === 'timeGridWeek') {
        setEvents(prev => {
          const next = [...prev];
          next.push({
            id: e.start.getTime().toString(),
            title: eventTitleHint,
            start: e.start,
            end: e.end
          });
          return next;
        });
        api.unselect();
      }
    }
  };

  const handleEventClick = e => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.view.type === 'timeGridWeek') {
        setEvents(prev => prev.filter(e2 => e2.id !== e.event.id));
      }
    }
  };

  const handleDateClick = e => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.view.type === 'dayGridMonth') {
        api.changeView('timeGridWeek', e.dateStr);
        setTimeView(true);
      }
    }
  };

  const handleOpenEventDialog = () => {
    if (account.kind !== 'student') return;

    setAddEventsDialog(true);
  };

  const handleCloseEventDialog = () => {
    setEventTitle('');
    setEventStartTime('');
    setEventEndTime('');
    setEventDate('');
    setAddEventsDialog(false);
  };

  const handleSubmitEventForm = e => {
    e.preventDefault();
    setEvents(prev => {
      const next = [...prev];

      const start = new Date(`${eventDate}T${eventStartTime}`);
      const end = new Date(`${eventDate}T${eventEndTime}`);

      next.push({
        id: start.getTime().toString(),
        title: eventTitle || eventTitleHint,
        start,
        end
      });
      return next;
    });
    handleCloseEventDialog();
  };

  const handleSubmitRequest = async () => {
    try {
      await DefenseService.createDefenseRequest({
        freeSlots: events.map(e => ({ start: e.start, end: e.end }))
      });
    } catch (error) {

    } finally {

    }
  };

  useEffect(() => {
    setEvents([
      {
        id: '1',
        start: '2023-03-27T08:00:00',
        end: '2023-03-27T18:00:00',
        display: 'background',
        className: 'bg-secondary cursor-blocked'
      },
      {
        id: '2',
        start: '2023-03-31T08:00:00',
        end: '2023-03-31T18:00:00',
        display: 'background',
      },
      {
        id: '3',
        start: '2023-03-29T12:00:00',
        end: '2023-03-29T18:00:00',
        display: 'background',
      },
      {
        id: '4',
        start: '2023-03-29T10:00:00',
        end: '2023-03-29T11:00:00',
      },
      {
        id: '5',
        start: '2023-03-29T10:00:00',
        end: '2023-03-29T11:00:00',
      },
      {
        id: '6',
        start: '2023-03-29T10:00:00',
        end: '2023-03-29T11:00:00',
      },
      {
        id: '7',
        start: '2023-03-29T10:00:00',
        end: '2023-03-29T11:00:00',
      },
    ]);

    const load = async function () {
      const theses = await ThesisService.getTheses();
      if (theses && theses.length > 0) {
        setEventTitleHint(theses[0].title);
      }
    };

    load();
  }, []);

  return (
    <>
      <Row>
        <Col>
          <h3>Request defense schedule</h3>
          <p>
            This screen allows you to request a schedule for your defense.
          </p>
        </Col>
        <Col className='d-flex flex-column align-items-end'>
          <div className='d-flex flex-row align-items-center'>
            <Button onClick={handleSubmitRequest}>Save</Button>
            <Button className='ms-1' variant='secondary' onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </Col>
      </Row>
      <Row className='mt-1'>
        <Col>
          <FullCalendar
            themeSystem='bootstrap5'
            plugins={[ dayGridPlugin, interactionPlugin, timeGridPlugin ]}
            initialView='dayGridMonth'
            dateClick={handleDateClick}
            select={handleRangeSelect}
            eventClick={handleEventClick}
            slotMinTime={startTime}
            slotMaxTime={endTime}
            slotDuration={slotInterval}
            selectable
            selectMirror
            hiddenDays={[0]}
            expandRows
            height='60vh'
            headerToolbar={{
              start: 'today,prev,next',
              center: 'title',
              end: 'dayGridMonth,timeGridWeek'
            }}
            events={events}
            ref={calendarRef}
          />
          <div className='mt-2 d-flex flex-row align-items-center'>
            <p className='text-muted'>You can request defense slots by dragging on the available slots.</p>
            <Button className='ms-auto' onClick={handleOpenEventDialog}>Request a slot</Button>
          </div>
        </Col>
      </Row>
      <Modal show={addEventsDialog} animation={false} centered size='lg'>
        <Modal.Header>
          <Modal.Title>
            Request defense slot
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitEventForm}>
          <Modal.Body>
            <Row>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control type='text' placeholder={eventTitleHint} value={eventTitle} onChange={e => setEventTitle(e.currentTarget.value)} />
              </Form.Group>
              <Col>
                <Form.Group className="mb-3" controlId="formStartTime">
                  <Form.Label>Start time</Form.Label>
                  <Form.Control type='time' value={eventStartTime} onChange={e => setEventStartTime(e.currentTarget.value)} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3" controlId="formEndTime">
                  <Form.Label>End time</Form.Label>
                  <Form.Control type='time' value={eventEndTime} onChange={e => setEventEndTime(e.currentTarget.value)} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="formDate">
              <Form.Label>Date</Form.Label>
              <Form.Control type='date' value={eventDate} onChange={e => setEventDate(e.currentTarget.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button type='submit'>Add</Button>
            <Button variant='secondary' onClick={handleCloseEventDialog}>Cancel</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default RequestDefensePage;
