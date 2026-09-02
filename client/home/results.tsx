import { createContext, ReactNode } from 'react';
import { Updater, useImmer } from 'use-immer';

import { mergeData } from '../../shared/helpers';
import { Dict, Subjects } from '../../shared/types';
import Modal from '../components/Modal';
import SubjectList from '../components/SubjectList';
import { useData } from '../contexts/data';
import { checkboxAsProperty, wrapNonEmpty } from '../utils/helpers';
import { makeUse } from '../utils/hooks';

type Results = { subjects: Subjects; selected: Dict<boolean> };

const allSelected = (subjects: Subjects, v: boolean) =>
  Object.fromEntries(Object.keys(subjects).map(k => [k, v]));

export const withSelected = (subjects: Subjects, v: boolean) => ({
  subjects,
  selected: allSelected(subjects, v),
});

const ResultsContext = createContext<Updater<Results | undefined> | undefined>(undefined);

export const useSetResults = makeUse(ResultsContext);

export const ResultsProvider = ({ children }: { children: ReactNode }) => {
  const { subjects } = useData();
  const state = useImmer<Results | undefined>(undefined);
  return <ResultsContext.Provider value={state[1]}>
    <Modal
      state={state}
      title={() => 'Találatok'}
      checkbox={(results, set) =>
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
      {() =>
        <SubjectList
          get={[state, x => x.subjects]}
          fallback={'Nincs találat.'}
          checkbox={code =>
            <input type='checkbox' {...checkboxAsProperty(state, x => x.selected)(code)()}/>}
        />}
    </Modal>
    {children}
  </ResultsContext.Provider>;
};
