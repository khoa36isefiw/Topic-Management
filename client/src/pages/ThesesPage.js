import { useEffect, useState } from 'react';
import ThesisTable from '../components/ThesisTable';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { useTranslation } from 'react-i18next';
import { LinkContainer } from 'react-router-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from '../providers/account';
import ThesisService from '../services/ThesisService';
import dayjs from 'dayjs';

function AdjustScheduleDialog(props) {
  const { open, onClose } = props;
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState({ '1': '', '2': '', '3': '' });
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const list = await ThesisService.getDeadlines();
    //const obj = list.reduce((p, e) => ({ ...p, [e.phase.toString()]: e }), {});
    for (const key of Object.keys(list)) {
      list[key] = list[key] ? list[key].substr(0, 16) : '';
    }

    setSchedules(list);
  };

  const handleClose = () => {
    if (onClose) onClose();
    setEdit(false);
  };

  const handleStartEdit = () => {
    setEdit(true);
  };

  /*const handleSelect = async arg => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api) {
        const newDates = [];
        let currentDate = dayjs(arg.start);
        const endDate = dayjs(arg.end);
        while (currentDate.isBefore(endDate)) {
          newDates.push(currentDate.format('YYYY-MM-DD'));
          currentDate = currentDate.add(1, 'day');
        }

        setSchedule(prev => {
          const next = { ...prev };
          const prevList = next[phase] ? next[phase].dates : [];
          const datesToAdd = newDates.filter(e => !prevList.includes(e));
          if (datesToAdd.length > 0) {
            const nextList = [...prevList, ...datesToAdd];
            nextList.sort();
            next[phase] = { dates: nextList };
          } else {
            next[phase] = { dates: prevList.filter(e => !newDates.includes(e)) };
          }
          return next;
        });
        api.unselect();
      }
    }
  }*/

  const handleSave = async () => {
    try {
      setError('');
      setSaving(true);
      await ThesisService.postDeadlines(schedules);
      setEdit(false);
    } catch (error) {
      setError(error.code ? t(error.code) : error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError('');
      load();
    } else {
      setSchedules({ '1': '', '2': '', '3': '' });
    }
  }, [open]);

  const setDate = (phase, date) => {
    console.log(date);
    setSchedules(prev => {
      return { ...prev, [phase]: date };
    });
  };

  return (
    <Modal show={open} animation={false} centered size='lg'>
      <Modal.Header>
        <Modal.Title>
          Adjust Deadlines
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          edit ?
            <>
              { error && <Alert variant='danger' onClose={() => setError('')} dismissible>{error}</Alert> }
              <Row>
                <Col>
                  <p>{t('values.thesis_phase.1')}</p>
                  <Form.Group className="mb-3" controlId="formPhase1">
                    <Form.Control type='datetime-local' value={schedules['1']} onChange={e => setDate('1', e.currentTarget.value)} required disabled={saving} />
                  </Form.Group>
                </Col>
                <Col>
                  <p>{t('values.thesis_phase.2')}</p>
                  <Form.Group className="mb-3" controlId="formPhase2">
                    <Form.Control type='datetime-local' value={schedules['2']} onChange={e => setDate('2', e.currentTarget.value)} required disabled={saving} />
                  </Form.Group>
                </Col>
                <Col>
                  <p>{t('values.thesis_phase.3')}</p>
                  <Form.Group className="mb-3" controlId="formPhase3">
                    <Form.Control type='datetime-local' value={schedules['3']} onChange={e => setDate('3', e.currentTarget.value)} required disabled={saving} />
                  </Form.Group>
                </Col>
              </Row>
            </>
            :
            <Row>
              <Col>
                <p>{t('values.thesis_phase.1')}</p>
                <p>{dayjs(schedules['1']).format('LLL') || <><span style={{fontStyle: 'italic'}}>None</span></>}</p>
              </Col>
              <Col>
                <p>{t('values.thesis_phase.2')}</p>
                <p>{dayjs(schedules['2']).format('LLL') || <><span style={{fontStyle: 'italic'}}>None</span></>}</p>
              </Col>
              <Col>
                <p>{t('values.thesis_phase.3')}</p>
                <p>{dayjs(schedules['3']).format('LLL') || <><span style={{fontStyle: 'italic'}}>None</span></>}</p>
              </Col>
            </Row>
        }
      </Modal.Body>
      <Modal.Footer>
        { edit && <Button disabled={saving} onClick={handleSave}>Save changes</Button> }
        { edit && <Button disabled={saving} variant='secondary' onClick={() => setEdit(false)}>Discard changes</Button> }
        { !edit && <Button onClick={handleStartEdit}>Start editing</Button> }
        <Button variant='secondary' disabled={saving} onClick={handleClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}

function ThesesPage() {
  const { account } = useAccount();
  const [url] = useSearchParams();
  const [all, setAll] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    setAll(account.kind === 'administrator');
  }, [account]);

  const exportProjects = async () => {
    const blob = await ThesisService.exportProjects();
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'exported.xlsx';
    a.click();
  };

  return (
    <>
      <Row className='mb-3'>
        <Col>
          <h3>Thesis Projects</h3>
        </Col>
        <Col className='d-flex flex-column align-items-end'>
          <div className='d-flex flex-row align-items-center'>
            {
              account && account.kind === 'administrator' && <>
                <Button className='ms-auto d-inline w-100' onClick={() => setScheduleOpen(true)}>Adjust Deadlines</Button>
                <Button className='ms-3 d-inline w-100' onClick={exportProjects}>Export Projects</Button>
                <LinkContainer to='/thesis/new'>
                  <Button className='ms-3 d-inline w-100'>Add Thesis Project</Button>
                </LinkContainer>
              </>
            }
          </div>
        </Col>
      </Row>
      <AdjustScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
      <ThesisTable
        userKind={account.kind}
        filter
        pagination
        initialState={{
          showPending: url.get('showPending') || ''
        }}
      />
    </>
  )
}

export default ThesesPage;
