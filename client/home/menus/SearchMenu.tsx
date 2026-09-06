import { RefreshCw, Search } from 'lucide-react';
import { ReactNode } from 'react';

import { getGroup, mergeData, selectCourses } from '../../../shared/helpers';
import { Dict, Subjects } from '../../../shared/types';
import { useData } from '../../contexts/data';
import { useRequest } from '../../contexts/request';
import { useInputRef } from '../../utils/hooks';
import { useSetResults, withSelected } from '../results';
import ImportButton from './ImportButton';

export const SEARCH_MODES = [['Tárgy', 'Oktató'], ['0', '1'], [
  'Tárgynév, tárgykód vagy kurzuskód',
  'Név vagy Neptun-kód',
]];

export default (
  { path, desc, label, select, searchMode, params, children }: {
    path: string;
    desc: ReactNode;
    label: string;
    select?: ReactNode;
    searchMode: number;
    params: (x: string) => Dict;
    children: ReactNode;
  },
) => {
  const { semester, subjects } = useData();
  const { request } = useRequest();
  const setResults = useSetResults();
  const query = useInputRef();
  const checkbox = useInputRef();
  const bulkSearch = async (data: Subjects) =>
    selectCourses(
      await request<Subjects>(path + '/bulk-search', {
        semester: semester.value,
        codes: Object.keys(data).join(','),
      }),
      p => getGroup(data, p)?.selected,
    );
  return <section className='surface menu'>
    <div className='toolbar'>
      {semester.select}
      <ImportButton handle={async res => mergeData(res, await bulkSearch(res))}/>
      {!!Object.keys(subjects[0]).length
        && <button
          onClick={async () => setResults(withSelected(await bulkSearch(subjects[0]), true))}
        >
          <RefreshCw/>
          Mentett tárgyak frissítése
        </button>}
    </div>
    <section>{desc}</section>
    <div className='operations'>
      <section>
        <h2>Keresés</h2>
        <label>
          <input type='checkbox' defaultChecked ref={checkbox}/>
          {label}
        </label>
        <form
          className='toolbar search'
          onSubmit={async e => {
            e.preventDefault();
            const trimmed = query.current!.value.trim().toLowerCase();
            if (!trimmed) return;
            const match = trimmed.match(/^(.+)-(\d{1,2})$/);
            setResults(
              withSelected(
                selectCourses(
                  await request<Subjects>(path + '/search', {
                    query: match?.[1] || trimmed,
                    ...params(+checkbox.current!.checked + ''),
                  }),
                  p => match?.[2] === p[2],
                ),
                false,
              ),
            );
          }}
        >
          {select}
          <input placeholder={SEARCH_MODES[2][searchMode]} ref={query} style={{ width: '100%' }}/>
          <button type='submit'>
            <Search/>
            Keresés
          </button>
        </form>
      </section>
      <section style={{ paddingBottom: '0' }}>{children}</section>
    </div>
  </section>;
};
