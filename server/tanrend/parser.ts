import { DAYS, SEMESTER_WEEKS } from '../../shared/dates.js';
import { addCourse, capitalize, resolveName, resolveTime } from '../../shared/parsers.js';
import { Subjects } from '../../shared/types.js';

enum TanrendColumn {
  SCHEDULE = 0,
  ID = 1,
  NAME = 2,
  LOCATION = 3,
  TEACHER = 5,
}

const EXCLUDED_TYPES = ['teremfoglalás', 'elfoglaltság'];

export default (target: Subjects, row: string[], query?: string) => {
  const [fullId = '', type = ''] = row[TanrendColumn.ID].split(' ');
  const typeName = type.slice(1, -1);
  if (EXCLUDED_TYPES.includes(typeName)) return target;
  const [, code = '', id = ''] = fullId.match(/^(.+)-(.+)$/) || [];
  const [schedule = '', weeks = ''] = row[TanrendColumn.SCHEDULE].split(' Hetek: ');
  const [day = '', time = ''] = schedule.split(' ');
  const fixedDay = day.replace(/(?<=^Hétf)o$/, 'ő');
  const notes: string[] = [];
  const teachers = row[TanrendColumn.TEACHER].replaceAll(
    /(?:\s*\((.+?)\)|\s-(.+))/g,
    (_, x, y) => (notes.push(x || y), ''),
  ).trim();
  const lagymanyos = row[TanrendColumn.LOCATION].match(/^(.).+?\sTömb\s(\d+[-.]\d+)/);
  return addCourse(
    target,
    [code, capitalize(typeName), id],
    {
      locations: row[TanrendColumn.LOCATION] && row[TanrendColumn.LOCATION] !== '-'
        ? [{
          name: row[TanrendColumn.LOCATION],
          ...lagymanyos && { id: `L${lagymanyos[1]}-${lagymanyos[2]}` },
        }]
        : [],
      teachers: teachers ? teachers.split(/\s*,\s*/) : [],
      ...DAYS.includes(fixedDay) && { day: fixedDay },
      ...time && { time: resolveTime(time) },
      ...notes.length && { notes },
      ...weeks
        ? (arr => arr.length !== SEMESTER_WEEKS - 1 && { weeks: arr.map(x => +x) })(
          weeks.split(','),
        )
        : { partial: true },
    },
    !!query && query === fullId.toLowerCase(),
    resolveName(row[TanrendColumn.NAME]),
  );
};
