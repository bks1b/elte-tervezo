import huLocale from '@fullcalendar/core/locales/hu';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Calendar } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useImmer } from 'use-immer';

import { DAYS, SHIFTED_DAYS, timeToMinutes } from '../../shared/dates';
import { flattenSubjects, hasSchedule } from '../../shared/helpers';
import { CoursePath, CourseWithSchedule, Dict, Subject, Subjects } from '../../shared/types';
import ColorsModal, { className } from './ColorsModal';
import CourseRow, { CourseHeaders, joinLocations } from './CourseRow';
import DaysModal from './DaysModal';
import Modal from './Modal';

export const TIMEZONE = 'Europe/Budapest';

const SLOT_DURATION = '00:30:00';

type ExtendedProps = {
  extendedProps: { subject: Subject; index: number; course: CourseWithSchedule; path: CoursePath };
};

export default (
  { subjects, skipped, children }: {
    subjects: Subjects;
    skipped?: Dict<boolean>;
    children?: (
      x: (ExtendedProps & { startTime: string; endTime: string; daysOfWeek: number[] })[],
    ) => ReactNode;
  },
) => {
  const shownDays = useImmer<Record<number, boolean>>({});
  const eventModal = useState<ExtendedProps>();
  const daysModal = useState<true>();
  const [events, [slotMinTime, slotMaxTime], emptyDays] = useMemo(() => {
    const arr = flattenSubjects(
      subjects,
      (group, path) =>
        group.selected
          ? group.courses.filter(hasSchedule).map((course, index) => ({
            daysOfWeek: [DAYS.indexOf(course.day)],
            startTime: course.time[0],
            endTime: course.time[1],
            extendedProps: { subject: subjects[path[0]], course, path, index },
          }))
          : [],
    );
    return [
      arr,
      arr.length
        ? (['startTime', 'endTime'] as const).map((key, i) =>
          arr.reduce((m, x) =>
            timeToMinutes(x[key]) * (2 * i - 1) < timeToMinutes(m[key]) * (2 * i - 1) ? m : x
          )[key]
        )
        : [0, 0],
      DAYS.flatMap((day, i) => arr.some(x => x.extendedProps.course.day === day) ? [] : [i]),
    ];
  }, [subjects]);
  return <section className='surface'>
    <Modal
      state={eventModal}
      title={({ extendedProps: { subject, path } }) => `${subject.name} (${path[1]})`}
    >
      {({ extendedProps }) =>
        <table>
          <thead>
            <tr>
              <CourseHeaders/>
            </tr>
          </thead>
          <tbody>
            <tr>
              <CourseRow {...extendedProps}/>
            </tr>
          </tbody>
        </table>}
    </Modal>
    <DaysModal
      state={daysModal}
      get={() => [shownDays]}
      title='Üres napok'
      days={SHIFTED_DAYS.filter(i => emptyDays.includes(i))}
    />
    <h2>Órarend</h2>
    {events.length
      ? <>
        <div className='actions'>
          <div className='toolbar'>
            <ColorsModal/>
            {!!emptyDays.length && <button onClick={() => daysModal[1](true)}>
              <Calendar/>
              Üres napok megjelenítése
            </button>}
          </div>
          {children && <div className='toolbar'>{children(events)}</div>}
        </div>
        <FullCalendar
          plugins={[timeGridPlugin, momentTimezonePlugin]}
          initialView='timeGridWeek'
          hiddenDays={emptyDays.filter(i => !shownDays[0][i])}
          stickyHeaderDates={false}
          events={events}
          headerToolbar={false}
          allDaySlot={false}
          {...{ slotMinTime, slotMaxTime }}
          locale={huLocale}
          timeZone={TIMEZONE}
          dayHeaderFormat={{ weekday: 'long' }}
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit' }}
          height='auto'
          slotDuration={SLOT_DURATION}
          eventClick={({ event }) => eventModal[1](event as unknown as ExtendedProps)}
          eventContent={(
            { event: { extendedProps: { subject, course, path } } }: { event: ExtendedProps },
          ) =>
            <div
              className={className(path[1]) + (skipped?.[JSON.stringify(path)] ? ' skipped' : '')}
            >
              <div>{skipped ? `[#${path[2]}] ` : ''}{subject.name} ({path[1]})</div>
              <div>{joinLocations(course, true)} ({course.time.join('-')})</div>
            </div>}
        />
      </>
      : 'Keress vagy adj hozzá tárgyakat, és válassz ki kurzusokat az órarend megjelenítéséhez.'}
  </section>;
};
