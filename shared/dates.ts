export const DAYS = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
export const SHIFTED_DAYS = DAYS.map((_, i) => (i + 1) % DAYS.length);
export const DAY_VOWELS = ['ó', 'ő', 'ő', 'ó', 'ő', 'ő', 'ó'];

export const MINUTE = 1000 * 60;
export const DAY = MINUTE * 60 * 24;
export const WEEK = DAY * DAYS.length;

export const isSpring = new Date().getMonth() < 6;

export const timeToMinutes = (t: string) => t.split(':').map(x => +x).reduce((h, m) => 60 * h + m);

export const minutesToTime = (s: number) =>
  [Math.floor(s / 60), s % 60].map(x => (x + '').padStart(2, '0')).join(':');

export const semesterWeeks = (range: string[]) =>
  Math.round((+new Date(range[1]) - +new Date(range[0])) / WEEK);
