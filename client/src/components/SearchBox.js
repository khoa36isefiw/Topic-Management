import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { AsyncTypeahead, Highlighter, Menu, MenuItem } from 'react-bootstrap-typeahead';
import { useTranslation } from 'react-i18next';
import ProfileImage from './ProfileImage';
import SearchService from '../services/SearchService';

function SearchBox(props) {
  const { autoFocus, typeFilter, onResult, placeholder } = props;
  const { t } = useTranslation();
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchSelected, setSearchSelected] = useState([]);

  const searchTheses = typeFilter && typeFilter.theses;
  const searchAccounts = typeFilter && typeFilter.accounts;

  const handleSearch = async (q) => {
    q = q.trim();
    if (q.length < 2) return;

    setSearchLoading(true);
    const options = await SearchService.search(q);
    setSearchOptions(options.filter(e => (e.type === 'thesis' && searchTheses) || (e.type === 'account' && searchAccounts)));
    setSearchLoading(false);
  };

  const handleOption = (option) => {
    const value = option.value;
    if (onResult) onResult(option.type, value);
    setSearchSelected([]);
  };

  const handleResult = () => {
    if (searchSelected.length > 0) {
      const option = searchSelected[0];
      handleOption(option);
    }
  }

  const handleSearchKey = (e) => {
    if (e.isComposing || e.keyCode === 229) return;

    if (e.keyCode === 13) {
      handleResult();
    }
  };

  const renderSearchMenu = (
    results,
    {
      newSelectionPrefix,
      paginationText,
      renderMenuItemChildren,
      ...menuProps
    },
    state
  ) => {
    if (!results || results.length === 0) {
      return <></>;
    }

    let index = 0;
    const items = results.map(e => {
      if (e.type === 'thesis') {
        const thesis = e.value;
        const item = (
          <MenuItem key={`thesis-${thesis._id}`} option={e} position={index}>
            <Highlighter search={state.name}>{thesis.title}</Highlighter>
            <div>
              <small>{thesis.authors.map(e => t('values.full_name', e)).join('; ')}</small>
            </div>
          </MenuItem>
        );
  
        index += 1;
        return item;
      } else if (e.type === 'account') {
        const account = e.value;
        const item = (
          <MenuItem key={`account-${account._id}`} option={e} position={index}>
            <ProfileImage 
              width={30}
              roundedCircle
              accountID={account._id}
              alt={t('values.full_name', account)}
              className='me-2'
            />
            <Highlighter search={state.name}>{t('values.full_name', account)}</Highlighter>
          </MenuItem>
        );
  
        index += 1;
        return item;
      } else {
        return <></>;
      }
    });
    return <Menu {...menuProps}>{items}</Menu>
  };

  return <>
    <Form.Group className='d-flex w-100'>
      <AsyncTypeahead
        autoFocus={autoFocus}
        id='formSearch'
        className="me-2 w-100"
        filterBy={() => true}
        isLoading={searchLoading}
        labelKey='key'
        renderMenu={renderSearchMenu}
        onSearch={handleSearch}
        options={searchOptions}
        aria-label="Search"
        placeholder={placeholder || "Search..."}
        selected={searchSelected}
        onChange={setSearchSelected}
        onKeyDown={handleSearchKey}
        selectHint={false}
      />
      <Button variant="outline-success" onClick={handleResult}>Search</Button>
    </Form.Group>
  </>;
}

export default SearchBox;
