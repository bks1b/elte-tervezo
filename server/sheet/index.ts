import Fuse from 'fuse.js';

import { isSpring } from '../../shared/dates.js';
import { Dict, Subjects } from '../../shared/types.js';
import { intersects } from '../../shared/utils.js';
import { GRADES, GROUPS, memoize } from '../utils.js';
import data from './data.js';

const CODE_LIMIT = 20;
const NAME_LIMIT = 20;
const RESULT_LIMIT = 30;

const mapCodes = (subjects: Subjects, arr: string[], aliases?: Dict) =>
  Object.fromEntries(arr.map(code => [code, subjects[aliases?.[code] || code]]));

export const getGroupCounts = memoize(
  data,
  ({ facultySubjects }) =>
    Object.fromEntries(
      GROUPS[1].map(([group]) => [
        group,
        Object.fromEntries(
          GRADES.slice(1).map(grade =>
            [
              grade,
              Object.values(facultySubjects).filter(({ specs }) =>
                Object.values(specs).some(({ semesters }) =>
                  intersects([2 * +grade - +!isSpring], semesters, true)
                )
              ).reduce((max, { groupCounts }) => Math.max(max, groupCounts[group] ?? 0), 0),
            ] as const
          ),
        ),
      ]),
    ),
);

export const getOptionalities = memoize(
  data,
  ({ facultySubjects, aliases }) => (codes: string[]) =>
    codes.flatMap(code =>
      aliases[code] || facultySubjects[code]
        ? [[code, Object.values(facultySubjects[aliases[code] || code].specs)[0]?.optionality]]
        : []
    ),
);

export const resolveAliases = memoize(
  data,
  ({ facultySubjects }) => (code: string) =>
    Object.values(facultySubjects).flatMap(({ aliases }) => {
      const matches = aliases.filter(alias =>
        code.length / alias.length >= 0.35 && alias.toLowerCase().includes(code)
      );
      return matches.length
        ? [{
          code: matches.reduce((min, match) => match.length < min.length ? match : min),
          aliases,
        }]
        : [];
    }).sort((a, b) => a.code.length - b.code.length),
);

export const search = memoize(data, ({ subjects, facultySubjects, aliases }) => {
  const fuses = [false, true].map(faculty =>
    Object.entries(subjects).filter(x => !faculty || facultySubjects[x[0]]).map((
      [code, { name }],
    ) => ({ code, name, aliases: facultySubjects[code] ? facultySubjects[code].aliases : [code] }))
  ).map(docs => ({
    name: new Fuse(docs, {
      keys: ['name'],
      threshold: 0.3,
      ignoreLocation: true,
      ignoreDiacritics: true,
    }),
    code: new Fuse(docs, {
      keys: ['aliases'],
      threshold: 0.3,
      ignoreLocation: true,
      includeMatches: true,
    }),
  }));
  return (query: string, faculty: boolean) =>
    mapCodes(
      subjects,
      Object.values(
        fuses[+faculty].code.search(query, { limit: CODE_LIMIT }).concat(
          fuses[+faculty].name.search(query, { limit: NAME_LIMIT }),
        ).sort((a, b) => (a.score ?? 1) - (b.score ?? 1)).slice(0, RESULT_LIMIT).reduce(
          (codes, { matches, item }) => (codes[item.code] = (matches?.find(m =>
            m.value?.toLowerCase().includes(query)
          ) || matches?.[0])?.value || codes[item.code] || item.code,
            codes),
          {} as Dict,
        ),
      ),
      aliases,
    );
});

export const bulkSearch = memoize(
  data,
  ({ subjects, aliases }) => (codes: string[]) => mapCodes(subjects, codes, aliases),
);

export const filter = memoize(
  data,
  ({ subjects, facultySubjects }) => (spec: string, type: string, ...range: [number, number]) =>
    mapCodes(
      subjects,
      Object.keys(facultySubjects).filter(code =>
        facultySubjects[code].specs[spec]?.optionality === type
        && intersects(range, facultySubjects[code].specs[spec].semesters, true)
      ),
    ),
);
