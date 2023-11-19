import React, { useEffect, useState } from 'react';
import { AsyncTypeahead, Highlighter, Menu, MenuItem } from 'react-bootstrap-typeahead';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../providers/account';
import ThesisService from '../../services/ThesisService';
import { useTranslation } from 'react-i18next';

function ThesisSelector(props) {
  const { className, value, onChange, required, disabled } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q) => {
    q = q.trim();
    if (q.length < 2) return;

    setLoading(true);
    const options = await ThesisService.getTheses({ q, all: true });
    setOptions(options);
    setLoading(false);
  };

  const handleOption = (option) => {
    if (onChange) onChange(option);
  };

  const handleOnChange = (value) => {
    console.log(value);
    if (onChange) onChange(value);
  }

  const handleSearchKey = (e) => {
    if (e.isComposing || e.keyCode === 229) return;

    if (e.keyCode === 13) {

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
      return (<></>);
    }

    let index = 0;
    const items = results.map(e => {
      const thesis = e;
      const item = (
        <MenuItem key={thesis._id} option={thesis} position={index}>
          <Highlighter search={state.name}>{thesis.title}</Highlighter>
          <div>
            <small>{thesis.authors.map(e => t('values.full_name', e)).join('; ')}</small><br />
            <small>{t(`values.thesis_phase.${e.phase}`)} phase</small>
          </div>
        </MenuItem>
      );

      index += 1;
      return item;
    });
    return <Menu {...menuProps}>{items}</Menu>
  };

  const handleChange = (value) => {
    setSelected(value);
    if (onChange) {
      if (value && value.length > 0) onChange(value[0]);
      else onChange(null);
    }
  };

  useEffect(() => {
    setSelected(value ? [value] : []);
  }, [value]);

  return (
    <AsyncTypeahead
      id='formSearch'
      aria-label="Search"
      className={className}
      filterBy={() => true}
      isLoading={loading}
      labelKey='title'
      onChange={handleChange}
      onKeyDown={handleSearchKey}
      onSearch={handleSearch}
      options={options}
      placeholder="Search thesis..."
      renderMenu={renderSearchMenu}
      selected={selected}
      selectHint={false}
      inputProps={{
        required
      }}
      disabled={disabled}
    />
  );
}

export default ThesisSelector;
