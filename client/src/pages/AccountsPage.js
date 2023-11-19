import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { DatatableWrapper, Filter, Pagination, PaginationOptions, TableBody, TableHeader } from 'react-bs-datatable';
import { useTranslation } from 'react-i18next';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import ProfileImage from '../components/ProfileImage';
import AccountService from '../services/AccountService';
import buffer from 'buffer';
import base64url from 'base64url';

window.Buffer = window.Buffer || buffer.Buffer;

function ImportAccountsDialog(props) {
  const SPREADSHEET_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].join(',');

  const { open, defaultType, onImport, onCancel } = props;
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState('');
  const [error, setError] = useState('');

  const defaultAccountType = defaultType || 'student';

  const handleImportFromFile = e => {
    const file = e.currentTarget.files[0];
    const fr = new FileReader();
    fr.onload = async () => {
      const contents = fr.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(contents);

      const worksheet = workbook.worksheets[0];
      const { rowCount, columnCount } = worksheet;

      let lastNameCol = 1;
      let firstNameCol = 2;
      let middleNameCol = -1;
      let emailCol = 3;
      let typeCol = -1;

      // Discover headers
      const firstRow = worksheet.getRow(1);
      for (let i = 1; i <= columnCount; i++) {
        const value = firstRow.getCell(i).value;
        switch (value.toLowerCase()) {
          case 'lastname': case 'last name': lastNameCol = i; break;
          case 'firstname': case 'first name': firstNameCol = i; break;
          case 'middlename': case 'middle name': middleNameCol = i; break;
          case 'email': emailCol = i; break;
          case 'type': typeCol = i; break;
          default: break;
        }
      }

      // Add accounts from spreadsheet
      const importedAccounts = [];
      for (let i = 2; i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        const lastName = row.getCell(lastNameCol).value;
        const firstName = row.getCell(firstNameCol).value;
        const middleName = middleNameCol !== -1 ? row.getCell(middleNameCol).value : undefined;
        const emailCell = row.getCell(emailCol);
        const email = emailCell.value.text || emailCell.value;
        const kind = typeCol !== -1 ? row.getCell(typeCol).value : defaultAccountType;
        importedAccounts.push({ lastName, firstName, middleName, kind, email });
      }

      async function check(accounts) {
        const emails = accounts.map(e => e.email).join(';');
        const duplicates = await AccountService.getAccounts('', { findDuplicates: base64url.encode(emails) });
        return duplicates;
      }

      const nonduplicates = importedAccounts.filter(e => accounts.findIndex(e2 => e2.email === e.email) === -1);
      const importDuplicates = importedAccounts.filter(e => accounts.findIndex(e2 => e2.email === e.email) !== -1);
      const importDuplicateCount = importDuplicates.length;

      const storeDuplicates = await check(nonduplicates);
      let storeDuplicateCount = 0;
      if (storeDuplicates.length > 0) {
        for (const account of nonduplicates) {
          if (storeDuplicates.some(e => e.email === account.email)) {
            account.status = 'duplicate';
            storeDuplicateCount++;
          }
        }
      }

      const messages = [];
      if (importDuplicateCount) {
        if (importDuplicateCount === 1) {
          messages.push('The imported file contains a duplicate entry from the current list and thus it is excluded.');
        } else {
          messages.push(`The imported file contains ${importDuplicateCount} duplicate entries from the current list and thus they are excluded.`);
        }
      }

      if (storeDuplicateCount > 0) {
        if (storeDuplicateCount === 1) {
          messages.push('One of the entries imported is identified to be a duplicate of one of the accounts already in the system. It will appear here marked, but it will not be imported.');
        } else {
          messages.push(`${storeDuplicateCount} entries are identified to be duplicates of some of the accounts already in the system. They will appear here marked, but they will not be imported.`);
        }
      }
      
      setError(messages.join(' '));
      setAccounts(prev => [...prev, ...nonduplicates]);
    };
    fr.readAsArrayBuffer(file);

    setFile('');
  };

  const handleClear = () => {
    setAccounts([]);
  };

  const handleSubmitForm = async () => {
    if (accounts.length < 1) {
      setError('No accounts to import.');
      return;
    }
    
    if (onImport) {
      try {
        const result = onImport(accounts.filter(e => e.status !== 'duplicate'));
        if (typeof result === 'object' && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        setError(error.code ? t(error.code) : error.message);
      }
    }
  };

  const handleCancelForm = () => {
    if (onCancel) onCancel();
  };

  const removeEntry = index => {
    setAccounts(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  useEffect(() => {
    // Clear accounts when dialog is closed.
    if (!open) {
      setAccounts([]);
    }
  }, [open])

  return (
    <Modal show={open} size='lg' animation={false} centered scrollable>
      <Modal.Header>
        <Modal.Title>Add accounts from file</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        { error && <Alert onClose={() => setError('')} dismissible>{error}</Alert> }
        <Form.Group className="mb-3" controlId="formDocument">
          <Form.Label>Import spreadsheet</Form.Label>
          <Form.Control type="file" value={file} onChange={handleImportFromFile} accept={SPREADSHEET_MIME_TYPES} />
        </Form.Group>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
              accounts.map((e, i) => (
                <tr className={e.status === 'duplicate' ? 'bg-warning' : ''}>
                  <td>{t('values.full_name', e)}</td>
                  <td>{e.email}</td>
                  <td>{t(`values.account_kind.${e.kind}`)}</td>
                  <td>
                    <Button variant='link' size='sm' onClick={() => removeEntry(i)}><Trash /></Button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleClear} disabled={accounts.length === 0}>Clear all</Button>
        <Button onClick={handleSubmitForm} disabled={accounts.filter(e => e.status !== 'duplicate').length === 0}>Add all</Button>
        <Button variant='secondary' onClick={handleCancelForm}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}

function AccountsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [type, setType] = useState('');
  const [importAccountDialogOpen, setImportAccountDialogOpen] = useState(false);
  const [deleteID, setDeleteID] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showActive, setShowActive] = useState('');

  const load = async () => {
    const accounts = await AccountService.getAccounts(type, { showActive });
    setAccounts(accounts.map(e => ({
      ...e,
      fullName: `${t('values.full_name', e)} ${e.inactive ? '(Inactive)' : ''}`
    })));
  };

  const handleImportAccounts = async accountsToImport => {
    await AccountService.createAccounts(accountsToImport);
    await load();
    setImportAccountDialogOpen(false);
  };

  const handleDelete = async id => {
    try {
      await AccountService.deleteAccount(id);
      await load();
      setDeleteID('');
    } catch (error) {
      setDeleteError(error.code ? t(error.code) : error.message);
    }
  };

  useEffect(() => {
    load();
  }, [showActive]);

  const headers = [
    {
      title: '',
      prop: 'photo',
      cell: (row) => (
        <React.Fragment key={`photo-${row._id}`}>
          <ProfileImage
            roundedCircle
            width={24}
            className='ms-1 me-1'
            accountID={row._id}
            alt={t('values.full_name', row)}
          />
        </React.Fragment>
      ),
      thProps: {
        style: {
          width: '36px'
        }
      }
    },
    {
      title: 'Name',
      prop: 'fullName',
      isFilterable: true
    },
    {
      title: 'Type',
      prop: 'kind',
      cell: (row) => t(`values.account_kind.${row.kind}`)
    },
    {
      title: 'Actions',
      prop: 'actions',
      cell: (row) => (
        <>
          <LinkContainer to={`/account/${row._id}`}>
            <Button variant='link' size='sm'><Pencil /></Button>
          </LinkContainer>
          { row.kind !== 'administrator' && <Button variant='link' size='sm' onClick={() => setDeleteID(row._id)}><Trash /></Button> }
        </>
      )
    }
  ];

  return (
    <>
      <Row className='mb-3'>
        <Col>
          <h3>Accounts</h3>
        </Col>
        <Col className='d-flex flex-column align-items-end'>
          <div className='d-flex flex-row align-items-center'>
            <Button className='me-2' onClick={() => setImportAccountDialogOpen(true)}>Import Accounts...</Button>
            <LinkContainer to='/account/new'><Button className='me-2' as='a'>Add Account</Button></LinkContainer>
          </div>
        </Col>
      </Row>
      <DatatableWrapper
        headers={headers}
        body={accounts}
        paginationOptionsProps={{
          initialState: {
            rowsPerPage: 15,
            options: [5, 10, 15, 20, 50, 100]
          }
        }}
      >
        <Row>
          <Col className='d-flex flex-col justify-content-start align-items-end mb-2 mb-sm-0'>
            <Filter placeholder='Filter accounts' />
          </Col>
          <Col className='d-flex flex-col justify-content-end align-items-end'>
            <Row>
              <Col>
                <Form.Select value={showActive} onChange={e => setShowActive(e.currentTarget.value)}>
                  <option value=''>Show only active accounts</option>
                  <option value='inactive'>Show only inactive accounts</option>
                  <option value='all'>Show all</option>
                </Form.Select>
              </Col>
            </Row>
          </Col>
        </Row>
        <Table striped hover size="sm">
          <TableHeader />
          <TableBody />
        </Table>
        <Row>
          <Col className='d-flex flex-col justify-content-start align-items-end mb-2 mb-sm-0'>
            <PaginationOptions />
          </Col>
          <Col className='d-flex flex-col justify-content-end align-items-end'>
            <Pagination />
          </Col>
        </Row>
      </DatatableWrapper>
      <ImportAccountsDialog
        open={importAccountDialogOpen}
        onImport={handleImportAccounts}
        onCancel={() => setImportAccountDialogOpen(false)}
      />
      <Modal show={!!deleteID} size='lg' animation={false} centered scrollable>
        <Modal.Header>
          <Modal.Title>Delete account</Modal.Title>
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

export default AccountsPage;
