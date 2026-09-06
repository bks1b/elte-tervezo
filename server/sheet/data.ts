import { read, utils } from 'xlsx';

import { FACULTY_NAME, SHEET_URL } from '../../shared/helpers.js';
import parseSheet from '../../shared/parseSheet.js';
import { Dict, Subjects } from '../../shared/types.js';
import { increment, mapEntries } from '../../shared/utils.js';
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
      {
        aliases: Set<string>;
        specs: Dict<{ optionality: string; semesters: number[] }>;
        groupCounts: Dict<number>;
      }
    >,
    aliases: {} as Dict,
    courseTypes: {} as Dict<number>,
    filterOptions: { specs: {} as Dict<number>, optionalities: new Set<string>(), maxSemester: 0 },
  };
  let defaultCode: string | undefined;
  let facultySubject: typeof result.facultySubjects[string] | undefined;
  for (
    const row of utils.sheet_to_json(
      Object.values(read(await (await fetch(SHEET_URL + filename)).arrayBuffer()).Sheets)[0],
      { range: 2, header: 1, raw: true },
    ) as string[][]
  ) {
    if (row[SheetColumn.FACULTY]) {
      defaultCode = row[SheetColumn.DEFAULT_CODE];
      if (result.aliases[defaultCode]) {
        result.facultySubjects[result.aliases[defaultCode]].aliases.delete(defaultCode);
        delete result.aliases[defaultCode];
      }
      parseSheet(
        result.subjects,
        [defaultCode, row[SheetColumn.TYPE], row[SheetColumn.ID]],
        row[SheetColumn.NAME] ?? '',
        row[SheetColumn.TEACHER]?.split(/\s*,\s*/) || [],
        row[SheetColumn.NOTE] ?? '',
      );
      increment(result.courseTypes, row[SheetColumn.TYPE]);
      if (row[SheetColumn.FACULTY] !== FACULTY_NAME) {
        facultySubject = undefined;
        continue;
      }
      facultySubject = result.facultySubjects[defaultCode] ||= {
        aliases: new Set([defaultCode]),
        specs: {},
        groupCounts: {},
      };
      GROUP_PATTERNS.map((str, j) =>
        row[SheetColumn.NOTE]?.match(
          new RegExp(`(?:^|\\s)${str}\\s(?:.*?\\s)?${GROUP_PATTERNS[1 - j]}(?:;|\\s|$)`, 'i'),
        )
      ).forEach(match => match && increment(facultySubject!.groupCounts, match[1]));
    }
    if (!facultySubject) continue;
    const code = row[SheetColumn.CODE];
    if (code && !result.subjects[code]) {
      facultySubject.aliases.add(code);
      result.aliases[code] = defaultCode!;
    }
    const spec = row[SheetColumn.SPEC];
    const optionality = row[SheetColumn.OPTIONALITY];
    if (!spec || !optionality || facultySubject.specs[spec]) continue;
    const semesters =
      (row[SheetColumn.SEMESTERS] ?? '').match(/^(\d+)(?:-(\d+))?$/)?.flatMap((x, i) =>
        x && i ? [+x] : []
      ) || [0];
    facultySubject.specs[spec] = { optionality, semesters };
    increment(result.filterOptions.specs, spec);
    result.filterOptions.optionalities.add(optionality);
    result.filterOptions.maxSemester = Math.max(
      result.filterOptions.maxSemester,
      semesters[1] ?? semesters[0],
    );
  }
  return {
    ...result,
    facultySubjects: mapEntries(
      result.facultySubjects,
      x => [[x[0], { ...x[1], aliases: Array.from(x[1].aliases) }]],
    ),
    courseTypes: sortMap(result.courseTypes),
    filterOptions: {
      ...result.filterOptions,
      specs: sortMap(result.filterOptions.specs),
      optionalities: Array.from(result.filterOptions.optionalities),
    },
  };
});
