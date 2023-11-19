import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAccount } from '../providers/account';
import AnnouncementService from '../services/AnnouncementService';
import Paginator from '../components/Paginator';

async function loadAnnouncements(pageNumber = 1, itemsPerPage = 5) {
  return await AnnouncementService.getAnnouncements({ all: true, items: itemsPerPage, page: pageNumber });
}

function AnnouncementsPage() {
  const { account } = useAccount();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  // Announcement list and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [announcements, setAnnouncements] = useState(() => {
    loadAnnouncements().then(result => {
      setAnnouncements(result.items);
      setTotalPages(result.totalPages);
    });
  });

  // Modal state
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [updateID, setUpdateID] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('');
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [deleteID, setDeleteID] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const results = await loadAnnouncements(currentPage, itemsPerPage);
      setAnnouncements(results.items);
      setTotalPages(results.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    load();
  }, [itemsPerPage]);

  const handlePage = async newPage => {
    setCurrentPage(newPage);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      const from = fromDate && fromTime ? new Date(`${fromDate}T${fromTime}`).getTime() : null;
      const to = toDate && toTime ? new Date(`${toDate}T${toTime}`).getTime() : null;
      const _phase = phase ? Number.parseInt(phase) : null;
      if (updateID) {
        await AnnouncementService.updateAnnouncement(updateID, { title, text, from, to, phase: _phase });
      } else {
        await AnnouncementService.createAnnouncement({ title, text, from, to, phase: _phase });
      }
      setCurrentPage(1);
      await load();
      closeDialog();
    } catch (error) {
      setError(error.code ? t(error.code) : error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async e => {
    e.preventDefault();
    try {
      setError('');
      setSaving(true);
      await AnnouncementService.deleteAnnouncement(deleteID);
      setCurrentPage(1);
      await load();
      setDeleteID('');
    } catch (error) {
      setError(error.code ? t(error.code) : error.message);
    } finally {
      setSaving(false);
    }
  };

  const tryDeleteAnnouncement = id => {
    setDeleteID(id);
  };

  const openCreateDialog = () => {
    setUpdateID('');
    setTitle('');
    setText('');
    setFromDate('');
    setFromTime('');
    setToDate('');
    setToTime('');
    setPhase('');
    setError('');
    setAnnouncementDialog(true);
  };

  const openUpdateDialog = (e) => {
    setUpdateID(e._id);
    setTitle(e.title);
    setText(e.text);
    if (e.from) {
      const from = dayjs(e.from);
      setFromDate(from.local().format('YYYY-MM-DD'));
      setFromTime(from.local().format('HH:mm'));
    } else {
      setFromDate('');
      setFromTime('');
    }
    if (e.to) {
      const to = dayjs(e.to);
      setToDate(to.local().format('YYYY-MM-DD'));
      setToTime(to.local().format('HH:mm'));
    } else {
      setToDate('');
      setToTime('');
    }
    setPhase(e.phase ? e.phase.toString() : '');
    setError('');
    setAnnouncementDialog(true);
  };

  const closeDialog = () => {
    setUpdateID('');
    setTitle('');
    setText('');
    setError('');
    setAnnouncementDialog(false);
  };

  return (
    <>
      <Row className='mb-4'>
        <Col className='d-flex flex-row align-items-middle'>
          <h3>Announcements</h3>
        </Col>
        <Col className='d-flex flex-column align-items-end'>
          <div className='d-flex flex-row align-items-center'>
            {
              account.kind === 'administrator' &&
                <Button className='ms-2' onClick={openCreateDialog}>
                  Create announcement
                </Button>
            }
            <Button variant='secondary' className='ms-2' onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Col>
      </Row>
      {
        loading ?
          <p>Loading announcements.</p>
          :
          announcements && announcements.length > 0 ?
            announcements.map(e => (
              <Card className='mb-4'>
                <Card.Body>
                  <Card.Title>
                    <Row>
                      <Col className='d-flex flex-row align-items-middle'>
                        <span>{e.title}</span>
                      </Col>
                      <Col className='d-flex flex-column align-items-end'>
                        <div className='d-flex flex-row align-items-center'>
                          {
                            account.kind === 'administrator' &&
                              <>
                                <Button variant='secondary' onClick={() => openUpdateDialog(e)}>
                                  Edit
                                </Button>
                                <Button className='ms-2' variant='secondary' onClick={() => tryDeleteAnnouncement(e._id)}>
                                  Delete
                                </Button>
                              </>
                          }
                        </div>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Subtitle className='text-muted'>
                    {dayjs(e.sent).format('LLL')}
                  </Card.Subtitle>
                  <Card.Text>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {e.text}
                    </div>
                  </Card.Text>
                </Card.Body>
              </Card>
            ))
            :
            <p>There are no announcements.</p>
      }
      {
        announcements && announcements.length > 0 && (
          <>
            <Paginator page={currentPage} pageCount={totalPages} onChange={handlePage} />
          </>
        )
      }
      {
        account.kind === 'administrator' &&
          <Modal show={announcementDialog} animation={false} centered size='lg'>
            <Modal.Header>
              <Modal.Title>
                { updateID ? 'Edit' : 'Create' } announcement
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                { error && <Alert variant='danger'>{error}</Alert> }
                <Form.Group className="mb-3" controlId="formTitle">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type='text'
                    value={title}
                    onChange={e => setTitle(e.currentTarget.value)}
                    disabled={saving}
                  />
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-3" controlId="formFrom">
                      <Form.Label>From</Form.Label>
                      <Row>
                        <Col>
                          <Form.Control
                            type='date'
                            value={fromDate}
                            onChange={e => setFromDate(e.currentTarget.value)}
                            disabled={saving}
                          />
                        </Col>
                        <Col>
                          <Form.Control
                            type='time'
                            value={fromTime}
                            onChange={e => setFromTime(e.currentTarget.value)}
                            disabled={saving}
                          />
                        </Col>
                      </Row>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3" controlId="formTo">
                      <Form.Label>To</Form.Label>
                      <Row>
                        <Col>
                          <Form.Control
                            type='date'
                            value={toDate}
                            onChange={e => setToDate(e.currentTarget.value)}
                            disabled={saving}
                          />
                        </Col>
                        <Col>
                          <Form.Control
                            type='time'
                            value={toTime}
                            onChange={e => setToTime(e.currentTarget.value)}
                            disabled={saving}
                          />
                        </Col>
                      </Row>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3" controlId="formPhase">
                  <Form.Label>Phase</Form.Label>
                  <Form.Select value={phase} onChange={e => setPhase(e.currentTarget.value)} disabled={saving}>
                    <option value=''>All phases</option>
                    <option value='1'>{t('values.thesis_phase.1')}</option>
                    <option value='2'>{t('values.thesis_phase.2')}</option>
                    <option value='3'>{t('values.thesis_phase.3')}</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBody">
                  <Form.Label>Body</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={7}
                    value={text}
                    onChange={e => setText(e.currentTarget.value)}
                    disabled={saving}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button type='submit' disabled={saving}>Continue</Button>
                <Button variant='secondary' onClick={closeDialog} disabled={saving}>Cancel</Button>
              </Modal.Footer>
            </Form>
          </Modal>
      }
      {
        account.kind === 'administrator' &&
          <Modal show={!!deleteID} animation={false} centered size='lg'>
            <Modal.Header>
              <Modal.Title>
                Delete announcement
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={deleteAnnouncement}>
              <Modal.Body>
                { error && <Alert variant='danger'>{error}</Alert> }
                Once deleted, it cannot be undone.
              </Modal.Body>
              <Modal.Footer>
                <Button type='submit' disabled={saving}>Delete</Button>
                <Button variant='secondary' onClick={() => { setError(''); setDeleteID(''); }} disabled={saving}>Cancel</Button>
              </Modal.Footer>
            </Form>
          </Modal>
      }
    </>
  )
}

export default AnnouncementsPage;
