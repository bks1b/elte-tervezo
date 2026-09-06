import { Filter } from 'lucide-react';
import { useImmer } from 'use-immer';

import { FACULTY_NAME, SHEET_URL } from '../../../shared/helpers';
import { Subjects } from '../../../shared/types';
import DisabledButton from '../../components/DisabledButton';
import { useRequest } from '../../contexts/request';
import { valueAsProperty } from '../../utils/helpers';
import { useAsync, useSelect } from '../../utils/hooks';
import { useSetResults, withSelected } from '../results';
import SearchMenu from './SearchMenu';

export default () => {
  const { request } = useRequest();
  const setResults = useSetResults();
  const range = useImmer({ min: '', max: '' });
  const filterOptions = useAsync(
    () =>
      request<{ specs: string[]; optionalities: string[]; maxSemester: number }>(
        'sheet/filter-options',
      ),
    res => range[1]({ min: '1', max: res.maxSemester + '' }),
  );
  const spec = useSelect(filterOptions?.specs, 'Szak');
  const type = useSelect(filterOptions?.optionalities, 'Kötelezőség');
  return <SearchMenu
    path='sheet'
    desc={
      <>
        <p>
          A <a href={SHEET_URL} target='_blank' rel='noreferrer'>kurzuslistában</a>{' '}
          az aktuális félév összes ELTE-s kurzusa elérhető.
        </p>
        <p>
          A lista alapján kiszűrhetőek a különböző szakirányok tantervei, viszont a Lágymányosi
          kurzusok órarendi adatai gyakran hiányosak.
        </p>
      </>
    }
    label={`Csak ${FACULTY_NAME}-s tárgyak`}
    searchMode={0}
    params={faculty => ({ faculty })}
  >
    <h2>Szűrés</h2>
    <div className='toolbar filters'>
      {spec.select}
      {type.select}
      <label>
        Ajánlott félév:{' '}
        <input type='number' {...valueAsProperty(range)('min')()}/>-<input
          type='number'
          {...valueAsProperty(range)('max')()}
        />
      </label>
      <DisabledButton
        disabled={!filterOptions}
        onClick={async () =>
          setResults(
            withSelected(
              await request<Subjects>('sheet/filter', {
                spec: spec.value!,
                type: type.value!,
                ...range[0],
              }),
              false,
            ),
          )}
      >
        <Filter/>
        Szűrés
      </DisabledButton>
    </div>
  </SearchMenu>;
};
