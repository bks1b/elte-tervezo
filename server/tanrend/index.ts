import { semesterWeeks } from '../../shared/dates.js';
import { TANREND_URL } from '../../shared/helpers.js';
import { Dict, Subjects } from '../../shared/types.js';
import cache from '../cache.js';
import { getSemesters } from '../semesters.js';
import { getGroupCounts } from '../sheet/index.js';
import { GRADES, GROUPS, ID_SUFFIX, normalizeQuery } from '../utils.js';
import parse from './parser.js';

const CACHE_KEY = 'groups';

const request = (path: string, body: Dict = {}, post?: true) =>
  fetch(
    TANREND_URL + path + (post ? '' : '?' + new URLSearchParams(body)),
    post && { method: 'POST', body: new URLSearchParams(body) },
  ).then(res => res.text());

export const SEARCH_MODES = [['keresnevre', 'keres_kod_azon'], ['keres_okt', 'keres_oktnk']];

export const search = (semester: string, query: string, mode: string, subjects: Subjects = {}) =>
  Promise.all([
    request('tanrendnavigation.php', {
      f: semester,
      m: mode,
      k: mode === SEARCH_MODES[0][1] ? query.replace(ID_SUFFIX, '') : query,
    }),
    getSemesters(),
  ]).then(([page, semesters]) =>
    Array.from(page.matchAll(/<tr>(.+?)<\/tr>/g)).slice(1).reduce(
      (_, row) =>
        parse(
          subjects,
          Array.from(row[1].matchAll(/<td .+?>(.+?)</g)).map(x => x[1]),
          semesterWeeks(semesters[semester]) - 1,
          ...mode === SEARCH_MODES[0][1] ? [query] : [],
        ),
      subjects,
    )
  );

export const bulkSearch = (semester: string, ids: string[]) =>
  ids.reduce(
    async (subjects, id) =>
      search(semester, normalizeQuery(id), SEARCH_MODES[0][1], await subjects),
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
          ]).slice(...i ? [0, counts[group[0]][grade]] : [])
        ),
      ]))
    ),
);

export const getGroup = (semester: string, group: string, grade: string) =>
  request('szakostanrend.php', {
    felev: semester,
    szakkod: group,
    evfolyam: grade,
    submit: 'keres_szakra',
  }, true).then(page =>
    Array.from(page.matchAll(/<div class="course".+?>([^<]+?) /g)).map(m => m[1])
  );
