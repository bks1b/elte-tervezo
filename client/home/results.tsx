import { RefreshCw } from 'lucide-react';
import { createContext, ReactNode } from 'react';
import { Updater, useImmer } from 'use-immer';

import { mergeData } from '../../shared/helpers';
import { Dict, Subjects } from '../../shared/types';
import Modal from '../components/Modal';
import SubjectList from '../components/SubjectList';
import { useData } from '../contexts/data';
import { useRequest } from '../contexts/request';
import { checkboxAsProperty, wrapNonEmpty } from '../utils/helpers';
import { makeUse } from '../utils/hooks';

type Results = { subjects: Subjects; selected: Dict<boolean>; update?: boolean };

const allSelected = (subjects: Subjects, v: boolean) =>
  Object.fromEntries(Object.keys(subjects).map(k => [k, v]));

export const withSelected = (subjects: Subjects, v: boolean, update = false) => ({
  subjects,
  update,
  selected: allSelected(subjects, v),
});

const ResultsContext = createContext<Updater<Results | undefined> | undefined>(undefined);

export const useSetResults = makeUse(ResultsContext);

export const ResultsProvider = ({ children }: { children: ReactNode }) => {
  const { subjects, semester } = useData();
  const { bulkSearch } = useRequest();
  const state = useImmer<Results | undefined>(undefined);
  return <ResultsContext.Provider value={state[1]}>
    <Modal
      state={state}
      title={() => 'Találatok'}
      button={(results, set) =>
        wrapNonEmpty(keys =>
          <input
            type='checkbox'
            checked={keys.every(k => results.selected[k])}
            onChange={e =>
              set(r => void (r!.selected = allSelected(results.subjects, e.target.checked)))}
          />, Object.keys(results.selected))}
      handler={results =>
        subjects[1](draft =>
          mergeData(
            draft,
            Object.fromEntries(
              Object.entries(results.subjects).filter(x => results.selected[x[0]]),
            ),
          )
        )}
      closeHandler
    >
      {(results, set) =>
        <>
          {results.update
            && <div className='toolbar'>
              {semester.select}
              {[['tanrend', 'Tanrendről'], ['sheet', 'kurzuslistából']].map(src =>
                <button
                  key={src[0]}
                  onClick={() =>
                    bulkSearch(src[0], results.subjects).then(result =>
                      set(draft => mergeData(draft!.subjects, result))
                    )}
                >
                  <RefreshCw/>
                  Adatok frissítése {src[1]}
                </button>
              )}
            </div>}
          <SubjectList
            get={[state, x => x.subjects]}
            fallback={'Nincs találat.'}
            buttons={code =>
              <input type='checkbox' {...checkboxAsProperty(state, x => x.selected)(code)()}/>}
          />
        </>}
    </Modal>
    {children}
  </ResultsContext.Provider>;
};
