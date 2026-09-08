import { addCourse } from './parsers.js';
import {
  Course,
  CourseGroup,
  CoursePath,
  CourseWithSchedule,
  Dict,
  SearchResults,
  Subject,
  Subjects,
} from './types';
import { join } from './utils.js';

export const TANREND_URL = 'https://tanrend.elte.hu/';
export const SHEET_URL = 'https://neptun.elte.hu/DownloadCourseList';
export const FACULTY_NAME = 'IK';

export const hasSchedule = (x: Course): x is CourseWithSchedule => !!(x.day && x.time);

export const courseId = (x: CoursePath) => join(x[0], x[2]);

export const getGroups = <T, U>(x: Subjects<T, U>, p: [string, string, string?]) =>
  x[p[0]]?.courseGroups[p[1]];

export const getGroup = <T, U>(x: Subjects<T, U>, p: CoursePath) => getGroups(x, p)?.[p[2]];

export const flattenSubject = <T, F, G = F>(
  subjects: Subjects<T, unknown>,
  code: string,
  f: (group: T, path: CoursePath) => F[],
  g = (x: F[], _type: string, _code: string) => x as unknown as G[],
) =>
  Object.entries(subjects[code].courseGroups).flatMap(([type, courseGroups]) =>
    g(
      Object.entries(courseGroups).flatMap(([id, course]) => f(course, [code, type, id])),
      type,
      code,
    )
  );

export const flattenSubjects = <T, F, G = F, H = G>(
  ...[subjects, f, g, h = x => x as unknown as H[]]:
    Parameters<typeof flattenSubject<T, F, G>> extends [infer X, unknown, infer Y, (infer Z)?]
      ? [X, Y, Z?, ((x: G[], _code: string) => H[])?]
      : never
) => Object.keys(subjects).flatMap(code => h(flattenSubject(subjects, code, f, g), code));

export const mapSubjects = <T, U, V>(
  subjects: Subjects,
  f: (group: CourseGroup, path: CoursePath) => T[],
  g = (courseGroups: Dict<Dict<T>>, code: string) =>
    ({ ...subjects[code], courseGroups }) as unknown as Subject<U, V>,
) =>
  Object.fromEntries(
    flattenSubjects(
      subjects,
      (group, path) => f(group, path).map(x => [path[2], x]),
      (x, type) => [[type, Object.fromEntries(x)]],
      (x, code) => [[code, g(Object.fromEntries(x), code)]],
    ),
  );

export const mergeData = (target: Subjects, source: Subjects) =>
  void flattenSubjects(
    source,
    (group, path) =>
      group.courses.map(course =>
        addCourse(target, path, course, group.selected, source[path[0]].name)
      ),
  );

export const selectCourses = (results: SearchResults, f: (path: CoursePath) => boolean) =>
  flattenSubjects(results.subjects, (group, path) => [group.selected = f(path)]) && results;
