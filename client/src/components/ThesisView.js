import dayjs from "dayjs";
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Link, useNavigate } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import Button from "react-bootstrap/esm/Button";
import ThesisService from "../services/ThesisService";
import { Download, Pencil, Trash } from "react-bootstrap-icons";
import renderName from '../utility/renderName';
import PasswordPrompt from '../components/PasswordPrompt';
import { useAccount } from "../providers/account";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function ThesisView(props) {
  const { t } = useTranslation();
  const { thesis, onUpdate } = props;
  const navigate = useNavigate();
  const { account } = useAccount();
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updateGradeDialogOpen, setUpdateGradeDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [packet, setPacket] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const findMember = (thesis, submitterID, mode) => {
    let table;
    switch (mode) {
      case 'adviser': table = thesis.advisers; break;
      default: table = thesis.authors; break;
    }

    return table.find(e => e._id === submitterID);
  };

  const downloadFile = async (sid, attachment) => {
    const { originalName: name, _id: id } = attachment;
    const blob = await ThesisService.getAttachment(thesis._id, sid, id);
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const handleCheckThesis = () => {
    setPacket({ status: 'checked' });
    setPasswordDialogOpen(true);
  };

  const handleEndorsement = () => {
    setPacket({ status: 'endorsed' });
    setPasswordDialogOpen(true);
  };

  const handleGradeSubmission = e => {
    e.preventDefault();
    let status = 'pass';
    let newGrade = undefined;
    if (grade === 'redefense' || grade === 'fail') {
      status = grade;
    } else {
      newGrade = Number.parseFloat(grade);
    }
    setPacket({ status, grade: newGrade, remarks });
    setPasswordDialogOpen(true);
  };

  const handleAddFile = (e) => {
    const file = e.currentTarget.files[0];
    setFiles(prev => [ ...prev, file ]);
    setFile('');
  };

  const handleRemoveFile = (e) => {
    setFiles(prev => prev.filter(e2 => e2 !== e));
  };

  const handleUploadFiles = async () => {
    try {
      setUploading(true);
      await ThesisService.uploadSubmission(thesis._id, files);
      setFiles([]);
      setSubmitting(false);
      if (onUpdate) onUpdate();
    } catch (error) {

    } finally {
      setUploading(false);
    }
  };

  const handlePasswordEntry = async (password) => {
    setPasswordDialogOpen(false);
    setUpdating(true);
    try {
      if (packet) {
        await ThesisService.updateStatus(thesis._id, { ...packet, password });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      
    } finally {
      setUpdating(false);
      setPacket(null);
    }
  };

  const isAuthor = () => {
    return thesis && thesis.authors.find(e => e._id === account.accountID);
  };

  const isAdvisory = () => {
    return thesis && thesis.advisers.find(e => e._id === account.accountID);
  };

  return thesis ? (
    <>
      <Row>
        <Col sm={9}>
          <h3>{thesis.title}</h3>
          <h6 className='text-muted'>by {thesis.authors.map(renderName).join('; ')}</h6>
          <h6 className='text-muted'>advised by {thesis.advisers.map(renderName).join('; ')}</h6>
          <p>{thesis.description}</p>
          <h5>Media and Files</h5>
          {
            (thesis.submissions && thesis.submissions.length > 0) ?
              <>
                <h6 className='text-muted'>Last updated on {dayjs(thesis.submissions[0].submitted).format('LLL')}</h6>
                <ul>
                  {
                    thesis.submissions[0].attachments.map(e => (
                      <li>
                        {/*<Link to={`/thesis/${thesis._id}/submission/${thesis.submissions[0]._id}/attachment/${e._id}`}>
                        </Link>
                        <Button as='a' className='ms-2' bsPrefix='__' onClick={() => downloadFile(thesis.submissions[0]._id, e)}>
                          <Download />
                        </Button>*/}
                        <Button as='a' bsPrefix='__' onClick={() => downloadFile(thesis.submissions[0]._id, e)}>
                          {e.originalName}
                        </Button>
                        <Button as='a' className='ms-2' bsPrefix='__' onClick={() => downloadFile(thesis.submissions[0]._id, e)}>
                          <Download />
                        </Button>
                      </li>
                    ))
                  }
                </ul>
                {
                  (account.kind === 'student' && !submitting) && (
                    <Button onClick={() => setSubmitting(!submitting)}>Submit again</Button>
                  )
                }
              </>
              :
              (
                isAuthor() ?
                  (
                    !submitting && (
                      <>
                        <p>You have not made any submissions for your thesis.</p>
                        <Button onClick={() => setSubmitting(!submitting)}>Submit</Button>
                      </>
                    )
                  )
                  :
                  (
                    <>
                      <p>There are no submissions for this thesis.</p>
                    </>
                  )
              )
          }
          {
            submitting && (
              <Card>
                <Card.Body>
                  <Card.Title>Submit files</Card.Title>
                  <Card.Text>
                    <Form.Group className="mb-3" controlId="formDocument">
                      <Form.Label>Add file</Form.Label>
                      <Form.Control type="file" value={file} onChange={handleAddFile} disabled={uploading} />
                    </Form.Group>
                    {
                      files.length > 0 ?
                        <ul>
                          {
                            files.map(e => (
                              <li>
                                <span>{e.name} ({e.size} bytes)</span>
                                <Button
                                  variant='link'
                                  onClick={() => handleRemoveFile(e)}
                                  className='ms-1'
                                  style={{ padding: 0 }}
                                  disabled={uploading}
                                >
                                  <Trash style={{ verticalAlign: 'baseline' }} />
                                </Button>
                              </li>
                            ))
                          }
                        </ul>
                        :
                        <div>
                          No files added.
                        </div>
                    }
                    <div className='mt-3'>
                      <Button onClick={handleUploadFiles} disabled={files.length < 1 || uploading} className='me-1'>Submit</Button>
                      <Button variant='secondary' onClick={() => { setFiles([]); setSubmitting(false); }} disabled={uploading}>Cancel</Button>
                    </div>
                  </Card.Text>
                </Card.Body>
              </Card>
            )
          }
          <h5>Comments</h5>
          {
            (isAuthor() || isAdvisory()) &&
              <>
              </>
          }
          {

          }
        </Col>
        <Col sm={3}>
          <div>
            <LinkContainer to={`/thesis/${thesis._id}/edit`}>
              <Button className='me-1'>Edit</Button>
            </LinkContainer>
            <Button variant='secondary' onClick={() => navigate(-1)}>Back</Button>
          </div>
          <Card className='mt-2'>
            <Card.Body>
              <Card.Text>
                <h4>Status</h4>
                <p className='d-flex'>
                  <div className='d-flex flex-row align-items-center'>
                    <span className={updating ? 'text-muted' : ''}>{t(`values.thesis_status.${thesis.status}`)}</span>
                    { updating && <Spinner className='ms-2' size='sm' /> }
                  </div>
                </p>
                {
                  (isAdvisory() && (thesis.status === 'for_checking' || thesis.status === 'checked')) &&
                    <p>
                      { thesis.status !== 'checked' && <Button onClick={handleCheckThesis} className='me-2'>Mark as checked</Button> }
                      <Button onClick={handleEndorsement}>Endorse</Button>
                    </p>
                }
                <h4>Grade</h4>
                <p>
                  { thesis.grade ? thesis.grade.toFixed(1) + ` (${thesis.grade >= 1.0 ? 'Pass' : 'Fail'})` : 'No grade yet' }
                  {
                    isAdvisory() && thesis.status === 'endorsed' &&
                      <Button as='a' className='ms-2' bsPrefix='__' onClick={() => setUpdateGradeDialogOpen(true)}>
                        <Pencil />
                      </Button>
                  }
                </p>
                {
                  thesis.remarks &&
                    <>
                      <h4>Remarks</h4>
                      <p>{thesis.remarks}</p>
                    </>
                }
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Modal show={updateGradeDialogOpen} animation={false} centered>
        <Modal.Header>
          <Modal.Title>Update status</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGradeSubmission}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formGrade">
              <Form.Label>Grade/Status</Form.Label>
              <Form.Select aria-label="Grade" value={grade} onChange={e => setGrade(e.currentTarget.value)}>
                <option>Select grade...</option>
                <option value="redefense">Redefense</option>
                <option>4.0</option>
                <option>3.5</option>
                <option>3.0</option>
                <option>2.5</option>
                <option>2.0</option>
                <option>1.5</option>
                <option>1.0</option>
                <option value="fail">0.0</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formRemarks">
              <Form.Label>Remarks</Form.Label>
              <Form.Control as="textarea" rows={3} value={remarks} onChange={e => setRemarks(e.currentTarget.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button type='submit'>Save</Button>
            <Button variant='secondary' onClick={() => setUpdateGradeDialogOpen(false)}>Close without saving</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <PasswordPrompt show={passwordDialogOpen} onSubmit={handlePasswordEntry} onCancel={() => setPasswordDialogOpen(false)} />
    </>
  ) : null;
}

export default ThesisView;
