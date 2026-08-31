import { Course, CoursePath, Subjects } from './types.js';

export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1).toLowerCase();

export const resolveName = (x: string) => x.replace(/\s(ea|gy|ea\.?\+gy)\.?\s*?(?=\s?\(|$)/i, '');

export const resolveTime = (x: string) => x.split('-').map(t => t.padStart(5, '0'));

export const addCourse = (
  target: Subjects,
  [code, type, id]: CoursePath,
  course: Course,
  selected = false,
  name = target[code].name,
) => {
  const group = ((target[code] ||= { name, courseGroups: {} }).courseGroups[type] ||= {})[id] ||= {
    selected: false,
    courses: [],
  };
  target[code].name ||= name;
  group.selected ||= selected;
  const existing = group.courses.find(x =>
    (['day', 'time'] as const).every(key =>
      !x[key] || JSON.stringify(x[key]) === JSON.stringify(course[key])
    )
  );
  if (!existing) {
    group.courses.push(course);
    return target;
  }
  const mergeProperty = <
    K extends keyof Course,
    T = NonNullable<Course[K]> extends (infer X)[] ? X : never,
  >(key: K, eq = (x: T, y: T) => x === y) =>
    (course[key] as T[] | undefined)?.forEach(x =>
      !((existing[key] ||= [] as unknown as Course[K]) as T[] | undefined)?.some(y => eq(x, y))
      && (existing[key] as T[]).push(x)
    );
  mergeProperty('locations', (x, y) => x.id && y.id ? x.id === y.id : x.name === y.name);
  mergeProperty('teachers');
  mergeProperty('notes');
  existing.day ||= course.day;
  existing.time ||= course.time;
  existing.partial ||= course.partial;
  existing.weeks ||= course.weeks;
  return target;
};
