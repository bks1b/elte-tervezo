import { getGroup } from '../../../shared/helpers';
import { CoursePath, Dict } from '../../../shared/types';
import { intersects, sum } from '../../../shared/utils';
import {
  isMandatory,
  PartialDict,
  PruneType,
  stringify,
  SubjectConstraints,
  throwNonEmpty,
  ViolationType,
} from './helpers';
import { SearchHandler } from './SearchHandler';

const product = <T>(sets: T[][]) =>
  sets.reduce((result, set) => result.flatMap(arr => set.map(x => arr.concat([x]))), [[]] as T[][]);

export class SearchState {
  constructor(private handler: SearchHandler, private subjectConstraints: SubjectConstraints) {
    throwNonEmpty(
      'Hiányzik egyes tárgyak kötelezősége',
      Object.keys(subjectConstraints).filter(code => !subjectConstraints[code].optionality),
    );
  }

  selected: Dict<boolean> = {};
  skipped: Dict<boolean> = {};

  penalty = 0;
  violations: PartialDict<ViolationType> = {};
  private intervalViolations = new Set<string>();

  didCollide = new Set<string>();
  private mustCollide = new Set<string>();
  private schedules: ({ path: CoursePath; time: number[] }[] | undefined)[] = [];

  private withPath(target: Dict<boolean>, path: CoursePath, f: (x: CoursePath) => unknown) {
    const key = JSON.stringify(path);
    const prev = target[key];
    target[key] = true;
    f(path);
    target[key] = prev;
  }
  private withPenalty(key: ViolationType, value: number, f: () => unknown) {
    this.violations[key] ||= 0;
    this.violations[key] += value;
    this.penalty += value;
    f();
    this.penalty -= value;
    this.violations[key] -= value;
  }
  private withUnion(target: Set<string>, arr: string[], f: (x: string[]) => unknown) {
    const added = arr.filter(x => !target.has(x) && target.add(x));
    f(added);
    added.forEach(target.delete.bind(target));
  }

  private pointer = { subject: 0, index: 0 };

  private verifyConstraint<K extends 'gapConstraints' | 'breakConstraints'>(
    schedules: (number[][] | undefined)[],
    key: K,
    type: `${PruneType}` & `${ViolationType}`,
    f: (x: SearchHandler[K][number], schedule: number[][]) => boolean,
    cont: () => unknown,
  ) {
    const penalties = this.handler[key].map(constraint => ({
      penalty: constraint.penalty,
      count: constraint.days.filter((bool, day) =>
        bool && schedules[day]?.length && f(constraint, schedules[day])
      ).length,
    }));
    if (penalties.every(x => !x.count || !isMandatory(x.penalty)))
      this.withPenalty(type as ViolationType, sum(penalties, x => x.count * x.penalty), cont);
    else this.handler.prune(type as PruneType);
  }
  private verify() {
    if (this.mustCollide.symmetricDifference(this.didCollide).size)
      return this.handler.prune(PruneType.COLLISION);
    const schedules = this.schedules.map(arr =>
      arr?.flatMap(({ time, path }) => this.skipped[JSON.stringify(path)] ? [] : [time]).toSorted((
        a,
        b,
      ) => a[0] - b[0])
    );
    this.verifyConstraint(
      schedules,
      'gapConstraints',
      ViolationType.GAP,
      (constraint, schedule) =>
        schedule.some((time, i) => i && time[0] - schedule[i - 1][1] > constraint.gap),
      () =>
        this.verifyConstraint(
          schedules,
          'breakConstraints',
          ViolationType.BREAK,
          ({ interval, break: length }, schedule) =>
            [[interval[0], interval[0]], ...schedule.filter(time => intersects(time, interval)), [
              interval[1],
              interval[1],
            ]].every((time, i, arr) => i && time[0] - arr[i - 1][1] < length),
          () =>
            this.handler.insert({
              ...JSON.parse(
                JSON.stringify({
                  selected: this.selected,
                  skipped: this.skipped,
                  violations: this.violations,
                  penalty: this.penalty,
                }),
              ),
              didCollide: new Set(this.didCollide),
            }),
        ),
    );
  }
  private handleCollisions(path: CoursePath, schedules: { day: number; time: number[] }[]) {
    const collisionSkips = schedules.flatMap(schedule =>
      this.schedules[schedule.day]?.filter(prev => intersects(prev.time, schedule.time)).map(prev =>
        [prev, { path }].filter(item => getGroup(this.subjectConstraints, item.path).penalty).map(
          item => ({ ...item, optionality: this.subjectConstraints[item.path[0]].optionality })
        ).flatMap((item, _, arr) =>
          item.optionality === Math.min(...arr.map(y => y.optionality)) ? [item.path] : []
        )
      ) || []
    );
    if (collisionSkips.some(x => !x.length))
      return this.handler.prune(PruneType.COLLISION);
    schedules.forEach(({ day, time }) => (this.schedules[day] ||= []).push({ path, time }));
    product(collisionSkips).forEach(choice =>
      this.withUnion(this.didCollide, stringify(choice), () => this.next())
    );
    schedules.forEach(({ day }) => this.schedules[day]?.pop());
  }
  next(skip = false) {
    const { subject, index } = this.pointer;
    if (skip) {
      this.pointer.subject++;
      this.pointer.index = 0;
    } else { this.pointer.index++; }
    this.search();
    this.pointer.subject = subject;
    this.pointer.index = index;
  }
  search() {
    if (this.penalty >= this.handler.upperBound) return this.handler.prune(PruneType.MAX);
    if (this.pointer.subject === this.handler.sets.length) return this.verify();
    if (this.pointer.index === this.handler.sets[this.pointer.subject][1].length)
      return this.next(true);
    const [code, sets] = this.handler.sets[this.pointer.subject];
    if (!this.pointer.index && !isMandatory(this.subjectConstraints[code].penalty)) {
      this.withPenalty(
        ViolationType.SUBJECT_SKIP,
        this.subjectConstraints[code].penalty,
        () => this.next(true),
      );
    }
    const [type, groups] = sets[this.pointer.index];
    groups.forEach(([id, group]) =>
      this.withPath(this.selected, [code, type, id], path => {
        const groupConstraint = getGroup(this.subjectConstraints, path);
        const handleCollisions = () => this.handleCollisions(path, group.schedules);
        this.withUnion(this.intervalViolations, group.violations, added =>
          this.withPenalty(
            ViolationType.INTERVAL,
            sum(added, x => JSON.parse(x).penalty),
            handleCollisions,
          ));
        if (groupConstraint.penalty && !isMandatory(groupConstraint.penalty)) {
          this.withPath(this.skipped, path, () =>
            this.withPenalty(ViolationType.COURSE_SKIP, groupConstraint.penalty!, () =>
              groupConstraint.collisionOnly
                ? this.withUnion(this.mustCollide, stringify([path]), handleCollisions)
                : this.next()));
        }
      })
    );
  }
}
