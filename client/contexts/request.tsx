import { createContext, ReactNode, useState } from 'react';

import { flattenSubjects } from '../../shared/helpers';
import { Dict, Subjects } from '../../shared/types';
import { join } from '../../shared/utils';
import Modal from '../components/Modal';
import { makeUse, useAsync } from '../utils/hooks';
import { semesterNames, useData } from './data';
import { ModalType, useSetModal } from './modal';

const REQUEST_TIMEOUT = 750;

type RequestHandler = <T>(path: string, body?: Dict, quiet?: boolean) => Promise<T>;

const RequestContext = createContext<
  {
    request: RequestHandler;
    bulkSearch: (path: string, subjects: Subjects) => Promise<Subjects>;
    courseTypes?: string[];
  } | undefined
>(undefined);

export const useRequest = makeUse(RequestContext);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const { semester } = useData();
  const setModal = useSetModal();
  const pending = useState<number>();
  const retries = useState<
    { fn: () => Promise<unknown>; resolve: (x: unknown) => void; reject: () => void }[]
  >();
  const request: RequestHandler = async (path, body, quiet = !body) => {
    if (!quiet && path.startsWith('sheet/') && semester.value !== semesterNames[0]) {
      throw setModal(
        ModalType.ERROR,
        `A kurzuslista csak a ${semesterNames[0]} félévhez elérhető.`,
      );
    }
    let exceeded = false;
    const timeout = !quiet
      && setTimeout(() => pending[1](x => (x ?? 0) + +(exceeded = true)), REQUEST_TIMEOUT);
    try {
      const res = await fetch('/api/' + path + (body ? '?' + new URLSearchParams(body) : ''));
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (error) {
      console.error(error);
      return new Promise<unknown>((resolve, reject) =>
        retries[1](arr => [...arr || [], { fn: () => request(path, body, quiet), resolve, reject }])
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
        pending[1](x => x && x - +exceeded || undefined);
      }
    }
  };
  return <RequestContext.Provider
    value={{
      request,
      bulkSearch: (path, subjects) =>
        request(path + '/bulk-search', {
          semester: semester.value,
          id: flattenSubjects(
            subjects,
            (group, [, , id]) => group.selected ? [id] : [],
            undefined,
            (selected, code) =>
              selected.length
                ? selected.map(x => join(code, x))
                : [code],
          ) + '',
        }),
      courseTypes: useAsync(() => request<string[]>('sheet/course-types')),
    }}
  >
    <Modal state={pending} title={() => 'Betöltés'} closeHandler>
      {() => 'A kérés folyamatban van...'}
    </Modal>
    <Modal
      state={retries}
      title={() => 'Hiba'}
      handler={arr => arr.forEach(({ fn, resolve, reject }) => fn().then(resolve).catch(reject))}
      closeHandler={arr => arr.forEach(({ reject }) => reject())}
    >
      {() => 'Sikertelen kérés. Újrapróbálod?'}
    </Modal>
    {children}
  </RequestContext.Provider>;
};
