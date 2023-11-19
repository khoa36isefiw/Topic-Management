import { useEffect, useRef, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { Download, Eye, Pencil, Trash } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { LinkContainer } from "react-router-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import PasswordPrompt from '../components/PasswordPrompt';
import { useAccount } from "../providers/account";
import ThesisService from "../services/ThesisService";
import ProfileImage from "../components/ProfileImage";

function ThesisPage() {
  const { tid } = useParams();
  const { t } = useTranslation();
  const { account } = useAccount();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);
  const [noThesis, setNoThesis] = useState(false);
  const [deadlines, setDeadlines] = useState(null);
  
  // Grade form
  const [grade, setGrade] = useState('');
  const [gradeMode, setGradeMode] = useState(false);
  const [studentGrades, setStudentGrades] = useState({});
  const [remarks, setRemarks] = useState('');
  const [updateGradeDialogOpen, setUpdateGradeDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [gradeSummaryDialogOpen, setGradeSummaryDialogOpen] = useState(false);
  const [updateStudentGradeDialogOpen, setUpdateStudentGradeDialogOpen] = useState(false);

  // Password verification
  const [packet, setPacket] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // File submissions
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  // Comments
  const [comment, setComment] = useState('');
  const [commentPhase, setCommentPhase] = useState('');
  const [comments, setComments] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(false);
  const [commentDeleting, setCommentDeleting] = useState(false);

  const addFileButtonRef = useRef(null);

  const onLoad = async () => {
    const deadlines = await ThesisService.getDeadlines();
    if (tid) {
      const thesis = await ThesisService.getThesis(tid, { getSubmissions: true });
      if (thesis) {
        setThesis(thesis);
        const phase = thesis.phase.toString();
        if (deadlines[phase]) {
          setDeadlines(new Date(deadlines[phase]));
        }
        setComments(await ThesisService.getCommentsOnThesis(tid));
      } else {
        setNoThesis(true);
      }
    } else if (account.kind === 'student') {
      const theses = await ThesisService.getTheses({ getSubmissions: true });
      if (theses && theses[0]) {
        setThesis(theses[0]);
        const phase = theses[0].phase.toString();
        if (deadlines[phase]) {
          setDeadlines(new Date(deadlines[phase]));
        }
        setComments(await ThesisService.getCommentsOnThesis(theses[0]._id));
      } else {
        setNoThesis(true);
      }
    }
  };

  useEffect(() => {
    onLoad();
  }, [account]);

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
    setPacket({ type: 'status', status: 'checked' });
    setPasswordDialogOpen(true);
  };

  const handleAdvanceThesis = () => {
    setPacket({ type: 'status', status: 'new', phase: thesis.phase + 1 });
    setPasswordDialogOpen(true);
  };

  const handleLockThesis = () => {
    setPacket({ type: 'status', status: 'final' });
    setPasswordDialogOpen(true);
  };

  const handleEndorsement = () => {
    setPacket({ type: 'status', status: 'endorsed' });
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

  const openStudentGradeDialog = () => {
    setGrade('');
    setRemarks('');
    const obj = thesis.authors.reduce((p, e) => ({ ...p, [e._id]: { grade: e.grade || '', remarks: e.remarks || '' } }), {});
    setStudentGrades(obj);
    setGradeMode(false);

    setUpdateStudentGradeDialogOpen(true);
  };

  const closeStudentGradeDialog = () => {
    setUpdateStudentGradeDialogOpen(false);
  };

  const updateGroupGrade = (val) => {
    setGrade(val);
    setStudentGrades(prev => {
      const copy = { ...prev };
      for (const author of thesis.authors) {
        copy[author._id].grade = val;
      }
      return copy;
    });
  };

  const updateGroupRemarks = (val) => {
    setRemarks(val);
    setStudentGrades(prev => {
      const copy = { ...prev };
      for (const author of thesis.authors) {
        copy[author._id].remarks = val;
      }
      return copy;
    });
  };

  const updateStudentGrade = (id, val) => {
    setStudentGrades(prev => ({ ...prev, [id]: { grade: val, remarks: prev[id] ? prev[id].remarks : '' } }));
  };

  const updateStudentRemarks = (id, val) => {
    setStudentGrades(prev => ({ ...prev, [id]: { grade: prev[id] ? prev[id].grade : '', remarks: val } }));
  };

  const handleStudentGradeSubmission = e => {
    e.preventDefault();
    setPacket({ type: 'grade', grades: studentGrades });
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
      await onLoad();
    } catch (error) {

    } finally {
      setUploading(false);
    }
  };

  const handleSubmitComment = async e => {
    e.preventDefault();
    try {
      setSubmittingComment(true);
      await ThesisService.commentOnThesis(thesis._id, { text: comment });
      await onLoad();
      setComment('');
    } catch (error) {

    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async id => {
    try {
      setCommentDeleting(true);
      await ThesisService.deleteComment(thesis._id, id);
      await onLoad();
      setCommentToDelete('');
    } catch (error) {

    } finally {
      setCommentDeleting(false);
    }
  };

  const handleApproveThesisRequest = () => {
    setPacket({ type: 'approve', approved: true });
    setPasswordDialogOpen(true);
  };

  const handleDeleteThesis = () => {
    setPacket({ type: 'reject', delete: true });
    setPasswordDialogOpen(true);
  }

  const handlePasswordEntry = async (password) => {
    setPasswordDialogOpen(false);
    setUpdating(true);
    try {
      if (packet) {
        if (packet.type === 'reject' && packet.delete) {
          await ThesisService.deleteThesis(thesis._id);
          navigate('/thesis');
        } else {
          await ThesisService.updateStatus(thesis._id, { ...packet, password });
          await onLoad();
        }
      }
      setPacket(null);
      setUpdateStudentGradeDialogOpen(false);
    } catch (error) {
      
    } finally {
      setUpdating(false);
    }
  };

  const isAuthor = () => {
    return thesis && thesis.authors.find(e => e._id === account.accountID);
  };

  const isAdvisory = () => {
    return thesis && thesis.advisers.find(e => e._id === account.accountID);
  };

  const isPanelist = () => {
    return thesis && thesis.panelists.find(e => e._id === account.accountID);
  };

  const isAdmin = () => {
    return account.kind === 'administrator';
  };

  const renderName = account => <><Link to={`/account/${account._id}`}>{t('values.display_full_name', account)}</Link>;&nbsp;</>;
  
  const gradeToDisplay = () => {
    if (!thesis) return null;
    /*const { grades } = thesis;
    if (!grades) return null;
    
    const gradesThisPhase = grades.filter(e => e.phase === thesis.phase);
    if (gradesThisPhase.length > 0) {
      if (gradesThisPhase[0].value < 1.0) {
        const dateGraded = dayjs(gradesThisPhase[0].date);
        if (dayjs().isBefore(dateGraded.add(30, 'day')))
          return '0.0 (Fail)';
      } else {
        return `${gradesThisPhase[0].value.toFixed(1)} (Pass)`;
      }
    }*/
    const author = findMember(thesis, account.accountID);
    if (!author) return null;

    return author.grade;
  };

  return thesis ? (
    <>
      {
        !thesis.approved && (account && account.kind === 'student') &&
          <Alert variant='info'>Your thesis requires approval from an administrator before you can start submitting.</Alert>
      }
      { 
        !thesis.approved && (account && account.kind === 'administrator') &&
          <Alert variant='info'>
            <Row>
              <Col className='d-flex flex-row align-items-middle'>
                <p className='my-auto'>This thesis requires approval from you or another administrator.</p>
              </Col>
              <Col className='d-flex flex-row align-items-end'>
                <Button color='primary' className='ms-auto me-2' onClick={handleApproveThesisRequest}>Approve Thesis</Button>
                <Button color='primary' onClick={handleDeleteThesis}>Delete Thesis</Button>
              </Col>
            </Row>
          </Alert>
      }
      <Row>
        <Col sm={9}>
          <h3>{thesis.title}</h3>
          <h6 className='text-muted'>by {thesis.authors.map(renderName)}</h6>
          <h6 className='text-muted'>advised by {thesis.advisers.map(renderName)}</h6>
          {
            thesis.description ?
              <p>{thesis.description}</p> :
              <p className='text-muted'>No description provided.</p>
          }
          {
            thesis.approved && <>
              <h5>Media and Files</h5>
              {
                (thesis.submissions && thesis.submissions.length > 0) ?
                  <>
                    <h6 className='text-muted'>Last updated on {dayjs(thesis.submissions[0].submitted).format('LLL')}</h6>
                    <ul>
                      {
                        thesis.submissions[0].attachments.map(e => (
                          <li>
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
                      (account.kind === 'student' && !submitting && deadlines) && (
                        deadlines.getTime() < Date.now()
                          ? <p>You cannot upload files beyond the deadline.</p>
                          : <><Button onClick={() => setSubmitting(!submitting)}>Upload Files</Button><br /><br /></>
                      )
                    }
                    <Link to={`/thesis/${thesis._id}/submission`}>See all submissions</Link><br />
                  </>
                  :
                  (
                    isAuthor() ?
                      (
                        !submitting && deadlines && (
                          <>
                            <p>You have not made any submissions for your thesis.</p>
                            {
                              deadlines.getTime() < Date.now()
                                ? <p>You cannot upload files beyond the deadline.</p>
                                : <Button onClick={() => setSubmitting(!submitting)}>Upload Files</Button>
                            }
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
            </>
          }
          {
            submitting && (
              <Card>
                <Card.Body>
                  <Card.Title>Submit files</Card.Title>
                  <Card.Text>
                    <Form.Group className="mb-3" controlId="formDocument" style={{ display: 'none' }}>
                      <Form.Label>Add file</Form.Label>
                      <Form.Control type="file" value={file} onChange={handleAddFile} disabled={uploading} ref={addFileButtonRef} />
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
                    <>
                      <Button onClick={() => (addFileButtonRef.current && addFileButtonRef.current.click())} className='mt-2'>
                        { files.length > 0 ? 'Add another file' : 'Add file' }
                      </Button>
                      <hr />
                    </>
                    <div className='mt-3'>
                      <Button onClick={handleUploadFiles} disabled={files.length < 1 || uploading} className='me-1'>Submit</Button>
                      <Button variant='secondary' onClick={() => { setFiles([]); setSubmitting(false); }} disabled={uploading}>Cancel</Button>
                    </div>
                  </Card.Text>
                </Card.Body>
              </Card>
            )
          }
          {
            thesis.approved && <>
              <Row className='mb-3'>
                <Col>
                  <h5 className='text-muted'>Comments</h5>
                </Col>
                <Col className='d-flex flex-column align-items-end'>
                  <div className='d-flex flex-row align-items-center'>
                    <Form.Select value={commentPhase ? commentPhase.toString() : ''} onChange={e => setCommentPhase(e.currentTarget.value)}>
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
                (isAuthor() || isAdvisory() || isPanelist() || isAdmin()) &&
                  <Form onSubmit={handleSubmitComment}>
                    <Form.Group className="mb-3" controlId="formComment">
                      <Form.Control
                        as='textarea'
                        placeholder='Type your comment...'
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.currentTarget.value)}
                        disabled={submittingComment}
                      />
                    </Form.Group>
                    <Button type='submit' disabled={submittingComment}>Post</Button>
                  </Form>
              }
              {
                comments.filter(e => commentPhase === 'all' || ((!commentPhase && e.phase === thesis.phase) || (Number.parseInt(commentPhase) === e.phase))).length > 0 ?
                  <div className='mt-3'>
                    {
                      comments.filter(e => commentPhase === 'all' || ((!commentPhase && e.phase === thesis.phase) || (Number.parseInt(commentPhase) === e.phase))).map(e => (
                        <Card className='mb-3'>
                          <Card.Body>
                            <Card.Title>
                              <div className='d-inline-block align-top'>
                                <ProfileImage
                                  roundedCircle
                                  width={30}
                                  thumbnail
                                  accountID={e.author._id}
                                  className='me-2'
                                />
                              </div>
                              <div className='d-inline-block'>
                                <div className='align-baseline'>
                                  {t('values.display_full_name', { ...e.author, context: e.inactive })}
                                </div>
                                <div>
                                  <small className='text-muted' style={{fontSize: '1rem'}}>{dayjs(e.sent).format('LLL')}</small>
                                  {
                                    e.author._id === account.accountID &&
                                      <Button variant='link' onClick={() => setCommentToDelete(e._id)}><Trash /></Button>
                                  }
                                </div>
                              </div>
                            </Card.Title>
                            <Card.Text className='mt-1'>
                              <div className='ps-2' style={{ marginInlineStart: '30px', whiteSpace: 'pre-wrap' }}>
                                {e.text}
                              </div>
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      ))
                    }
                  </div>
                  :
                  <p className='mt-2 text-center text-muted'>
                    There are no comments.
                  </p>
              }
            </>
          }
        </Col>
        <Col sm={3}>
          <div>
            {
              account.kind !== 'student' &&
                <LinkContainer to={`/thesis/${thesis._id}/edit`}>
                  <Button className='me-1'>Edit</Button>
                </LinkContainer>
            }
            <Button variant='secondary' onClick={() => navigate(-1)}>Back</Button>
          </div>
          <Card className='mt-2'>
            <Card.Body>
              <Card.Text>
                <h4>Phase</h4>
                <p className='d-flex'>{t(`values.thesis_phase.${thesis.phase}`)}</p>
                <h4>Status</h4>
                <p className='d-flex'>
                  <div className='d-flex flex-row align-items-center'>
                    <span className={updating ? 'text-muted' : ''}>{t(`values.thesis_status.${thesis.status}`)}</span>
                    { updating && <Spinner className='ms-2' size='sm' /> }
                  </div>
                </p>
                <h4>Deadline</h4>
                <p className='d-flex'>{dayjs(deadlines).format('LLL')}</p>
                {
                  (isAdvisory() && (thesis.status === 'for_checking' || thesis.status === 'checked')) &&
                    <p>
                      { thesis.status !== 'checked' && <Button onClick={handleCheckThesis} className='me-2'>Mark as checked</Button> }
                      <Button onClick={handleEndorsement}>Endorse</Button>
                    </p>
                }
                {
                  (account && account.kind !== 'student') &&
                    <p>
                      { thesis.status === 'pass' && thesis.phase === 3 && <Button onClick={handleLockThesis}>Mark thesis as done</Button> }
                      { thesis.status === 'pass' && thesis.phase < 3 && <Button onClick={handleAdvanceThesis}>Advance to next phase</Button> }
                    </p>
                }
                <h4>{ isAuthor() ? 'My Grade' : 'Grade' }</h4>
                <p>
                  { gradeToDisplay() || (isAuthor() ? 'No grade yet' : '') }
                  {
                    (isAdvisory() || isAdmin()) &&
                      <Button as='a' bsPrefix='__' onClick={openStudentGradeDialog}>
                        Edit
                      </Button>
                  }
                </p>
                <p>
                  <Button as='a' bsPrefix='__' onClick={() => setGradeSummaryDialogOpen(true)}>
                    View grade summary
                  </Button>
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
      <Modal show={updateStudentGradeDialogOpen} animation={false} centered size='lg'>
        <Modal.Header>
          <Modal.Title>Update student grades</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStudentGradeSubmission}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formGradeMode">
              <Form.Label>Grade individually</Form.Label>
              <Form.Check aria-label="Grade individually" value={gradeMode} onChange={e => setGradeMode(e.currentTarget.checked)} />
            </Form.Group>
            {
              gradeMode ? <>
              <Form.Label className='fw-bold'>Author Grades</Form.Label>
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    thesis && thesis.authors.map(e => (
                      <tr>
                        <td>{t('values.full_name', e)}</td>
                        <td>
                          <Form.Select aria-label="Grade" value={studentGrades[e._id] ? studentGrades[e._id].grade : ''} onChange={ev => updateStudentGrade(e._id, ev.currentTarget.value)}>
                            <option value="">Select grade...</option>
                            <option>4.0</option>
                            <option>3.5</option>
                            <option>3.0</option>
                            <option>2.5</option>
                            <option>2.0</option>
                            <option>1.5</option>
                            <option>1.0</option>
                            <option>0.0</option>
                            <option>9.9</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control aria-label="Remarks" value={studentGrades[e._id] ? studentGrades[e._id].remarks : ''} onChange={ev => updateStudentRemarks(e._id, ev.currentTarget.value)} />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
              </> : <>
                <Form.Group className="mb-3" controlId="formGrade">
                  <Form.Label>Thesis Grade</Form.Label>
                  <Form.Select aria-label="Grade" value={grade} onChange={e => updateGroupGrade(e.currentTarget.value)}>
                    <option value="">Select grade...</option>
                    <option>4.0</option>
                    <option>3.5</option>
                    <option>3.0</option>
                    <option>2.5</option>
                    <option>2.0</option>
                    <option>1.5</option>
                    <option>1.0</option>
                    <option>0.0</option>
                    <option>9.9</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formRemarks">
                  <Form.Label>Thesis Remarks</Form.Label>
                  <Form.Control as="textarea" rows={3} value={remarks} onChange={e => updateGroupRemarks(e.currentTarget.value)} />
                </Form.Group>
              </>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button type='submit'>Save</Button>
            <Button variant='secondary' onClick={closeStudentGradeDialog}>Close without saving</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={gradeSummaryDialogOpen} animation={false} centered>
        <Modal.Header>
          <Modal.Title>Grade summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            thesis && thesis.authors.map(e => (
              <Row as='dl'>
                <Col as='dt' sm={6}>
                  {t('values.full_name', e)}
                </Col>
                <Col as='dt' sm={6}>
                  <div className='fw-normal'>
                    {findMember(thesis, e._id).grade}
                  </div>
                </Col>
              </Row>
            ))
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setGradeSummaryDialogOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={!!commentToDelete} animation={false} centered>
        <Modal.Header>
          <Modal.Title>Delete comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Once deleted, it cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => deleteComment(commentToDelete)} disable={commentDeleting}>Delete</Button>
          <Button variant='secondary' onClick={() => setCommentToDelete('')} disable={commentDeleting}>Cancel</Button>
        </Modal.Footer>
      </Modal>
      <PasswordPrompt show={passwordDialogOpen} onSubmit={handlePasswordEntry} onCancel={() => setPasswordDialogOpen(false)} />
    </>
  ) : (noThesis &&
    <>
      <h3>My Thesis</h3>
      <p>This page is empty, which means that you have not registered your thesis project with the system.</p>
      <p>Why not <Link to='/thesis/new'>request that your thesis project be added by an administrator</Link>?</p>
    </>
  );
}

export default ThesisPage;
