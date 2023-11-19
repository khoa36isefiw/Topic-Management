import dayjs from "dayjs";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ThesisService from "../services/ThesisService";
import { Download } from 'react-bootstrap-icons';
import renderName from '../utility/renderName';
import { useTranslation } from "react-i18next";
import { LinkContainer } from "react-router-bootstrap";

function SubmissionsPage() {
  const { tid } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);
  const [phase, setPhase] = useState('');

  const onLoad = async () => {
    setThesis(await ThesisService.getThesis(tid, { getSubmissions: true }));
  };

  useEffect(() => {
    onLoad();
  }, []);

  return thesis ? (
    <>
      <Row>
        <Col sm={9}>
          <h3>{thesis.title}</h3>
          <h6 className='text-muted'>by {thesis.authors.map(renderName)}</h6>
          <h6 className='text-muted'>advised by {thesis.advisers.map(renderName)}</h6>
          <Row className='mb-3'>
            <Col>
              <h5 className='text-muted'>Submissions</h5>
            </Col>
            <Col className='d-flex flex-column align-items-end'>
              <div className='d-flex flex-row align-items-center'>
                <Form.Select value={phase ? phase.toString() : ''} onChange={e => setPhase(e.currentTarget.value)}>
                  <option value=''>Current phase</option>
                  <option value='1'>{t('values.thesis_phase.1')}</option>
                  <option value='2'>{t('values.thesis_phase.2')}</option>
                  <option value='3'>{t('values.thesis_phase.3')}</option>
                  <option value='all'>All phases</option>
                </Form.Select>
              </div>
            </Col>
          </Row>
          {
            (thesis.submissions && thesis.submissions.length > 0) &&
              <>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Submitted on</th>
                      <th>Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      thesis.submissions.filter(e => phase === 'all' || ((!phase && e.phase === thesis.phase) || (Number.parseInt(phase) === e.phase))).map((e, i) => (
                        <tr key={e._id}>
                          <td><Link to={`/thesis/${thesis._id}/submission/${e._id}`}>{dayjs(e.submitted).format('LLL')}</Link></td>
                          <td><Link to={`/thesis/${thesis._id}/submission/${e._id}`}>{t(`values.thesis_phase.${e.phase}`)}</Link></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              </>
          }
        </Col>
        <Col sm={3}>
          <div className='mb-2'>
            <Button variant='secondary' onClick={() => navigate(-1)}>Back</Button>
          </div>
          <Card style={{ width: '18rem' }}>
            <Card.Body>
              <Card.Title>{thesis.title}</Card.Title>
              <Card.Text>
                <h6>Authors</h6>
                <ul>
                  {
                    thesis.authors.map(e => (
                      <li>{renderName(e)}</li>
                    ))
                  }
                </ul>
                <h6>{thesis.advisers.length === 1 ? 'Adviser' : 'Advisers'}</h6>
                <ul>
                  {
                    thesis.advisers.map(e => (
                      <li>{renderName(e)}</li>
                    ))
                  }
                </ul>
                <LinkContainer to={`/thesis/${tid}`}>
                  <Button>View</Button>
                </LinkContainer>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  ) : null;
}

export default SubmissionsPage;
