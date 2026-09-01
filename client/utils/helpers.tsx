import { ChangeEvent, JSX, ReactNode } from 'react';
import { ImmerHook } from 'use-immer';

const makePropertyHandler =
  <Element extends HTMLElement>() =>
  <Prop extends keyof Element>(prop: Prop) =>
  <State, Last = NonNullable<State>>(
    state: ImmerHook<State>,
    get = (x: NonNullable<State>, _setting?: true) => x as Last,
  ) =>
  <K extends keyof Last>(key: K) =>
  (
    convertTo = (x: Last[K]) => x as unknown as Element[Prop],
    convertFrom = (x: Element[Prop]) => x as unknown as Last[K],
  ) => ({
    [prop]: convertTo(get(state[0]!)[key]),
    onChange: (e: ChangeEvent<Element>) =>
      state[1](draft =>
        void (get(draft as NonNullable<State>, true)[key] = convertFrom(e.target[prop]))
      ),
  });
export const valueAsProperty = makePropertyHandler<HTMLInputElement | HTMLSelectElement>()('value');
export const checkboxAsProperty = makePropertyHandler<HTMLInputElement>()('checked');

const makeJoin = (X: keyof JSX.IntrinsicElements, f = (x: ReactNode) => x) => (arr: ReactNode[]) =>
  f(arr.map((x, i) => <X key={i}>{x}</X>));
export const joinP = makeJoin('p');
export const joinUl = makeJoin('li', x => <ul>{x}</ul>);

type Truthy<T> = Exclude<T, null | undefined | false | 0 | ''>;
const isNonEmpty = <T,>(x: T): x is Truthy<T> => Array.isArray(x) ? x.some(isNonEmpty) : !!x;
export const wrapNonEmpty = <T,>(wrapper: (c: Truthy<T>) => ReactNode, x: T) =>
  isNonEmpty(x) && wrapper(x);

export const options = (names: string[], values?: string[]) =>
  names.map((x, i) => <option key={x} value={values?.[i] ?? x}>{x}</option>);

export const LoadingSelect = () =>
  <select disabled>
    <option>Betöltés...</option>
  </select>;
