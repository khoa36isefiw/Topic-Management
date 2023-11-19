import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { DatatableWrapper, Filter, Pagination, PaginationOptions, TableBody, TableHeader } from 'react-bs-datatable';
import { useTranslation } from 'react-i18next';
import ThesisService from '../services/ThesisService';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import { useAccount } from '../providers/account';

const getColumns = ({ t, hasActions }) => {
  const cols = [
    {
      title: 'Title',
      prop: 'title',
      isFilterable: true,
      cell: (row) => (
        <Link to={`/thesis/${row._id}`}>{row.title}</Link>
      )
    },
    {
      title: 'Last submitted',
      prop: 'lastSubmitted',
      cell: (row) => row.submission ? dayjs(row.submission.when).format('LLL') : 'No submission'
    },
    {
      title: 'Phase',
      prop: 'phase',
      cell: (row) => {
        return <>{t(`values.thesis_phase.${row.phase}`)}</>
      }
    },
    {
      title: 'Status',
      prop: 'status',
      cell: (row) => {
        return <>{t(`values.thesis_status.${row.status}`)}</>
      }
    }
  ];

  if (hasActions) {
    cols.push({
      title: 'Actions',
      prop: 'actions',
      cell: (row) => {
        return;
      }
    });
  }

  return cols;
};

function ThesisTable(props) {
  const { account } = useAccount();
  const { t } = useTranslation();
  const { theses, header, footer, all, filter, pagination, status, userKind, initialState } = props;
  const [thesesInternal, setThesesInternal] = useState([]);
  const columns = getColumns({ t });
  const [allInternal, setAllInternal] = useState(false);
  const [phase, setPhase] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [showPending, setShowPending] = useState((initialState || {}).showPending);

  const thesisList = theses || thesesInternal;

  const load = async () => {
    try {
      setLoading(true);
      const opts = {};
      if (all || allInternal) opts.all = true;
      if (status) opts.status = status;
      if (phase) opts.phase = phase;
      if (showPending) opts.showPending = showPending;
      const list = await ThesisService.getTheses(opts);
      setThesesInternal(list);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!theses) {
      load();
    } else {
      setThesesInternal([]);
    }
  }, [theses]);

  useEffect(() => {
    setAllInternal(userKind === 'administrator');
  }, [userKind]);

  useEffect(() => {
    if (!theses) {
      load();
    }
  }, [all, allInternal, phase, showPending]);

  const defaultHeader = () => (
    <Row className='mb-2'>
      <Col className='d-flex flex-col justify-content-start align-items-end mb-2 mb-sm-0'>
        { filter && <Filter placeholder='Filter thesis projects' /> }
      </Col>
      <Col>
        <Row>
          {
            account && account.kind !== 'administrator' &&
              <Col>
                <Form.Select value={allInternal ? 'true' : 'false'} onChange={e => setAllInternal(e.currentTarget.value === 'true')}>
                  <option value='false'>Show only my theses</option>
                  <option value='true'>Show all theses</option>
                </Form.Select>
              </Col>
          }
          <Col>
            <Form.Select value={phase ? phase.toString() : ''} onChange={e => setPhase(Number.parseInt(e.currentTarget.value) || undefined)}>
              <option value=''>Show all phases</option>
              <option value='1'>{t('values.thesis_phase.1')}</option>
              <option value='2'>{t('values.thesis_phase.2')}</option>
              <option value='3'>{t('values.thesis_phase.3')}</option>
            </Form.Select>
          </Col>
          <Col>
            <Form.Select value={showPending} onChange={e => setShowPending(e.currentTarget.value)}>
              <option value=''>Hide theses pending approval</option>
              <option value='show'>Show only theses to approve</option>
              <option value='all'>Show all</option>
            </Form.Select>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  const defaultFooter = () => (
    <Row>
      <Col className='d-flex flex-col justify-content-start align-items-end mb-2 mb-sm-0'>
        { pagination && <PaginationOptions /> }
      </Col>
      <Col className='d-flex flex-col justify-content-end align-items-end'>
        { pagination && <Pagination /> }
      </Col>
    </Row>
  );

  return (
    <>
      <DatatableWrapper
        body={loading ? [] : thesisList}
        headers={columns}
        paginationOptionsProps={{
          initialState: {
            rowsPerPage: 15,
            options: [5, 10, 15, 20, 50, 100]
          }
        }}
      >
        {header || defaultHeader()}
        <Table striped hover size="sm">
          <TableHeader />
          <TableBody />
        </Table>
        {footer || defaultFooter()}
      </DatatableWrapper>
    </>
  );
}

export default ThesisTable;
