import { createContext, ReactNode } from 'react';
import { useImmer } from 'use-immer';

import { mergeData } from '../../shared/helpers';
import { Dict, SearchResults } from '../../shared/types';
import { mapEntries } from '../../shared/utils';
import Modal from '../components/Modal';
import SubjectList from '../components/SubjectList';
import { useData } from '../contexts/data';
import { options, wrapNonEmpty } from '../utils/helpers';
import { makeUse } from '../utils/hooks';

const withSelected = (results: SearchResults, all: boolean) => ({
  ...results,
  selected: mapEntries(results.subjects, ([k]) => [[k, all]]),
});

const ResultsContext = createContext<((results: SearchResults, all?: boolean) => void) | undefined>(
  undefined,
);

export const useSetResults = makeUse(ResultsContext);

export const ResultsProvider = ({ children }: { children: ReactNode }) => {
  const { subjects } = useData();
  const state = useImmer<SearchResults & { selected: Dict<boolean> } | undefined>(undefined);
  return <ResultsContext.Provider
    value={(results, all = true) => state[1](withSelected(results, all))}
  >
    <Modal
      state={state}
      title={() => 'Találatok'}
      checkbox={(results, set) =>
        wrapNonEmpty(keys =>
          <input
            type='checkbox'
            checked={keys.every(k => results.selected[k])}
            onChange={e => set(withSelected(results, e.target.checked))}
          />, Object.keys(results.selected))}
      handler={results =>
        subjects[1](draft =>
          mergeData(
            draft,
            mapEntries(results.subjects, x => results.selected[x[0]] ? [x] : []),
          )
        )}
      closeHandler
    >
      {({ aliases }) =>
        <SubjectList
          get={[state, x => x.subjects]}
          fallback={'Nincs találat.'}
          checkbox={x => x.selected}
          title={code =>
            (arr =>
              arr && arr.length > 1 && <select
                value={code}
                onChange={e =>
                  state[1](draft =>
                    (['subjects', 'selected'] as const).forEach(key =>
                      draft![key] = mapEntries(
                        draft![key] as Dict<unknown>,
                        x => [x[0] === code ? [e.target.value, x[1]] : x],
                      ) as never
                    )
                  )}
              >
                {options(arr)}
              </select>)(aliases?.find(arr => arr.includes(code)))}
        />}
    </Modal>
    {children}
  </ResultsContext.Provider>;
};
