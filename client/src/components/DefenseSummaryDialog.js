import dayjs from 'dayjs';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { useTranslation } from 'react-i18next';

function DefenseSummaryDialog(props) {
  const { defense, show, onClose } = props;
  const { t } = useTranslation();

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Modal show={show} animation={false} centered size='lg'>
      <Modal.Header>
        <Modal.Title>
          Defense Summary
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row as='dl'>
          <Col as='dt' sm={3}>
            Thesis title
          </Col>
          <Col as='dd' sm={9}>
            { defense && defense.thesis.title }
          </Col>
          <Col as='dt' sm={3}>
            Description
          </Col>
          <Col as='dd' sm={9}>
            { defense && (defense.thesis.description || 'No description provided') }
          </Col>
          <Col as='dt' sm={3}>
            Date and time
          </Col>
          <Col as='dd' sm={9}>
            { defense && `${dayjs(defense.start).format('LL, LT')} - ${dayjs(defense.end).format('LT')}` }
          </Col>
          <Col as='dt' sm={3}>
            Authors
          </Col>
          <Col as='dd' sm={9}>
            <ul>
              {
                defense && defense.thesis.authors.map(e => (
                  <li key={`author-${e._id}`}>{t('values.full_name', e)}</li>
                ))
              }
            </ul>
          </Col>
          <Col as='dt' sm={3}>
            Panelists
          </Col>
          <Col as='dd' sm={9}>
            <ul>
              {
                defense && defense.panelists.map(e => (
                  <li
                    key={`panelist-${e.faculty._id}`}
                  >
                    {t('values.full_name', e.faculty)} {e.declined ? '(Declined)' : (e.approved ? '(Approved)' : '(Not yet approved)')}
                  </li>
                ))
              }
            </ul>
          </Col>
          <Col as='dt' sm={3}>
            Status
          </Col>
          <Col as='dd' sm={9}>
            { defense && t(`values.defense_status.${defense.status}`) }
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DefenseSummaryDialog;
