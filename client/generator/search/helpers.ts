import { Subjects } from '../../../shared/types';

export const MAX_PENALTY = 20;

export type Penalty = { penalty: number };

export type DayConstraints =
  (Penalty & {
    days: (boolean | undefined)[];
    interval?: string[];
    break?: number;
    gap?: number;
  })[];

export type SubjectConstraints = Subjects<
  Partial<Penalty & { collisionOnly: boolean }>,
  Penalty & { optionality: number }
>;

export type PartialDict<K extends string> = Partial<Record<K, number>>;

export enum ViolationType {
  BREAK = 'szünetek',
  GAP = 'lyukasórák',
  INTERVAL = 'napi idősávok',
  COURSE_SKIP = 'kihagyott előadások',
  SUBJECT_SKIP = 'kihagyott tárgyak',
}

export enum PruneType {
  BREAK = 'szünetek',
  GAP = 'lyukasórák',
  MAX = 'túl sok eredmény',
  COLLISION = 'ütközések',
  DUPLICATE = 'duplikált megoldások',
}

export const isMandatory = (x: number) => x > MAX_PENALTY;

export const stringify = (arr: unknown[]) => arr.map(x => JSON.stringify(x));

export const throwNonEmpty = (msg: string, cause: string[]) => {
  if (cause.length) throw new Error(msg, { cause });
};
