import { useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { Pencil, Trash } from 'react-bootstrap-icons';
import dayjs from 'dayjs';
import AccountService from '../services/AccountService';
import { useAccount } from '../providers/account';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useTranslation } from 'react-i18next';

function UploadScheduleDialog(props) {
  const { open, onCancel, onAction } = props;
  const { t } = useTranslation();
  const calendarRef = useRef(null);
  const [_error, _setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState(null);
  const [type, setType] = useState('');
  const [events, setEvents] = useState([]);
  const [counter, setCounter] = useState(1);

  const handleCancel = () => {
    if (onCancel) onCancel();
  }

  const handleAddFile = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      const fr = new FileReader();
      fr.onload = result => {
        setFile({
          action: 'add',
          format: 'ics',
          name: file.name,
          value: fr.result
        });
      };
      fr.readAsDataURL(file);
    }
  };

  const canSubmit = () => {
    if (type === 'custom') return events.length > 0;
    else if (type === 'ics') return !!file;
    return false;
  }

  useEffect(() => {
    setFile(null);
    setEvents([]);
  }, [type])

  const handleSubmit = async e => {
    const form = e.currentTarget;
    e.preventDefault();
    if (onAction) {
      setSaving(true);
      try {
        let result = null;
        if (file) {
          result = onAction('ics', file);
        } else if (events.length > 0) {
          result = onAction('custom', {
            action: 'add',
            format: 'custom',
            name: 'name',
            value: events
          });
        }
        if (result && result.then) {
          await result;
        }
      } catch (error) {
        _setError(error.code ? t(error.code) : error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRangeSelect = async e => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.view.type === 'timeGridWeek') {
        setEvents(prev => [...prev, { id: counter.toString(), start: e.start, end: e.end }]);
        const startDay = dayjs(e.start).startOf('day');
        const endDay = dayjs(e.end).startOf('day');
        api.unselect();
        setCounter(prev => prev + 1);
        /*if (account.kind === 'student' && (thesis && thesis.status === 'endorsed')) {
          const startDate = startDay.format('YYYY-MM-DD');
          if (defenseDates.includes(startDate) && startDay.isSame(endDay)) {
            const action = [functions.tryAddDefense({
              start: e.start,
              end: e.end,
              description: thesis.title,
              thesis: thesis,
              phase: thesis.phase,
              panelists: [...thesis.advisers, ...thesis.panelists]
            }, true)];
            api.unselect();
            const [result] = await DefenseService.processDefenseSlots(action);
            functions.tryUpdateId(action[0]._id, result._id);
          } else {
            api.unselect();
          }
        }*/
      }
    }
  };

  const handleEventClick = e => {
    if (calendarRef.current) {
      console.log(e);
      setEvents(prev => prev.filter(e2 => e2.id !== e.event.id));
      //const event = functions.getEvent(e.event.id);
      //setSelectedEvent(event);
      //setEventDialogOpen(true);
    }
  };

  const handleDateClick = e => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.view.type === 'dayGridMonth') {
        api.changeView('timeGridWeek', e.dateStr);
      }
    }
  };

  return (
    <Modal show={open} animation={false} centered size='lg'>
      <Modal.Header>
        <Modal.Title>Upload new schedule</Modal.Title>
      </Modal.Header>
      <Form>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select value={type} onChange={e => setType(e.currentTarget.value)} className="mb-3" aria-label="Schedule type">
              <option value=''>Select type of schedule</option>
              <option value="ics">iCalendar file</option>
              <option value="custom">Manual</option>
            </Form.Select>
          </Form.Group>
          {
            type === 'ics' &&
              <Form.Group className="mb-3" controlId="formDocument">
                <Form.Label>Schedule file</Form.Label>
                <Form.Control type="file" onChange={handleAddFile} accept='.ics' />
              </Form.Group>
          }
          {
            type === 'custom' &&
              <div className='mt-3'>
                <FullCalendar
                  plugins={[ dayGridPlugin, interactionPlugin, timeGridPlugin ]}
                  initialView='dayGridMonth'
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  /*slotMinTime={startTime}
                  slotMaxTime={endTime}
                  slotDuration={slotInterval}*/
                  select={handleRangeSelect}
                  selectable
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
              </div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>Upload</Button>
          <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function SchedulePage() {
  const { t } = useTranslation();
  const { account } = useAccount();
  
  const [schedules, setSchedules] = useState([]);
  const [newSchedules, setNewSchedules] = useState([]);
  const [schedulesToRemove, setSchedulesToRemove] = useState([]);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const [deleteID, setDeleteID] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    try {
      if (account.accountID) {
        const info = await AccountService.getAccount(account.accountID);
        setSchedules(info.schedule);
      }
    } catch (error) {

    }
  };

  const handleSubmit = async (action, data) => {
    const schedule = [data];
    if (schedule) {
      await AccountService.updateSchedule(account.accountID, schedule);
      setSubmittingSchedule(false);
      load();
    }
  };

  const handleDelete = async id => {
    try {
      await AccountService.updateSchedule(account.accountID, [{ action: 'remove', _id: id }]);
      await load();
      setDeleteID('');
    } catch (error) {
      setDeleteError(error.code ? t(error.code) : error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Row className='mb-3'>
        <Col>
          <h3>My Schedules</h3>
        </Col>
        <Col className='d-flex flex-column align-items-end'>
          <div className='d-flex flex-row align-items-center'>
            <Button className='ms-auto d-inline w-100' onClick={() => setSubmittingSchedule(true)}>Add New Schedule</Button>
          </div>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col>
          <Table striped bordered hover size='sm'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Format</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {
                schedules.length > 0 ? 
                  schedules.map(e => (
                    <tr>
                      <td>{e.name}</td>
                      <td>{e.format}</td>
                      <td>{dayjs(e.uploaded).format('LLL')}</td>
                      <td>
                        <Button variant='link' size='sm' onClick={() => setDeleteID(e._id)}><Trash /></Button>
                      </td>
                    </tr>
                  ))
                  :
                  <tr>
                    <td colSpan={4}>No schedules added.</td>
                  </tr>
              }
            </tbody>
          </Table>
        </Col>
      </Row>
      <UploadScheduleDialog
        open={submittingSchedule}
        onCancel={() => setSubmittingSchedule(false)}
        onAction={handleSubmit}
      />
      <Modal show={!!deleteID} size='lg' animation={false} centered scrollable>
        <Modal.Header>
          <Modal.Title>Delete schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { deleteError && <Alert onClose={() => setDeleteError('')} dismissible>{deleteError}</Alert> }
          <p>This action cannot be reversed!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => handleDelete(deleteID)}>Delete</Button>
          <Button variant='secondary' onClick={() => setDeleteID('')}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SchedulePage;
