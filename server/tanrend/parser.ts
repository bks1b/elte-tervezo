import { DAYS, SEMESTER_WEEKS } from '../../shared/dates.js';
import { addCourse, capitalize, resolveName, resolveTime } from '../../shared/parsers.js';
import { Subjects } from '../../shared/types.js';
import { COURSE_ID } from '../utils.js';

enum TanrendColumn {
  SCHEDULE = 0,
  ID = 1,
  NAME = 2,
  LOCATION = 3,
  TEACHER = 5,
}

const EXCLUDED_TYPES = ['teremfoglalás', 'elfoglaltság'];

export default (target: Subjects, row: string[], alias?: string) => {
  const [fullId = '', type = ''] = row[TanrendColumn.ID].split(' ');
  const typeName = type.slice(1, -1);
  if (EXCLUDED_TYPES.includes(typeName)) return;
  const [, code = '', id = ''] = fullId.match(COURSE_ID) || [];
  const [schedule = '', weeks = ''] = row[TanrendColumn.SCHEDULE].split(' Hetek: ');
  const [day = '', time = ''] = schedule.split(' ');
  const notes: string[] = [];
  addCourse(
    target,
    [!target[code] && alias || code, capitalize(typeName), id],
    {
      locations: row[TanrendColumn.LOCATION] && row[TanrendColumn.LOCATION] !== '-'
        ? [{
          name: row[TanrendColumn.LOCATION],
          ...(m => m && { id: `L${m[1]}-${m[2]}` })(
            row[TanrendColumn.LOCATION].match(/^(.).+?\sTömb\s(\d+[-.]\d+)/),
          ),
        }]
        : [],
      teachers: (str => str ? str.split(/\s*,\s*/) : [])(
        row[TanrendColumn.TEACHER].replaceAll(
          /(?:\s*\((.+?)\)|\s-(.+))/g,
          (_, x, y) => (notes.push(x || y), ''),
        ).trim(),
      ),
      ...(str => DAYS.includes(str) && { day: str })(day.replace(/(?<=^Hétf)o$/, 'ő')),
      ...time && { time: resolveTime(time) },
      ...notes.length && { notes },
      ...weeks
        ? (arr => arr.length !== SEMESTER_WEEKS - 1 && { weeks: arr.map(x => +x) })(
          weeks.split(','),
        )
        : { partial: true },
    },
    false,
    resolveName(row[TanrendColumn.NAME]),
  );
};
