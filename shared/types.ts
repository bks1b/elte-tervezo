export type Subject<T = CourseGroup, U = { name: string }> = { courseGroups: Dict<Dict<T>> } & U;

export type Subjects<T = CourseGroup, U = { name: string }> = Dict<Subject<T, U>>;

export type CoursePath = [string, string, string];

export type CourseGroup = { selected: boolean; courses: Course[] };

export type Course = {
  locations: { name: string; id?: string }[];
  teachers: string[];
  day?: string;
  time?: string[];
  notes?: string[];
  partial?: true;
  weeks?: number[];
};

export type CourseWithSchedule = Course & { [K in 'day' | 'time']: NonNullable<Course[K]> };

export type Dict<T = string> = Record<string, T>;
