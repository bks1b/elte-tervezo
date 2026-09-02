import { RefreshCw, Search } from 'lucide-react';
import { ReactNode } from 'react';

import { Dict, Subjects } from '../../../shared/types';
import { useData } from '../../contexts/data';
import { useRequest } from '../../contexts/request';
import { useInputRef } from '../../utils/hooks';
import { useSetResults, withSelected } from '../results';

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
  const { bulkSearch } = useRequest();
  const setResults = useSetResults();
  const { request } = useRequest();
  const query = useInputRef();
  return <section className='surface menu'>
    <div className='toolbar'>
      {semester.select}
      {!!Object.keys(subjects[0]).length
        && <button
          style={{ marginLeft: 'auto' }}
          onClick={async () => setResults(withSelected(await bulkSearch(path, subjects[0]), true))}
        >
          <RefreshCw/>
          Órarendi adatok frissítése
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
