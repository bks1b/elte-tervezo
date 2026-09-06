import { selectCourses, TANREND_URL } from '../../shared/helpers.js';
import { Dict, Subjects } from '../../shared/types.js';
import cache from '../cache.js';
import { getGroupCounts, resolveAliases } from '../sheet/index.js';
import { COURSE_ID, GRADES, GROUPS } from '../utils.js';
import parse from './parser.js';

const CACHE_KEY = 'groups';

const SEARCH_MODES = [['keresnevre', 'keres_kod_azon'], ['keres_okt', 'keres_oktnk']];

const request = (path: string, body: Dict = {}, post?: true) =>
  fetch(
    TANREND_URL + path + (post ? '' : '?' + new URLSearchParams(body)),
    post && { method: 'POST', body: new URLSearchParams(body) },
  ).then(res => res.text());

const handleSearch = async (
  semester: string,
  query: string,
  mode: string,
  resolve: boolean,
  subjects: Subjects,
) => {
  for (
    const { code, aliases } of [
      ...mode === SEARCH_MODES[0][1] && resolve && (await resolveAliases())?.(query) || [],
      { aliases: [query] },
    ]
  ) {
    for (const alias of aliases) {
      for (
        const row of (await request('tanrendnavigation.php', { f: semester, m: mode, k: alias }))
          .matchAll(/<tr>(.+?)<\/tr>/g).drop(1)
      ) {
        parse(subjects, Array.from(row[1].matchAll(/<td .+?>(.+?)</g)).map(x => x[1]), code);
      }
    }
  }
  return subjects;
};

export const search = async (semester: string, query: string, teacher: boolean, resolve: boolean) =>
  SEARCH_MODES[+teacher].reduce(
    async (subjects, mode) => handleSearch(semester, query, mode, resolve, await subjects),
    Promise.resolve({} as Subjects),
  );

export const bulkSearch = async (semester: string, codes: string[], resolve = true) =>
  codes.reduce(
    async (subjects, code) =>
      handleSearch(semester, code.toLowerCase(), SEARCH_MODES[0][1], resolve, await subjects),
    Promise.resolve({} as Subjects),
  );

export const getGroups = cache(
  CACHE_KEY,
  overwrite =>
    Promise.all([request('szakostanrend'), getGroupCounts(overwrite)]).then(([page, counts]) =>
      Object.fromEntries(GRADES.map((grade, i) => [
        grade,
        GROUPS[+!!i].flatMap(group =>
          Array.from(
            page.matchAll(
              new RegExp(`<option value="(PRI08AN${group[0] + group[1]}&\\d{2,}.*?)"`, 'g'),
            ),
          ).map((
            m,
            n,
          ) => [
            (n || group[2] ? n + +!(group[0] && !group[2]) + '.' : 'Neumann')
            + (group[0] && ` (${group[0]})`),
            m[1],
          ]).slice(...i && counts ? [0, counts[group[0]][grade]] : [])
        ),
      ]))
    ),
);

export const getGroup = async (semester: string, group: string, grade: string) => {
  const codes: Dict<Set<string>> = {};
  for (
    const cell
      of (await request('szakostanrend.php', {
        felev: semester,
        szakkod: group,
        evfolyam: grade,
        submit: 'keres_szakra',
      }, true)).matchAll(/<div class="course".+?>([^<]+?) /g)
  ) {
    const match = cell[1].match(COURSE_ID);
    if (match) (codes[match[1]] ||= new Set()).add(match[2]);
  }
  return selectCourses(
    await bulkSearch(semester, Object.keys(codes), false),
    ([code, , id]) => !!codes[code]?.has(id),
  );
};
