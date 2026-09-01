import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { flattenSubject, flattenSubjects, getGroup } from '../../shared/helpers';
import { CoursePath, Dict, Subjects } from '../../shared/types';
import { join } from '../../shared/utils';
import { useData } from '../contexts/data';
import { checkboxAsProperty, wrapNonEmpty } from '../utils/helpers';
import CourseRow, { CourseHeaders } from './CourseRow';

export default <T,>(
  { get, fallback, buttons, column, children }: {
    get: Parameters<typeof checkboxAsProperty<T, Subjects>>;
    fallback: ReactNode;
    buttons?: (code: string) => ReactNode;
    column?: (path: CoursePath, index: number) => ReactNode;
    children?: (code: string) => ReactNode;
  },
) => {
  const [open, setOpen] = useState<Dict<boolean>>({});
  const canEdit = !!children || !useData().readonly[0];
  const subjects = get[1] ? get[1](get[0][0]!) : get[0][0] as Subjects;
  return Object.keys(subjects).length
    ? <div className='list'>
      {flattenSubjects(subjects, (group, path) =>
        group.courses.length
          ? [[
            group.selected,
            group.courses.map((course, index) => ({ course, path, index })),
          ]] as const
          : [], (groups, type) =>
        [[
          type,
          [groups, groups.filter(x => x[0])].map(arr =>
            arr.map(x => x[1])
          ),
        ]] as const, (courses, code) => [
        <article key={code}>
          <header>
            <div>
              <h1>{subjects[code].name} ({code})</h1>
              <button className='circle' onClick={() => setOpen({ ...open, [code]: !open[code] })}>
                {open[code] ? <ChevronUp/> : <ChevronDown/>}
              </button>
            </div>
            {canEdit && buttons && <div className='actions'>{buttons(code)}</div>}
          </header>
          {children?.(code)}
          <div>
            {courses.filter(x => x[1][0].length).map(([type, [total, selected]], i, arr) =>
              <span key={type}>
                {type + ' '}
                <span
                  {...canEdit && column && (children ? !selected.length : selected.length !== 1)
                    && { style: { color: 'red' } }}
                >
                  ({selected.length}/{total.length})
                </span>
                {i < arr.length - 1 && ', '}
              </span>
            )}
          </div>
          {wrapNonEmpty(
            shown =>
              <div>
                <table>
                  {canEdit && <colgroup>
                    <col style={{ width: 0 }}/>
                  </colgroup>}
                  <thead>
                    <tr>
                      {canEdit
                        && <th>
                          {children
                            && <input
                              type='checkbox'
                              checked={!flattenSubject(
                                subjects,
                                code,
                                x => x.selected ? [] : [true],
                              ).length}
                              onChange={e =>
                                get[0][1](draft =>
                                  void flattenSubject(
                                    get[1]?.(draft as NonNullable<T>) || draft as Subjects,
                                    code,
                                    x => [x.selected = e.target.checked],
                                  )
                                )}
                            />}
                        </th>}
                      <CourseHeaders/>
                    </tr>
                  </thead>
                  <tbody>{shown}</tbody>
                </table>
              </div>,
            courses.flatMap(([, withPaths]) =>
              withPaths[+!open[code]].flat().map(data =>
                <tr key={join(...data.path, data.index)}>
                  {canEdit && <td>
                    <input
                      type='checkbox'
                      {...checkboxAsProperty(get[0], x => getGroup(get[1]?.(x) || x, data.path))(
                        'selected',
                      )()}
                    />
                  </td>}
                  <CourseRow {...data}>{canEdit && column?.(data.path, data.index)}</CourseRow>
                </tr>
              )
            ),
          )}
        </article>,
      ])}
    </div>
    : fallback;
};
