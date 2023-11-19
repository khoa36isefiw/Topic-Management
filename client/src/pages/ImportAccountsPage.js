import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import AccountService from '../../services/AccountService';
import renderName from '../../utility/renderName';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { LinkContainer } from 'react-router-bootstrap';
import ExcelJS from 'exceljs';
import { useTranslation } from 'react-i18next';
import { DatatableWrapper, Pagination, PaginationOptions, TableBody, TableHeader } from 'react-bs-datatable';
import ProfileImage from '../../components/ProfileImage';

function ImportAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [type, setType] = useState('');
  const [importedAccounts, setImportedAccounts] = useState([]);
  const [importAccountDialogOpen, setImportAccountDialogOpen] = useState(false);
  const [file, setFile] = useState('');

  const load = async () => {
    setAccounts(await AccountService.getAccounts(type));
  };

  const removeImport = index => {
    setImportedAccounts(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleAddFile = e => {
    const file = e.currentTarget.files[0];
    const fr = new FileReader();
    console.log(file);
    fr.onload = async () => {
      const contents = fr.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(contents);

      const worksheet = workbook.worksheets[0];
      const rowCount = worksheet.rowCount;
      const accounts = [];
      const kind = 'student';
      for (let i = 2; i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        const lastName = row.getCell(1).value;
        const firstName = row.getCell(2).value;
        const email = row.getCell(3).value;
        accounts.push({ lastName, firstName, kind, email });
      }
      setImportedAccounts(accounts);
    };
    fr.readAsArrayBuffer(file);

    setFile('');
  };

  const handleCloseImportModal = () => {
    setImportedAccounts([]);
    setImportAccountDialogOpen(false);
  };

  const handleImportAccounts = async e => {
    e.preventDefault();
    try {
      await AccountService.createAccounts(importedAccounts);
      await load();
      setImportAccountDialogOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <DatatableWrapper
        body={accounts}
        headers={[
          {
            title: '',
            prop: 'photo',
            cell: (row) => (
              <React.Fragment key={`photo-${row._id}`}>
                <ProfileImage
                  roundedCircle
                  width={30}
                  className='ms-1 me-2'
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
            prop: 'name',
            cell: (row) => (
              <>
                <span>{t('values.full_name', row)}</span>
              </>
            )
          },
          {
            title: 'Actions',
            prop: 'actions',
            cell: (row) => (
              <>
                <LinkContainer to={`/account/${row._id}`}>
                  <Button variant='link' size='sm'><Pencil /></Button>
                </LinkContainer>
              </>
            )
          }
        ]}
        paginationOptionsProps={{
          initialState: {
            rowsPerPage: 15,
            options: [5, 10, 15, 20, 50, 100]
          }
        }}
      >
        <Row className='mb-2'>
          <Col>
            <h3>Account</h3>
          </Col>
          <Col className='d-flex flex-column align-items-end'>
            <div>
              <Button className='me-2' onClick={() => setImportAccountDialogOpen(true)}>Add accounts from file...</Button>
              <LinkContainer to='/account/new'><Button as='a'>Add account</Button></LinkContainer>
            </div>
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
      <Modal show={importAccountDialogOpen} size='lg' animation={false} centered scrollable>
        <Modal.Header>
          <Modal.Title>Add accounts from file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="formDocument">
            <Form.Label>Import spreadsheet</Form.Label>
            <Form.Control type="file" value={file} onChange={handleAddFile} accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
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
                importedAccounts.map((e, i) => (
                  <tr>
                    <td>{renderName(e)}</td>
                    <td>{e.email}</td>
                    <td>{t(`values.account_kind.${e.kind}`)}</td>
                    <td>
                      <Button variant='link' size='sm' onClick={() => removeImport(i)}><Trash /></Button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleImportAccounts}>Add all</Button>
          <Button variant='secondary' onClick={handleCloseImportModal}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ImportAccountsPage;
