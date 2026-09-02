import { RefreshCw, Search } from 'lucide-react';
import { ReactNode } from 'react';

import { flattenSubjects, mergeData } from '../../../shared/helpers';
import { Dict, Subjects } from '../../../shared/types';
import { join } from '../../../shared/utils';
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
  { path, desc, beforeForm, beforeInput, searchMode, params, children }: {
    path: string;
    desc: ReactNode;
    beforeForm?: ReactNode;
    beforeInput?: ReactNode;
    searchMode: number;
    params: () => Dict;
    children: ReactNode;
  },
) => {
  const { semester, subjects } = useData();
  const { request } = useRequest();
  const setResults = useSetResults();
  const query = useInputRef();
  const bulkSearch = (data: Subjects) =>
    request<Subjects>(path + '/bulk-search', {
      semester: semester.value,
      id: flattenSubjects(
        data,
        (group, [, , id]) => group.selected ? [id] : [],
        undefined,
        (selected, code) =>
          selected.length
            ? selected.map(x => join(code, x))
            : [code],
      ) + '',
    });
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
        {beforeForm}
        <form
          className='toolbar search'
          onSubmit={async e => (e.preventDefault(),
            query.current!.value
            && setResults(
              withSelected(
                await request<Subjects>(path + '/search', {
                  query: query.current!.value,
                  ...params(),
                }),
                false,
              ),
            ))}
        >
          {beforeInput}
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
