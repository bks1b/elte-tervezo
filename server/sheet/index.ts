import Fuse from 'fuse.js';
import { produce } from 'immer';

import { isSpring } from '../../shared/dates.js';
import { courseId, flattenSubjects, mergeData } from '../../shared/helpers.js';
import { Subjects } from '../../shared/types.js';
import { intersects } from '../../shared/utils.js';
import { GRADES, GROUPS, ID_SUFFIX, memoize, normalizeQuery } from '../utils.js';
import data from './data.js';

const CODE_LIMIT = 20;
const NAME_LIMIT = 20;
const RESULT_LIMIT = 30;

const mapCodes = <T>(subjects: Subjects, arr: T[], code: (x: T) => string) =>
  Object.fromEntries(arr.map(x => [code(x), subjects[code(x)]]));

export const getGroupCounts = memoize(
  data,
  ({ facultySubjects }) =>
    Object.fromEntries(
      GROUPS[1].map(([spec]) => [
        spec,
        Object.fromEntries(
          GRADES.slice(1).map(grade =>
            [
              grade,
              Object.entries(facultySubjects).filter(x =>
                intersects([2 * +grade - +!isSpring], x[1].semesters, true)
              ).reduce((a, b) => Math.max(a, b[1].courseSpecs[spec] ?? 0), 0),
            ] as const
          ),
        ),
      ]),
    ),
);

export const getOptionalities = memoize(
  data,
  ({ facultySubjects }) => (ids: string[]) =>
    ids.flatMap(id => id in facultySubjects ? [[id, facultySubjects[id].optionality]] : []),
);
export const getSearchHandler = memoize(data, ({ subjects, facultySubjects, facultyPrefixes }) => {
  const arr = Object.entries(subjects).map(x => ({ code: x[0], name: x[1].name }));
  const fuses = [arr, arr.filter(x => x.code in facultySubjects)].map(docs => ({
    name: new Fuse(docs, {
      keys: ['name'],
      threshold: 0.4,
      ignoreLocation: true,
      ignoreDiacritics: true,
    }),
    code: new Fuse(docs, { keys: ['code'], threshold: 0.4, ignoreLocation: true }),
  }));
  const search = (query: string, faculty: number, exactId = false) =>
    produce(
      mapCodes(
        subjects,
        fuses[faculty].code.search(
          facultyPrefixes.some(x => query.startsWith(x))
            ? query.replace(ID_SUFFIX, '')
            : query,
          { limit: CODE_LIMIT },
        ).concat(exactId ? [] : fuses[faculty].name.search(query, { limit: NAME_LIMIT })).sort((
          a,
          b,
        ) => (a.score ?? 1) - (b.score ?? 1)).slice(0, RESULT_LIMIT),
        x => x.item.code,
      ),
      result =>
        void flattenSubjects(
          result as Subjects,
          (group, path) => (group.selected = query === courseId(path).toLowerCase()) ? [true] : [],
          undefined,
          (selected, code) => {
            if (exactId && !selected.length) delete result[code];
            return [];
          },
        ),
    );
  return {
    search,
    bulkSearch: (ids: string[]) =>
      ids.map(id => search(normalizeQuery(id), 0, true)).reduce(
        (x, result) => produce(x, draft => mergeData(draft, result)),
        {},
      ),
  };
});

export const filter = memoize(
  data,
  ({ subjects, facultySubjects }) => (spec: string, type: string, ...range: [number, number]) =>
    mapCodes(
      subjects,
      Object.entries(facultySubjects).filter(x =>
        x[1].spec === spec && x[1].optionality === type && intersects(range, x[1].semesters, true)
      ),
      x => x[0],
    ),
);
