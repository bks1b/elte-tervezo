import { Plus, Trash2 } from 'lucide-react';
import { ImmerHook } from 'use-immer';

import { DAYS, SHIFTED_DAYS } from '../../../shared/dates';
import { Course, CoursePath } from '../../../shared/types';
import { join } from '../../../shared/utils';
import { WithHandler } from '../../components/Modal';
import TimeInterval from '../../components/TimeInterval';
import { useData } from '../../contexts/data';
import { useRequest } from '../../contexts/request';
import { LoadingSelect, options, valueAsProperty } from '../../utils/helpers';
import ModalWrapper from './ModalWrapper';

export type CourseModalState = WithHandler<{ course: Course; path: CoursePath }>;

export default ({ state }: { state: ImmerHook<CourseModalState | undefined> }) => {
  const { subjects } = useData();
  const { courseTypes } = useRequest();
  return <ModalWrapper
    state={state}
    title={(creating, { path }) =>
      `Kurzus ${creating ? 'hozzáadása' : 'szerkesztése'}: ${subjects[0][path[0]].name} (${
        path[0]
      })`}
    getId={x => x?.path[2]}
    validate={({ course, path }) => {
      if (course.time && !course.time.every(x => x)) return 'Hiányzik a kurzus ideje.';
      if (!path[2].trim()) return 'A kurzuskód nem lehet üres.';
    }}
  >
    {({ course }, set) =>
      <>
        <label>
          Kurzuskód:
          <input size={8} placeholder='1' {...valueAsProperty(state, x => x.path)(2)()}/>
        </label>
        <label>
          Típus:{courseTypes
            ? <select {...valueAsProperty(state, x => x.path)(1)()}>{options(courseTypes)}</select>
            : <LoadingSelect/>}
        </label>
        <label>
          Nap:
          <select
            {...valueAsProperty(state, x => x.course)('day')(x => x ?? '', x => x || undefined)}
          >
            {options(['', ...SHIFTED_DAYS.map(i => DAYS[i])])}
          </select>
        </label>
        <label>
          Idő:
          <TimeInterval
            get={[state, (x, s) => s ? x.course.time ||= ['', ''] : x.course.time || ['', '']]}
          />
        </label>
        <label>
          Helyszínek:
          <button
            className='circle'
            onClick={() => set(x => void x!.course.locations.push({ name: '' }))}
          >
            <Plus/>
          </button>
        </label>
        {course.locations.map((_, i) =>
          <div className='location' key={join(i, course.locations.length)}>
            <button
              className='circle'
              onClick={() => set(x => void x!.course.locations.splice(i, 1))}
            >
              <Trash2/>
            </button>
            <input
              placeholder='Déli Tömb Bolyai János terem'
              {...valueAsProperty(state, x => x.course.locations[i])('name')()}
            />
            <input
              placeholder='LD-0-821'
              {...valueAsProperty(state, x => x.course.locations[i])('id')(
                x => x ?? '',
                x => x || undefined,
              )}
            />
          </div>
        )}
        <label>
          Oktatók:
          <input
            size={38}
            {...valueAsProperty(state, x => x.course)('teachers')(x => x.join(', '), x =>
              x.split(/\s*,\s*/))}
          />
        </label>
      </>}
  </ModalWrapper>;
};
