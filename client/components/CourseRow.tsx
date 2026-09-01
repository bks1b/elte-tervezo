import { CircleAlert } from 'lucide-react';
import { ReactNode } from 'react';

import { Course, CoursePath } from '../../shared/types';
import { ModalType, useSetModal } from '../contexts/modal';
import { joinP, wrapNonEmpty } from '../utils/helpers';

export const getNotes = (
  course: Course,
) => [
  ...course.notes || [],
  ...course.weeks ? ['Hetek: ' + course.weeks.join(', ')] : [],
  ...!course.day || !course.time || !course.locations.length || course.partial
    ? ['A kurzus órarendi adatai hiányosak.']
    : [],
];

export const joinLocations = (course: Course, short = false) =>
  course.locations.map(x => short ? x.id ?? x.name : `${x.name}${x.id ? ` (${x.id})` : ''}`).join(
    ', ',
  );

export const CourseHeaders = () =>
  <>
    <th>Kód</th>
    <th>Típus</th>
    <th>Nap</th>
    <th>Időpont</th>
    <th>Oktató</th>
    <th>Helyszín</th>
    <th>Egyéb</th>
  </>;

export default (
  { course, path, children }: { course: Course; path: CoursePath; children?: ReactNode },
) => {
  const setModal = useSetModal();
  return <>
    <td>{path[2]}</td>
    <td>{path[1]}</td>
    <td>{course.day}</td>
    <td>{course.time?.join('-')}</td>
    <td>{course.teachers.join(', ')}</td>
    <td>{joinLocations(course)}</td>
    <td>
      <div className='actions'>
        {children}
        {wrapNonEmpty(notes =>
          <button className='circle' onClick={() => setModal(ModalType.INFO, joinP(notes))}>
            <CircleAlert/>
          </button>, getNotes(course))}
      </div>
    </td>
  </>;
};
