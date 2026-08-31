import { Context, useContext, useEffect, useRef, useState } from 'react';

import { LoadingSelect, options } from './helpers';

export const makeUse = <T,>(x: Context<T>) => () => useContext(x)!;

export const useAsync = <T,>(f: () => Promise<T>, handler?: (x: T) => unknown) => {
  const [result, setResult] = useState<T>();
  useEffect(() => {
    let active = true;
    f().then(res => {
      if (!active) return;
      setResult(res);
      handler?.(res);
    }).catch(console.error);
    return () => void (active = false);
  }, []);
  return result;
};

export const useInputRef = () => useRef<HTMLInputElement>(null);

export const useSelect = <T extends string[] | undefined>(names: T, label?: string, values?: T) => {
  const ref = useRef<HTMLSelectElement>(null);
  const element = names ? <select ref={ref}>{options(names, values)}</select> : <LoadingSelect/>;
  return {
    get value() {
      return ref.current?.value as string | (undefined extends T ? undefined : never);
    },
    select: label ? <label>{label}: {element}</label> : element,
  };
};
