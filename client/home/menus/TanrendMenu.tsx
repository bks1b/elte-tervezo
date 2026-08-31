import { Filter } from 'lucide-react';
import { useMemo } from 'react';
import { useImmer } from 'use-immer';

import { TANREND_URL } from '../../../shared/helpers';
import { Dict, Subjects } from '../../../shared/types';
import { join } from '../../../shared/utils';
import DisabledButton from '../../components/DisabledButton';
import { useData } from '../../contexts/data';
import { useRequest } from '../../contexts/request';
import { LoadingSelect, options, valueAsProperty } from '../../utils/helpers';
import { useAsync, useSelect } from '../../utils/hooks';
import { useSetResults, withSelected } from '../results';
import SearchMenu, { SEARCH_MODES } from './SearchMenu';

export default () => {
  const { semester } = useData();
  const { request } = useRequest();
  const setResults = useSetResults();
  const groups = useAsync(
    () => request<Dict<[string, string][]>>('tanrend/groups'),
    res => grade[1]({ value: Object.keys(res)[0] }),
  );
  const grade = useImmer<{ value: string } | undefined>(undefined);
  const group = useSelect(
    ...useMemo(() =>
      (groups && grade[0]
        ? [0, 'Fix csoport', 1].map(i =>
          typeof i === 'number'
            ? groups[grade[0]!.value].map(x => x[i])
            : i
        )
        : []) as [string[]?, string?, string[]?], [groups, grade[0]]),
  );
  const searchMode = useImmer({ value: SEARCH_MODES[1][0] });
  return <SearchMenu
    path='tanrend'
    desc={
      <p>
        A <a href={TANREND_URL} target='_blank' rel='noreferrer'>Tanrend adatbázisban</a>{' '}
        elérhetőek a Lágymányosi kurzusok és fix csoportos órarendek, az előző félévekre
        visszamenőleg is.
      </p>
    }
    beforeInput={
      <select {...valueAsProperty(searchMode)('value')()}>
        {options(SEARCH_MODES[0], SEARCH_MODES[1])}
      </select>
    }
    searchMode={+searchMode[0].value}
    params={() => ({ semester: semester.value, mode: searchMode[0].value })}
  >
    <h2>Fix csoportos órarendek</h2>
    <div className='toolbar'>
      <label>
        Félév: {groups
          ? <select {...valueAsProperty(grade)('value')()}>
            {options(Object.keys(groups).map(x => join(2 * +x - 1, 2 * +x)), Object.keys(groups))}
          </select>
          : <LoadingSelect/>}
      </label>
      {group.select}
      <DisabledButton
        disabled={!groups}
        onClick={() =>
          request<Subjects>('tanrend/group', {
            semester: semester.value,
            group: group.value!,
            grade: grade[0]!.value,
          }).then(res => setResults(withSelected(res, true)))}
      >
        <Filter/>
        Betöltés
      </DisabledButton>
    </div>
  </SearchMenu>;
};
