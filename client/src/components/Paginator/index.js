import { useEffect, useState } from 'react';
import Pagination from 'react-bootstrap/Pagination';

function Paginator(props) {
  const { page, pageCount, onChange } = props;
  const pageBuffer = 3;

  const doChange = pageNumber => {
    if (onChange) onChange(pageNumber);
  };

  const renderPaginator = (currentPage, totalPages) => {
    const pageItemsCenter = [];

    const minPageClose = Math.max(currentPage - pageBuffer + 1, 1);
    const maxPageClose = Math.min(currentPage + pageBuffer - 1, totalPages);

    for (let i = minPageClose; i <= maxPageClose; i++) {
      pageItemsCenter.push({ page: i });
    }

    const pageItemsBegin = [];
    if (minPageClose > 3) {
      pageItemsBegin.unshift({ ellipsis: true });
    } else if (minPageClose > 2) {
      pageItemsBegin.unshift({ page: 2 });
    }
    if (minPageClose > 1) {
      pageItemsBegin.unshift({ page: 1 });
    }

    const pageItemsEnd = [];
    if (maxPageClose < totalPages - 2) {
      pageItemsEnd.push({ ellipsis: true });
    } else if (maxPageClose < totalPages - 1) {
      pageItemsEnd.push({ page: totalPages - 1 });
    }
    if (maxPageClose < totalPages) {
      pageItemsEnd.push({ page: totalPages });
    }

    const pageItems = [ ...pageItemsBegin, ...pageItemsCenter, ...pageItemsEnd ];
    console.log(pageItems);

    return (
      <Pagination>
        <Pagination.First disabled={currentPage <= 1} onClick={() => doChange(1)} />
        <Pagination.Prev disabled={currentPage <= 1} onClick={() => doChange(currentPage - 1)} />
        {
          pageItems.map((e, i) => e.ellipsis ?
            <Pagination.Ellipsis key={`pageButton-${i}`} /> :
            <Pagination.Item key={`pageButton-${i}`} onClick={() => doChange(e.page)} active={e.page === currentPage}>{e.page}</Pagination.Item>
          )
        }
        <Pagination.Next disabled={currentPage >= totalPages} onClick={() => doChange(currentPage + 1)} />
        <Pagination.Last disabled={currentPage >= totalPages} onClick={() => doChange(totalPages)} />
      </Pagination>
    )
  };

  return renderPaginator(page, pageCount);
}

export default Paginator;
