import { Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';

import { getGroup, mapSubjects } from '../../shared/helpers';
import DisabledButton from '../components/DisabledButton';
import { useData } from '../contexts/data';
import { ModalType, useSetModal } from '../contexts/modal';
import { useRequest } from '../contexts/request';
import { loadStorage, StorageKey, writeStorage } from '../utils/browser';
import { joinUl } from '../utils/helpers';
import { useAsync, useInputRef } from '../utils/hooks';
import DaysEditor, {
  DEFAULT_BREAK,
  DEFAULT_DAYS,
  DEFAULT_GAP,
  DEFAULT_INTERVAL,
} from './constraints/DaysEditor';
import SubjectsEditor, { OPTIONALITIES } from './constraints/SubjectsEditor';
import Results from './Results';
import { DayConstraints, MAX_PENALTY, SubjectConstraints } from './search/helpers';
import { SearchHandler } from './search/SearchHandler';
import { SearchState } from './search/SearchState';

const LECTURE = 'Előadás';

const DEFAULT_CONSTRAINTS = [
  { days: DEFAULT_DAYS, penalty: MAX_PENALTY + 1, interval: DEFAULT_INTERVAL },
  { days: DEFAULT_DAYS, penalty: MAX_PENALTY / 2, interval: ['10:00', '15:00'] },
  { days: DEFAULT_DAYS, penalty: MAX_PENALTY / 2, gap: DEFAULT_GAP },
  {
    days: DEFAULT_DAYS,
    penalty: MAX_PENALTY / 4,
    interval: ['11:00', '14:00'],
    break: DEFAULT_BREAK,
  },
  { days: [, , , , , true], penalty: MAX_PENALTY },
];

const SOLUTION_COUNT = { min: 10, max: 500, defaultValue: 100 };

export default () => {
  const setModal = useSetModal();
  const { subjects } = useData();
  const { request } = useRequest();
  const subjectConstraints = useImmer(() => {
    const prev: SubjectConstraints | undefined = loadStorage(StorageKey.SUBJECT_CONSTRAINTS);
    return {
      ...prev,
      ...mapSubjects(
        subjects[0],
        (_, path) => [
          path[1] === LECTURE
            ? { penalty: MAX_PENALTY + 1, collisionOnly: false, ...prev && getGroup(prev, path) }
            : {},
        ],
        (courseGroups, code) => ({
          penalty: MAX_PENALTY + 1,
          optionality: 2 * +/^[A-Z]+-\d+KV/.test(code),
          ...prev?.[code],
          courseGroups,
        }),
      ),
    };
  });
  const dayConstraints = useImmer<DayConstraints>(() =>
    loadStorage(StorageKey.DAY_CONSTRAINTS) || DEFAULT_CONSTRAINTS
  );
  const loading = !useAsync(
    () =>
      request<string[][]>('sheet/optionalities', { id: Object.keys(subjects[0]) + '' }, true).catch(
        () => []
      ),
    res =>
      subjectConstraints[1](draft =>
        res.forEach(x =>
          draft[x[0]].optionality = Math.max(0, OPTIONALITIES.indexOf(x[1]))
            || draft[x[0]].optionality
        )
      ),
  );
  const [results, setResults] = useState<SearchHandler>();
  const solutionCount = useInputRef();
  useEffect(() => writeStorage(StorageKey.SUBJECT_CONSTRAINTS, subjectConstraints[0]), [
    subjectConstraints[0],
  ]);
  useEffect(() => writeStorage(StorageKey.DAY_CONSTRAINTS, dayConstraints[0]), [dayConstraints[0]]);
  return <>
    <SubjectsEditor {...{ loading }} constraints={subjectConstraints}/>
    <DaysEditor constraints={dayConstraints}/>
    <section className='surface'>
      <div className='actions'>
        <label>
          <span>Megtartott megoldások száma:</span>
          <input type='number' {...SOLUTION_COUNT} ref={solutionCount}/>
        </label>
        <DisabledButton
          disabled={loading}
          onClick={() => {
            try {
              const handler = new SearchHandler(
                subjects[0],
                +solutionCount.current!.value || SOLUTION_COUNT.defaultValue,
                dayConstraints[0],
              );
              new SearchState(handler, subjectConstraints[0]).search();
              setResults(handler);
            } catch (error) {
              console.error(error);
              setModal(
                ModalType.ERROR,
                error instanceof Error && error.cause instanceof Array
                  ? <>{error.message}:{joinUl(error.cause)}</>
                  : error + '',
              );
            }
          }}
        >
          <Filter/>
          Órarendek generálása
        </DisabledButton>
      </div>
    </section>
    {results && <Results {...{ results }}/>}
  </>;
};
