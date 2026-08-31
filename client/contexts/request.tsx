import { createContext, ReactNode, useState } from 'react';

import { flattenSubjects } from '../../shared/helpers';
import { Dict, Subjects } from '../../shared/types';
import { join } from '../../shared/utils';
import Modal from '../components/Modal';
import { makeUse, useAsync } from '../utils/hooks';
import { semesterNames, useData } from './data';
import { ModalType, useSetModal } from './modal';

const REQUEST_TIMEOUT = 750;

type RequestHandler = <T>(path: string, body?: Dict, silent?: boolean) => Promise<T>;

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
      return new Promise<unknown>((res, rej) =>
        setModal(
          ModalType.ERROR,
          'Sikertelen kérés. Újrapróbálod?',
          () => request(path, body, quiet).then(res).catch(rej),
          rej,
        )
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
        pending[1](x => x! - +exceeded || undefined);
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
    <Modal state={pending} title={() => 'Betöltés'} closeHandler={() => pending[1](x => x! - 1)}>
      {x => `${x > 1 ? x : 'A'} kérés folyamatban van...`}
    </Modal>
    {children}
  </RequestContext.Provider>;
};
