import dayjs from "dayjs";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ThesisService from "../services/ThesisService";
import { Download } from 'react-bootstrap-icons';
import renderName from '../utility/renderName';
import { LinkContainer } from "react-router-bootstrap";

function SubmissionPage() {
  const { tid, sid } = useParams();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);
  const [submission, setSubmission] = useState(null);

  const onLoad = async () => {
    setThesis(await ThesisService.getThesis(tid));
    setSubmission(await ThesisService.getSubmission(tid, sid));
  };

  const handleDownload = async (attachment) => {
    const { originalName: name, _id: id } = attachment;
    const blob = await ThesisService.getAttachment(tid, sid, id);
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  useEffect(() => {
    onLoad();
  }, []);

  return submission ? (
    <>
      <Row>
        <Col sm={9}>
          <h3>Submission for {submission.thesis.title}</h3>
          <h5>Submitted on {dayjs(submission.submitted).format('LLL')} by {submission.submitter.firstName} {submission.submitter.lastName}</h5>
          {
            (submission.attachments && submission.attachments.length > 0) &&
              <>
                <h5>Media and Files</h5>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      submission.attachments.map(e => (
                        <tr>
                          <td>{e.originalName}</td>
                          <td><Button variant='link' size='sm' onClick={() => handleDownload(e)}><Download /></Button></td>
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

export default SubmissionPage;
