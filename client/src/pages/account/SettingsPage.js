import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from '../../providers/account'
import AccountService from '../../services/AccountService';
import PasswordField, { PasswordText, PasswordToggler } from '../../components/PasswordField';
import ProfileImage from '../../components/ProfileImage';
import { useNotification } from '../../contexts/NotificationContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash } from 'react-bootstrap-icons';

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

function SettingsPage() {
  const { t } = useTranslation();
  const { account } = useAccount();
  const { pushNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(undefined);
  const [image, setImage] = useState(null);

  const [deleteScheduleID, setDeleteScheduleID] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [newSchedules, setNewSchedules] = useState([]);
  const [schedulesToRemove, setSchedulesToRemove] = useState([]);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const [time, setTime] = useState(0);
  const imageRef = useRef();

  const load = async () => {
    try {
      setTime(Date.now());
      if (account.accountID) {
        const info = await AccountService.getAccount(account.accountID);
        setEmail(info.email);
        setLastName(info.lastName);
        setFirstName(info.firstName);
        setMiddleName(info.middleName);
        setType(info.kind);
        setSchedules(info.schedule);
      }
    } catch (error) {

    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await AccountService.updateAccount(account.accountID, {
        currentPassword, newPassword, retypePassword,
        photo: imageFile
      });
      pushNotification({
        title: 'Success',
        message: 'Profile updated.'
      });
      setTime(Date.now());
    } catch (error) {
      pushNotification({
        title: 'Error',
        message: error.message,
        delay: 0
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImage = e => {
    const file = e.currentTarget.files[0];
    setImageFile(file);
    if (file) {
      const fr = new FileReader();
      fr.onload = () => {
        setImage(fr.result);
      }
      fr.readAsDataURL(file);
    }
  };

  const handleSubmitSchedule = async (action, data) => {
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
      setDeleteScheduleID('');
    } catch (error) {
      setDeleteError(error.code ? t(error.code) : error.message);
    }
  };

  useEffect(() => {
    load();
  }, [account]);

  return (
    <>
      <Form onSubmit={handleSave}>
        <Row>
          <Col>
            <h3>Account settings</h3>
          </Col>
          <Col className='d-flex flex-column align-items-end'>
            <div className='d-flex flex-row align-items-center'>
              { saving && <Spinner className='me-2' /> }
              <Button type='submit' className='ms-auto d-inline' disabled={saving}>Save</Button>
            </div>
          </Col>
        </Row>
        <Row className='mt-2'>
          <Col md={8}>
            <Row>
              <Col>
                <h4>Profile</h4>
                <p className='text-muted'>
                  Fields grayed out cannot be changed from this screen and can only be changed by
                  an administrator.
                </p>
              </Col>
            </Row>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="text" value={email} readOnly disabled />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formType">
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={type} disabled>
                    <option value=''>--- Select type ---</option>
                    <option value='student'>Student</option>
                    <option value='faculty'>Faculty</option>
                    <option value='administrator'>Administrator</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formLastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control type="text" value={lastName} readOnly disabled />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formFirstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control type="text" value={firstName} readOnly disabled />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formMiddleName">
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control type="text" value={middleName} readOnly disabled />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <h4>Password</h4>
              </Col>
            </Row>
            {
              !showChangePassword && <>
                <Row>
                  <Col>
                    <Button onClick={() => setShowChangePassword(true)} className='mb-3'>Change password</Button>
                  </Col>
                </Row>
              </>
            }
            {
              showChangePassword && <>
                <Row>
                  <Col>
                    <Button onClick={() => setShowChangePassword(false)}>Cancel</Button>
                  </Col>
                </Row>
                <Row>
                  <PasswordField value={currentPassword} onChange={value => setCurrentPassword(value)}>
                    <Col md={8}>
                      <Form.Group className="mb-3" controlId="formCurrentPassword">
                        <Form.Label>Current password</Form.Label>
                        <PasswordText />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Label>&nbsp;</Form.Label>
                      <PasswordToggler className='mt-2' />
                    </Col>
                  </PasswordField>
                </Row>
                <Row>
                  <PasswordField value={newPassword} onChange={value => setNewPassword(value)}>
                    <Col md={8}>
                      <Form.Group className="mb-3" controlId="formNewPassword">
                        <Form.Label>New password</Form.Label>
                        <PasswordText />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Label>&nbsp;</Form.Label>
                      <PasswordToggler className='mt-2' />
                    </Col>
                  </PasswordField>
                </Row>
                <Row>
                  <PasswordField value={retypePassword} onChange={value => setRetypePassword(value)}>
                    <Col md={8}>
                      <Form.Group className="mb-3" controlId="formRetypePassword">
                        <Form.Label>Retype password</Form.Label>
                        <PasswordText />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Label>&nbsp;</Form.Label>
                      <PasswordToggler className='mt-2' />
                    </Col>
                  </PasswordField>
                </Row>
                <Row>
                  <Col>
                    <Button type='submit' className='ms-auto d-inline' disabled={saving}>Update Password</Button>
                  </Col>
                </Row>
              </>
            }
            <Row>
              <Col>
                <h4>Schedule</h4>
              </Col>
            </Row>
            <Row>
              <Col>
                <Button onClick={() => setSubmittingSchedule(true)}>Add new schedule</Button>
              </Col>
            </Row>
            <Row>
              <Col>
                <Table striped bordered size='sm'>
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
                              <Button variant='link' size='sm' onClick={() => setDeleteScheduleID(e._id)}><Trash /></Button>
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
          </Col>
          <UploadScheduleDialog
            open={submittingSchedule}
            onCancel={() => setSubmittingSchedule(false)}
            onAction={handleSubmitSchedule}
          />
          <Col md={4} className='d-flex flex-column align-items-end'>
            <ProfileImage
              style={{ cursor: 'pointer' }}
              width='288px'
              rounded
              src={image}
              accountID={account.accountID}
              version={time}
              onClick={() => {imageRef.current.click()}}
            />
            { image && <small className='text-muted'></small> }
            <small className='text-muted'>Profile photo must be square.</small>
            <input hidden type='file' onChange={handleImage} ref={imageRef} accept='image/jpeg,image/png' />
            <Button variant='secondary' className='mt-2' onClick={() => {imageRef.current.click()}}>Change photo...</Button>
          </Col>
        </Row>
      </Form>
      <Modal show={!!deleteScheduleID} size='lg' animation={false} centered scrollable>
        <Modal.Header>
          <Modal.Title>Delete schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { deleteError && <Alert onClose={() => setDeleteError('')} dismissible>{deleteError}</Alert> }
          <p>This action cannot be reversed!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => handleDelete(deleteScheduleID)}>Delete</Button>
          <Button variant='secondary' onClick={() => setDeleteScheduleID('')}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SettingsPage;
