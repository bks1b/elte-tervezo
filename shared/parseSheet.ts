import { DAYS } from './dates.js';
import { addCourse, resolveName, resolveTime } from './parsers.js';
import { CoursePath, Subjects } from './types.js';

const SHORT_DAYS = ['V', 'H', 'K', 'SZE', 'CS', 'P', 'SZO'];
const SCHEDULE_REGEX = new RegExp(`^((?:${SHORT_DAYS.join('|')}):.+?)(?:\\((.+)|$)`);

export default (
  target: Subjects,
  path: CoursePath,
  name: string,
  teachers: string[],
  scheduleString: string,
  selected = false,
) => {
  const [notes, scheduleNotes] = Array.from(
    new Set(scheduleString && scheduleString.split(/\s*;\s*/)),
  ).reduce((r, x) => (r[+SCHEDULE_REGEX.test(x)].push(x), r), [[], []] as string[][]);
  return (scheduleNotes.length ? scheduleNotes : ['']).reduce((_, note) => {
    const [, scheduleData = '', location = ''] = note.match(SCHEDULE_REGEX) || [];
    const [, day = '', time = ''] = scheduleData.match(/^(.+?):(.+)$/) || [];
    return addCourse(
      target,
      path,
      {
        locations: Array.from(location.matchAll(/(.+?)(\s\(([^(]+?)\)(,|\)$)|\.{3}$)/g)).map(m =>
          m[3] ? { name: m[1], id: m[3].match(/^L[DÉ]-\d+-\d+/)?.[0] || m[3] } : { name: m[0] }
        ),
        teachers,
        ...SHORT_DAYS.includes(day) && { day: DAYS[SHORT_DAYS.indexOf(day)] },
        ...time && { time: resolveTime(time) },
        ...notes.length && { notes },
        ...scheduleData.endsWith('...') && { partial: true },
      },
      selected,
      resolveName(name),
    );
  }, target);
};
