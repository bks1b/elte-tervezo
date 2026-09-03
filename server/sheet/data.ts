import { read, utils } from 'xlsx';

import { FACULTY_NAME, SHEET_URL } from '../../shared/helpers.js';
import parseSheet from '../../shared/parseSheet.js';
import { Dict, Subjects } from '../../shared/types.js';
import { increment } from '../../shared/utils.js';
import cache from '../cache.js';
import { GROUPS } from '../utils.js';

const CACHE_KEY = 'sheet';

const GROUP_PATTERNS = [`([${GROUPS[1].map(x => x[0]).join('')}])`, '(?:fix|Neumann)'];

enum SheetColumn {
  FACULTY = 2,
  DEFAULT_CODE = 4,
  ID = 5,
  TEACHER = 6,
  TYPE = 8,
  NOTE = 12,
  CODE = 14,
  NAME = 16,
  SPEC = 21,
  OPTIONALITY = 23,
  SEMESTERS = 24,
}

const sortMap = (map: Dict<number>) =>
  Object.entries(map).sort((a, b) => b[1] - a[1]).map(x => x[0]);

export default cache(CACHE_KEY, async () => {
  const filename = (await (await fetch(SHEET_URL)).text()).match(/".+?(\/.+?\.xlsx)"/)?.[1];
  if (!filename) return;
  const result = {
    subjects: {} as Subjects,
    facultySubjects: {} as Record<
      string,
      { spec: string; optionality: string; semesters: number[]; courseSpecs: Dict<number> }
    >,
    courseTypes: {} as Dict<number>,
    facultyPrefixes: new Set<string>(),
    filterOptions: { specs: {} as Dict<number>, optionalities: new Set<string>(), maxSemester: 0 },
  };
  for (
    const row of utils.sheet_to_json(
      Object.values(read(await (await fetch(SHEET_URL + filename)).arrayBuffer()).Sheets)[0],
      { range: 2, header: 1, raw: true },
    ) as string[][]
  ) {
    const code = row[SheetColumn.CODE] || row[SheetColumn.DEFAULT_CODE];
    const type = row[SheetColumn.TYPE];
    const id = row[SheetColumn.ID];
    if (!code || !type || !id) continue;
    const note = row[SheetColumn.NOTE] ?? '';
    parseSheet(
      result.subjects,
      [code, type, id],
      row[SheetColumn.NAME] ?? '',
      row[SheetColumn.TEACHER]?.split(/\s*,\s*/) || [],
      note,
    );
    increment(result.courseTypes, type);
    const spec = row[SheetColumn.SPEC];
    const optionality = row[SheetColumn.OPTIONALITY];
    if (!spec || !optionality || row[SheetColumn.FACULTY] !== FACULTY_NAME) continue;
    const semesters = (match => match ? [+match[1], +(match[2] ?? match[1])] : [0, 0])(
      (row[SheetColumn.SEMESTERS] ?? '').match(/^(\d+)(?:-(\d+))?$/),
    );
    result.facultySubjects[code] ||= { spec, optionality, semesters, courseSpecs: {} };
    const prefix = code.toLowerCase().match(/^[a-z]+/)?.[0];
    if (prefix) result.facultyPrefixes.add(prefix);
    increment(result.filterOptions.specs, spec);
    result.filterOptions.optionalities.add(optionality);
    result.filterOptions.maxSemester = Math.max(result.filterOptions.maxSemester, semesters[1]);
    const courseSpec = [0, 1].reduce(
      (m, i) =>
        m
          ?? note.match(
            new RegExp(
              `(?:^|\\s)${GROUP_PATTERNS[i]}(?:\\s|\\s.*?\\s)${GROUP_PATTERNS[1 - i]}(?:\\s|$)`,
            ),
          )?.[1],
      undefined as string | undefined,
    );
    if (courseSpec)
      increment(result.facultySubjects[code].courseSpecs, courseSpec);
  }
  return {
    subjects: result.subjects,
    facultySubjects: result.facultySubjects,
    courseTypes: sortMap(result.courseTypes),
    facultyPrefixes: Array.from(result.facultyPrefixes),
    filterOptions: {
      ...result.filterOptions,
      specs: sortMap(result.filterOptions.specs),
      optionalities: Array.from(result.filterOptions.optionalities),
    },
  };
});
