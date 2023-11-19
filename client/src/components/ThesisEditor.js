import { useEffect, useState } from "react";
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../providers/account';
import AccountService from '../services/AccountService';
import renderName from '../utility/renderName';
import { useTranslation } from "react-i18next";

function ThesisEditor(props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { account } = useAccount();
  const { thesis, onSubmit } = props;

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [faculty2, setFaculty2] = useState([]);
  const [faculty2Loading, setFaculty2Loading] = useState(false);
  const [selectedFaculty2, setSelectedFaculty2] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState('');
  const [authors, setAuthors] = useState([]);
  const [advisers, setAdvisers] = useState([]);
  const [panelists, setPanelists] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [file, setFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onLoad = async () => {
    if (thesis) {
      setTitle(thesis.title);
      setDescription(thesis.description);
      setAuthors(thesis.authors);
      setAdvisers(thesis.advisers);
      setPanelists(thesis.panelists || []);
      setStatus(thesis.status);
      setPhase(thesis.phase.toString());
    }
    setLoading(false);
  };

  const handleSearchStudents = async (q) => {
    setStudentsLoading(true);
    const students = await AccountService.getStudents({ q });
    setStudents(students);
    setStudentsLoading(false);
  };

  const canAddStudent = () => {
    if (selectedStudent.length < 1) return false;
    if (authors.find(e => e._id === selectedStudent[0]._id)) return false;
    if (authors.length >= 4) return false;
    return true;
  };

  const handleAddStudent = () => {
    if (selectedStudent.length < 1) return;
    if (!canAddStudent()) return;
    setAuthors(prev => {
      const value = students.find(e => e._id === selectedStudent[0]._id);
      return [ ...prev, value ];
    });
    setSelectedStudent([]);
  };

  const handleRemoveStudent = (id) => {
    setAuthors(prev => prev.filter(e => e._id !== id));
  };

  const handleSearchFaculty = async (q) => {
    setFacultyLoading(true);
    const faculty = await AccountService.getFaculty({ q });
    setFaculty(faculty);
    setFacultyLoading(false);
  };

  const canAddFaculty = () => {
    if (selectedFaculty.length < 1) return false;
    if (advisers.find(e => e._id === selectedFaculty[0]._id)) return false;
    if (advisers.length >= 4) return false;
    return true;
  };

  const handleAddFaculty = () => {
    if (selectedFaculty.length < 1) return;
    if (!canAddFaculty()) return;
    setAdvisers(prev => {
      const value = faculty.find(e => e._id === selectedFaculty[0]._id);
      return [ ...prev, value ];
    });
    setSelectedFaculty([]);
  };

  const handleRemoveFaculty = (id) => {
    setAdvisers(prev => prev.filter(e => e._id !== id));
  };

  const handleSearchPanelist = async (q) => {
    setFaculty2Loading(true);
    const faculty = await AccountService.getFaculty({ q });
    setFaculty2(faculty);
    setFaculty2Loading(false);
  };

  const canAddPanelist = () => {
    if (selectedFaculty2.length < 1) return false;
    if (panelists.find(e => e._id === selectedFaculty2[0]._id)) return false;
    if (panelists.length >= 4) return false;
    return true;
  };

  const handleAddPanelist = () => {
    if (selectedFaculty2.length < 1) return;
    if (!canAddPanelist()) return;
    setPanelists(prev => {
      const value = faculty2.find(e => e._id === selectedFaculty2[0]._id);
      return [ ...prev, value ];
    });
    setSelectedFaculty2([]);
  };

  const handleRemovePanelist = (id) => {
    setPanelists(prev => prev.filter(e => e._id !== id));
  };

  const handleAddAttachment = (e) => {
    const file = e.currentTarget.files[0];
    setAttachments(prev => [ ...prev, file ]);
    setFile('');
  };

  const handleRemoveAttachment = (e) => {
    setAttachments(prev => prev.filter(e2 => e2 !== e));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setError('');
    
    const errors = [];
    // Do client-side validation before submitting
    if (!title) errors.push('Title must be provided.');
    if (advisers.length < 1) errors.push('At least one adviser must be added.');
    else if (advisers.length > 2) errors.push('There can only be a maximum of two (2) advisers.');
    if (authors.length < 1) errors.push('At least one author must be added.');
    else if (authors.length > 4) errors.push('There can only be a maximum of four (4) authors.');

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    if (onSubmit) {
      try {
        setSuccess(false);
        setSaving(true);
        await onSubmit({
          title,
          description,
          authors,
          advisers,
          panelists,
          attachments,
          status,
          phase
        });
        setSuccess(true);
      } catch (error) {
        setError(error.code ? t(error.code) : error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    onLoad();
  }, [thesis]);

  useEffect(() => {
    if (thesis) return;
    if (account && account.kind === 'student') {
      setAuthors([{ _id: account.accountID, lastName: account.lastName, firstName: account.firstName }]);
    } else {
      setAuthors([]);
    }
  }, [account]);

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <h3>{ thesis ? 'Edit' : (account.kind === 'student' ? 'Request' : 'Add') } Thesis</h3>
          </Col>
          <Col className='d-flex flex-column align-items-end'>
            <div className='d-flex flex-row align-items-center'>
              { saving && <Spinner className='me-2' /> }
              <Button type='submit' className='ms-auto d-inline' disabled={saving}>Save</Button>
              <Button variant='secondary' className='ms-1 d-inline' onClick={() => navigate(-1)}>Back</Button>
            </div>
          </Col>
        </Row>
        { error && <Alert variant='danger' onClose={() => setError('')} dismissible>{error}</Alert> }
        { success && <Alert variant='success' onClose={() => setSuccess(false)} dismissible>Thesis successfully updated.</Alert> }
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label className='fw-bold'>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={e => setTitle(e.currentTarget.value)} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formDescription">
          <Form.Label className='fw-bold'>Description</Form.Label>
          <Form.Control as='textarea' type="text" value={description} onChange={e => setDescription(e.currentTarget.value)} />
        </Form.Group>
        {/*
          (account.kind === 'student') && 
            <Form.Group className="mb-3" controlId="formDocument">
              <Form.Label className='fw-bold'>Documents</Form.Label>
              <Form.Control type="file" value={file} onChange={handleAddAttachment} />
            </Form.Group>
        }
        {
          (account.kind === 'student') && (attachments.length > 0 &&
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {
                  attachments.map(e => (
                    <tr>
                      <td>{e.name}</td>
                      <td><Button as='a' variant='link' style={{ padding: 0 }} onClick={() => handleRemoveAttachment(e)}>Remove</Button></td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>)
        */}
        {
          (account.kind !== 'student') && (
            <Row>
              <Col>
                <Form.Group className="mb-3" controlId="formStatus">
                  <Form.Label className='fw-bold'>Status</Form.Label>
                  <Form.Select value={status} onChange={e => setStatus(e.currentTarget.value)}>
                    <option value='new'>New</option>
                    <option value='for_checking'>For checking</option>
                    <option value='checked'>Checked</option>
                    <option value='endorsed'>Endorsed</option>
                    <option value='pass'>Pass</option>
                    <option value='fail'>Fail</option>
                    <option value='final'>Final</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3" controlId="formPhase">
                  <Form.Label className='fw-bold'>Phase</Form.Label>
                  <Form.Select value={phase} onChange={e => setPhase(e.currentTarget.value)}>
                    <option value='1'>{t('values.thesis_phase.1')}</option>
                    <option value='2'>{t('values.thesis_phase.2')}</option>
                    <option value='3'>{t('values.thesis_phase.3')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )
        }
        <Form.Group className="mb-3" controlId="formAuthor">
          <Form.Label className='fw-bold'>Authors</Form.Label>
          <Row className="align-items-center">
            <Col xs={9} sm={10} className="my-1">
              <AsyncTypeahead
                id='formStudent'
                filterBy={(student) => !authors.includes(student._id)}
                isLoading={studentsLoading}
                labelKey={(option) => renderName(option)}
                minLength={2}
                onSearch={handleSearchStudents}
                options={students}
                onChange={setSelectedStudent}
                selected={selectedStudent}
                placeholder='Search from students...'
                useCache={false}
              />
            </Col>
            <Col xs={3} sm={2} className="my-1">
              <Button className='w-100' onClick={handleAddStudent} disabled={!canAddStudent()}>Add</Button>
            </Col>
          </Row>
        </Form.Group>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
              authors.length > 0 ? authors.map(e => (
                <tr>
                  <td>{e.lastName}</td>
                  <td>{e.firstName}</td>
                  <td><Button as='a' variant='link' style={{ padding: 0 }} onClick={() => handleRemoveStudent(e._id)}>Remove</Button></td>
                </tr>
              )) : <tr><td className='text-center' colSpan={3}>No authors added.</td></tr>
            }
          </tbody>
        </Table>
        <Form.Group className="mb-3" controlId="formAdviser">
          <Form.Label className='fw-bold'>Advisers</Form.Label>
          <Row className="align-items-center">
            <Col xs={9} sm={10} className="my-1">
              <AsyncTypeahead
                id='formFaculty'
                filterBy={(faculty) => !advisers.includes(faculty._id)}
                isLoading={facultyLoading}
                labelKey={(option) => renderName(option)}
                minLength={2}
                onSearch={handleSearchFaculty}
                options={faculty}
                onChange={setSelectedFaculty}
                selected={selectedFaculty}
                placeholder='Search from faculty...'
                useCache={false}
              />
            </Col>
            <Col xs={3} sm={2} className="my-1">
              <Button className='w-100' onClick={handleAddFaculty} disabled={!canAddFaculty()}>Add</Button>
            </Col>
          </Row>
        </Form.Group>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
              advisers.length > 0 ? advisers.map(e => (
                <tr>
                  <td>{e.lastName}</td>
                  <td>{e.firstName}</td>
                  <td><Button as='a' variant='link' style={{ padding: 0 }} onClick={() => handleRemoveFaculty(e._id)}>Remove</Button></td>
                </tr>
              )) : <tr><td className='text-center' colSpan={3}>No advisers added.</td></tr>
            }
          </tbody>
        </Table>
        {
          (account.kind === 'administrator') && <>
            <Form.Group className="mb-3" controlId="formPanelist">
              <Form.Label className='fw-bold'>Panelists</Form.Label>
              <Row className="align-items-center">
                <Col xs={9} sm={10} className="my-1">
                  <AsyncTypeahead
                    id='formPanelist'
                    filterBy={(faculty) => !panelists.includes(faculty._id)}
                    isLoading={facultyLoading}
                    labelKey={(option) => renderName(option)}
                    minLength={2}
                    onSearch={handleSearchPanelist}
                    options={faculty2}
                    onChange={setSelectedFaculty2}
                    selected={selectedFaculty2}
                    placeholder='Search from faculty...'
                    useCache={false}
                  />
                </Col>
                <Col xs={3} sm={2} className="my-1">
                  <Button className='w-100' onClick={handleAddPanelist} disabled={!canAddPanelist()}>Add</Button>
                </Col>
              </Row>
            </Form.Group>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {
                  panelists.length > 0 ? panelists.map(e => (
                    <tr>
                      <td>{e.lastName}</td>
                      <td>{e.firstName}</td>
                      <td><Button as='a' variant='link' style={{ padding: 0 }} onClick={() => handleRemovePanelist(e._id)}>Remove</Button></td>
                    </tr>
                  )) : <tr><td className='text-center' colSpan={3}>No panelists added.</td></tr>
                }
              </tbody>
            </Table>
          </>
        }
        <Button type='submit'>Save</Button>
      </Form>
    </>
  );
}

export default ThesisEditor;
