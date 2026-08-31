import html2canvas from 'html2canvas';
import ical, { ICalEventRepeatingFreq, ICalWeekday } from 'ical-generator';
import { CalendarIcon, Camera } from 'lucide-react';

import { DAY, MINUTE, semesterWeeks, SHIFTED_DAYS, timeToMinutes, WEEK } from '../../shared/dates';
import { courseId } from '../../shared/helpers';
import { Dict } from '../../shared/types';
import { getRuns, join } from '../../shared/utils';
import Calendar, { TIMEZONE } from '../components/Calendar';
import { getNotes, joinLocations } from '../components/CourseRow';
import DisabledButton from '../components/DisabledButton';
import { useData } from '../contexts/data';
import { ModalType, useSetModal } from '../contexts/modal';
import { useRequest } from '../contexts/request';
import { download } from '../utils/browser';
import { useAsync } from '../utils/hooks';

const ICAL_DAYS = [
  ICalWeekday.SU,
  ICalWeekday.MO,
  ICalWeekday.TU,
  ICalWeekday.WE,
  ICalWeekday.TH,
  ICalWeekday.FR,
  ICalWeekday.SA,
];

export default () => {
  const { request } = useRequest();
  const { subjects, semester } = useData();
  const setModal = useSetModal();
  const semesterRanges = useAsync(() => request<Dict<string[]>>('semesters'));
  const semesterRange = () => semesterRanges![semester.value];
  return <Calendar subjects={subjects[0]}>
    {events => {
      const getCalendar = () => {
        const calendar = ical({ name: 'Órarend', timezone: TIMEZONE });
        for (const event of events) {
          const { extendedProps: { subject, course, path, index } } = event;
          for (
            const run of getRuns(
              course.weeks
                ?? Array.from({ length: semesterWeeks(semesterRange()) }, (_, i) => i + 2),
              r => [r[0], r.length],
            )
          ) {
            calendar.createEvent({
              id: join(courseId(path), index, run[0]),
              timezone: TIMEZONE,
              ...Object.fromEntries(
                (['start', 'end'] as const).map(key => [
                  key,
                  (date => new Date(+date + date.getTimezoneOffset() * MINUTE))(
                    new Date(
                      +new Date(semesterRange()[0])
                        + (run[0] - 2) * WEEK
                        + SHIFTED_DAYS.indexOf(event.daysOfWeek[0]) * DAY
                        + timeToMinutes(event[`${key}Time`]) * MINUTE,
                    ),
                  ),
                ]),
              ) as Record<'start' | 'end', Date>,
              summary: `${subject.name} (${path[1]})`,
              location: joinLocations(course),
              description: getNotes(course).join('\n'),
            }).repeating({
              freq: ICalEventRepeatingFreq.WEEKLY,
              count: run[1],
              byDay: ICAL_DAYS[event.daysOfWeek[0]],
            });
          }
        }
        return calendar;
      };
      return <>
        <button
          onClick={async () =>
            download(
              'orarend.png',
              (await html2canvas(document.querySelector('.fc-scrollgrid')!)).toDataURL('image/png'),
            )}
        >
          <Camera/>
          Mentés képként
        </button>
        <DisabledButton
          disabled={!semesterRanges}
          onClick={() =>
            setModal(
              ModalType.INFO,
              `A generált órarend a ${semester.value} félév szorgalmi időszakára vonatkozik: ${
                semesterRange().map(x => x.replaceAll('-', '.') + '.').join('-')
              }`,
              () =>
                download(
                  'orarend.ics',
                  'data:text/calendar;charset=utf-8,'
                    + encodeURIComponent(getCalendar().toString()),
                ),
            )}
        >
          <CalendarIcon/>
          Mentés naptárba (.ics)
        </DisabledButton>
      </>;
    }}
  </Calendar>;
};
