import { createContext, ReactNode } from 'react';
import { ImmerHook, useImmer } from 'use-immer';

import { isSpring } from '../../shared/dates';
import { Subjects } from '../../shared/types';
import { join } from '../../shared/utils';
import { makeUse, useSelect } from '../utils/hooks';

const SEMESTER_COUNT = 4;

export const semesterNames = Array.from({ length: SEMESTER_COUNT }, (_, i) => i + +isSpring).map(
  i => join(...[0, 1].map(j => new Date().getFullYear() - Math.ceil(i / 2) + j), (i % 2) + 1)
);

const DataContext = createContext<
  {
    semester: { value: string; select: ReactNode };
    subjects: ImmerHook<Subjects>;
    readonly: ImmerHook<boolean>;
  } | undefined
>(undefined);

export const useData = makeUse(DataContext);

export const DataProvider = ({ children }: { children: (loaded: boolean) => ReactNode }) => {
  const subjects = useImmer<Subjects>(undefined!);
  return <DataContext.Provider
    value={{ semester: useSelect(semesterNames, 'Félév'), subjects, readonly: useImmer(true) }}
  >
    {children(!!subjects[0])}
  </DataContext.Provider>;
};
