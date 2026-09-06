import { ArrowRight, Merge, Plus, Trash2 } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';
import { ImmerHook, useImmer } from 'use-immer';

import {
  courseId,
  flattenSubject,
  flattenSubjects,
  getGroup,
  hasSchedule,
  mapSubjects,
} from '../../../shared/helpers';
import { addCourse } from '../../../shared/parsers';
import { CoursePath, Dict, Subjects } from '../../../shared/types';
import { mapEntries } from '../../../shared/utils';
import DisabledButton from '../../components/DisabledButton';
import Modal from '../../components/Modal';
import SubjectList from '../../components/SubjectList';
import { useData } from '../../contexts/data';
import { ModalType, useSetModal } from '../../contexts/modal';
import {
  checkboxAsProperty,
  joinUl,
  options,
  valueAsProperty,
  wrapNonEmpty,
} from '../../utils/helpers';
import { isMandatory, SubjectConstraints } from '../search/helpers';
import Penalty from './Penalty';

export const OPTIONALITIES = ['', 'Kötelező', 'Kötelezően választható', 'Szabadon választható'];

type MergeData = { source: string[]; target: string };

export default (
  { loading, constraints }: { loading: boolean; constraints: ImmerHook<SubjectConstraints> },
) => {
  const { subjects } = useData();
  const setModal = useSetModal();
  const mergeData = useImmer<MergeData | undefined>(undefined);
  const codes = Object.keys(subjects[0]);
  const prefixes = mapEntries(
    codes.reduce((a, x) => ((a[x.slice(0, -1)] ||= []).push(x), a), {} as Dict<string[]>),
    ([prefix, source]) =>
      source.length === 2
        ? [[prefix, { source, target: prefix + source.map(x => x.at(-1)).sort().join('') }]]
        : [],
  );
  const handleMerge = (data: MergeData) => {
    const target = data.target.trim();
    if (data.source.some(x => !x))
      throw setModal(ModalType.ERROR, 'Az egyesítéshez meg kell adni két tárgyat.');
    if (!target) throw setModal(ModalType.ERROR, 'Az egyesített tárgy kódja nem lehet üres.');
    const mergeSubjects = <T, U>(
      state: ImmerHook<Subjects<T, U>>,
      f: (draft: Subjects<T, U>) => (group: T, path: CoursePath) => unknown[],
    ) =>
      state[1](draft => {
        const exists = !!draft[target];
        draft[target] ||= draft[data.source[0]];
        data.source.slice(+!exists).forEach(code =>
          flattenSubject(draft as Subjects<T, U>, code, f(draft as Subjects<T, U>))
        );
        data.source.forEach(x => delete draft[x]);
      });
    mergeSubjects(
      subjects,
      draft => (group, path) =>
        group.courses.map(course =>
          addCourse(draft, [target].concat(path.slice(1)) as CoursePath, course, group.selected)
        ),
    );
    mergeSubjects(
      constraints,
      draft => (group, path) => [(draft[target].courseGroups[path[1]] ||= {})[path[2]] ||= group],
    );
  };
  return <section className='surface'>
    <Modal state={mergeData} title={() => 'Tárgyak egyesítése'} handler={handleMerge} closeHandler>
      {data =>
        <label>
          {data.source.map((_, i) =>
            <Fragment key={i}>
              <select {...valueAsProperty(mergeData, x => x.source)(i)()}>
                {options([''].concat(codes.filter((x, j) => x !== data.source[1 - j])))}
              </select>
              {!i && <Plus/>}
            </Fragment>
          )}
          <ArrowRight/>
          <input {...valueAsProperty(mergeData)('target')()}/>
        </label>}
    </Modal>
    <header>
      <h2>Tárgyak</h2>
    </header>
    {wrapNonEmpty(x => <div className='actions'>{x}</div>, [
      wrapNonEmpty(
        courses =>
          <button
            key={0}
            onClick={() =>
              setModal(
                ModalType.CONFIRM,
                <>Biztosan kitörlöd a következő hiányos kurzusokat?{joinUl(courses)}</>,
                () =>
                  subjects[1](mapSubjects(subjects[0], group =>
                    group.courses.every(hasSchedule) ? [group] : [])),
              )}
          >
            <Trash2/>
            Hiányos kurzusok törlése
          </button>,
        flattenSubjects(subjects[0], (group, path) =>
          !group.courses.every(hasSchedule) ? [courseId(path)] : []),
      ),
      wrapNonEmpty(values =>
        <DisabledButton
          key={1}
          disabled={loading}
          onClick={() =>
            setModal(
              ModalType.CONFIRM,
              <>
                Biztosan egyesíted a következő tárgyakat?
                {joinUl(values.map((x, i) =>
                  <label key={i}>
                    {x.source[0]}
                    <Plus/>
                    {x.source[1]}
                    <ArrowRight/>
                    {x.target}
                  </label>
                ))}
              </>,
              () => values.forEach(handleMerge),
            )}
        >
          <Merge/>
          Automatikus egyesítések
        </DisabledButton>, Object.values(prefixes)),
    ])}
    <SubjectList
      get={[subjects]}
      fallback={
        <p>Adj hozzá tárgyakat a főoldalon, hogy választhass kurzusokat az órarend generáláshoz.</p>
      }
      buttons={code =>
        <>
          {(data =>
            <DisabledButton
              disabled={loading}
              onClick={() => mergeData[1](data || { source: [code, ''], target: '' })}
            >
              <Merge/>
              {data?.source.find(x => x !== code) || 'Egyesítés'}
            </DisabledButton>)(prefixes[code.slice(0, -1)])}
          <select
            {...valueAsProperty(constraints, x => x[code])('optionality')(x => x + '', x => +x)}
          >
            {options(OPTIONALITIES, OPTIONALITIES.map((_, i) => i + ''))}
          </select>
        </>}
      column={path =>
        wrapNonEmpty(penalty =>
          <>
            <Penalty get={[constraints, x => getGroup(x, path)]}/>
            <label {...isMandatory(penalty) && { style: { textDecoration: 'line-through' } }}>
              <input
                disabled={isMandatory(penalty)}
                type='checkbox'
                {...checkboxAsProperty(constraints, x => getGroup(x, path))('collisionOnly')()}
              />
              Csak ütközéssel
            </label>
          </>, getGroup(subjects[0], path).selected && getGroup(constraints[0], path).penalty)}
    >
      {code => <Penalty get={[constraints, x => x[code]]}/>}
    </SubjectList>
  </section>;
};
