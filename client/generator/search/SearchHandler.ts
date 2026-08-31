import { DAYS, timeToMinutes } from '../../../shared/dates';
import { courseId, flattenSubjects, hasSchedule } from '../../../shared/helpers';
import { Subjects } from '../../../shared/types';
import { increment } from '../../../shared/utils';
import {
  DayConstraints,
  isMandatory,
  PartialDict,
  PruneType,
  stringify,
  throwNonEmpty,
} from './helpers';
import { SearchState } from './SearchState';

export class SearchHandler {
  gapConstraints;
  breakConstraints;
  sets;
  pruneCounts: PartialDict<PruneType> = {};
  removedCourses: string[] = [];
  constructor(subjects: Subjects, private solutionCount: number, constraints: DayConstraints) {
    this.gapConstraints = constraints.filter((x): x is typeof x & { gap: number } => !!x.gap);
    const withIntervals = constraints.filter(x => !x.gap).map(x => ({
      ...x,
      interval: x.interval?.map(timeToMinutes) ?? [0, 0],
    }));
    const intervalConstraints = DAYS.map((_, day) =>
      withIntervals.flatMap((constraint, index) =>
        constraint.days[day] && !constraint.break ? [{ index, ...constraint }] : []
      )
    );
    throwNonEmpty(
      'Több kötelező szabály is vonatkozik egyes napokra',
      intervalConstraints.flatMap((arr, day) =>
        arr.filter(x => isMandatory(x.penalty)).length > 1 ? [DAYS[day].toLowerCase()] : []
      ),
    );
    this.breakConstraints = withIntervals.flatMap((x, index) =>
      x.break ? [{ ...x, break: x.break, index }] : []
    );
    const partialGroups: string[] = [];
    const emptyGroups: string[] = [];
    this.sets = flattenSubjects(
      subjects,
      (group, path) => {
        if (!group.selected) return [];
        const schedules = group.courses.filter(hasSchedule).map(course => ({
          time: course.time.map(timeToMinutes),
          day: DAYS.indexOf(course.day),
        }));
        if (schedules.length !== group.courses.length) {
          partialGroups.push(courseId(path));
          return [];
        }
        const violations = schedules.flatMap(course =>
          intervalConstraints[course.day].flatMap(constraint =>
            [0, 1].flatMap(side =>
              course.time[side] * (2 * side - 1) > constraint.interval[side] * (2 * side - 1)
                ? [{ ...constraint, day: course.day, side }]
                : []
            )
          )
        );
        if (violations.every(x => !isMandatory(x.penalty)))
          return [[path[2], { violations: stringify(violations), schedules }]] as const;
        this.removedCourses.push(courseId(path));
        return [];
      },
      (arr, type, code) => {
        if (arr.length) return [[type, arr]] as const;
        if (Object.values(subjects[code].courseGroups[type]).some(x => x.selected))
          emptyGroups.push(`${code} (${type})`);
        return [];
      },
      (arr, code) =>
        arr.length ? [[code, arr.sort((a, b) => a[1].length - b[1].length)]] as const : [],
    ).sort((a, b) => a[1].length - b[1].length);
    throwNonEmpty('Egyes kiválasztott kurzusok órarendi adatai hiányosak', partialGroups);
    throwNonEmpty('Az idősávok miatt egy kurzust sem lehet kiválasztani', emptyGroups);
  }

  solutions: SearchState[] = [];
  bestSolutions = new Map<string, SearchState[]>();
  get upperBound() {
    return this.solutions[this.solutionCount - 1]?.penalty;
  }
  prune(type: PruneType) {
    increment(this.pruneCounts, type);
  }
  insert(state: SearchState) {
    const key = JSON.stringify(state.selected);
    let best = this.bestSolutions.get(key);
    if (
      best?.length
      && (best[0].penalty < state.penalty || best[0].penalty === state.penalty && best.map(x =>
            JSON.stringify({ ...x, skipped: undefined })
          ).includes(JSON.stringify({ ...state, skipped: undefined })))
    ) {
      return this.prune(PruneType.DUPLICATE);
    }
    if (!best?.length || best[0].penalty !== state.penalty) {
      best?.forEach(x => {
        this.solutions.splice(this.solutions.indexOf(x), 1);
        this.prune(PruneType.DUPLICATE);
      });
      this.bestSolutions.set(key, best = []);
    }
    best.push(state);
    const i = this.solutions.findIndex(x => x.penalty > state.penalty);
    this.solutions.splice(i < 0 ? this.solutions.length : i, 0, state);
    if (this.solutions.length > this.solutionCount) {
      const removed = this.solutions.pop()!;
      const arr = this.bestSolutions.get(JSON.stringify(removed.selected))!;
      arr.splice(arr.indexOf(removed), 1);
      this.prune(PruneType.MAX);
    }
  }
}
