import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useImmer } from 'use-immer';

import { courseId, getGroup, getGroups } from '../../../shared/helpers';
import { addCourse } from '../../../shared/parsers';
import { CoursePath, Subjects } from '../../../shared/types';
import { mapEntries } from '../../../shared/utils';
import SubjectList from '../../components/SubjectList';
import { useData } from '../../contexts/data';
import { ModalType, useSetModal } from '../../contexts/modal';
import { useRequest } from '../../contexts/request';
import CourseModal, { CourseModalState } from './CourseModal';
import SubjectModal, { SubjectModalState } from './SubjectModal';

const removeCourse = (subjects: Subjects, path: CoursePath, index: number, f?: () => unknown) => {
  getGroup(subjects, path).courses.splice(index, 1);
  f?.();
  if (!getGroup(subjects, path).courses.length) delete getGroups(subjects, path)[path[2]];
  if (!Object.keys(getGroups(subjects, path)).length)
    delete subjects[path[0]].courseGroups[path[1]];
};

export default () => {
  const { courseTypes } = useRequest();
  const { subjects, readonly } = useData();
  const setModal = useSetModal();
  const courseModal = useImmer<CourseModalState | undefined>(undefined);
  const subjectModal = useImmer<SubjectModalState | undefined>(undefined);
  const add = <button
    className='circle'
    onClick={() =>
      subjectModal[1]({
        subject: { name: '', courseGroups: {} },
        code: '',
        handler: ({ subject, code }) => subjects[1](draft => void (draft[code.trim()] = subject)),
      })}
  >
    <Plus/>
  </button>;
  return <section className='surface'>
    <CourseModal state={courseModal}/>
    <SubjectModal state={subjectModal}/>
    <div className='buttons'>
      <h2>Tárgyak</h2>
      {!readonly[0] && <div className='actions'>
        {add}
        <button
          className='circle'
          onClick={() =>
            setModal(ModalType.CONFIRM, 'Biztosan törölni szeretnéd az összes tárgyat?', () =>
              subjects[1]({}))}
        >
          <Trash2/>
        </button>
      </div>}
    </div>
    <SubjectList
      get={[subjects]}
      fallback={<p>Használd a keresőket, vagy adj hozzá tárgyakat a {add} gombbal.</p>}
      buttons={code =>
        <>
          <button
            className='circle'
            onClick={() =>
              setModal(ModalType.CONFIRM, `Biztosan törölni szeretnéd a ${code} tárgyat?`, () =>
                subjects[1](draft => void delete draft[code]))}
          >
            <Trash2/>
          </button>
          <button
            className='circle'
            disabled={!courseTypes}
            onClick={() =>
              courseModal[1]({
                course: { locations: [], teachers: [] },
                path: [code, courseTypes![0], ''],
                handler: ({ course, path }) =>
                  subjects[1](draft =>
                    addCourse(
                      draft,
                      [...path.slice(0, -1), path[2].trim()] as CoursePath,
                      course,
                      true,
                    )
                  ),
              })}
          >
            <Plus/>
          </button>
          <button
            className='circle'
            onClick={() =>
              subjectModal[1]({
                subject: subjects[0][code],
                code,
                handler: state =>
                  subjects[1](
                    mapEntries(subjects[0], x => [x[0] === code ? [state.code, state.subject] : x]),
                  ),
              })}
          >
            <Pencil/>
          </button>
        </>}
      column={(path, index) =>
        <>
          <button
            className='circle'
            onClick={() =>
              courseModal[1]({
                course: getGroup(subjects[0], path).courses[index],
                path,
                handler: state =>
                  subjects[1](draft =>
                    removeCourse(draft, path, index, () =>
                      addCourse(
                        draft,
                        state.path,
                        state.course,
                        getGroup(draft as Subjects, path).selected,
                      ))
                  ),
              })}
          >
            <Pencil/>
          </button>
          <button
            className='circle'
            onClick={() =>
              setModal(
                ModalType.CONFIRM,
                `Biztosan törölni szeretnéd a ${courseId(path)} kurzust?`,
                () => subjects[1](draft => removeCourse(draft, path, index)),
              )}
          >
            <Trash2/>
          </button>
        </>}
    />
  </section>;
};
