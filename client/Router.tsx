import { ReactNode, useEffect, useState } from 'react';

import { useData } from './contexts/data';
import { ModalType, useSetModal } from './contexts/modal';
import { gunzip, loadStorage, StorageKey } from './utils/browser';

const getPath = () => ({ value: location.pathname.slice(1) });

export default (
  { children }: { children: (path: string, navigate: (x: string) => void) => ReactNode },
) => {
  const { subjects, readonly } = useData();
  const setModal = useSetModal();
  const [path, setPath] = useState(getPath);
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const popState = () => setPath(getPath);
    const hashChange = () => setHash(location.hash);
    window.addEventListener('popstate', popState);
    window.addEventListener('hashchange', hashChange);
    return () => {
      window.removeEventListener('popstate', popState);
      window.removeEventListener('hashchange', hashChange);
    };
  }, []);
  useEffect(() => {
    let active = true;
    (location.hash
      ? gunzip(location.hash.slice(1)).then(JSON.parse).then(res => {
        if (!active) return;
        readonly[1](true);
        subjects[1](res);
      })
      : Promise.reject()).catch(err => {
        if (!active) return;
        if (err) {
          location.hash = '';
          setModal(ModalType.ERROR, 'A megosztott URL hibás formátumú volt.');
        }
        readonly[1](false);
        subjects[1](loadStorage(StorageKey.SUBJECTS) ?? {});
      });
    return () => void (active = false);
  }, [hash, path]);
  return children(path.value, value => {
    history.pushState(undefined, '', '/' + value + location.hash);
    subjects[1](undefined!);
    setPath({ value });
  });
};
