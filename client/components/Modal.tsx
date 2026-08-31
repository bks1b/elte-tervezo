import { Check, X } from 'lucide-react';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { ImmerHook } from 'use-immer';

export type State<T> =
  | [T | undefined, Dispatch<SetStateAction<T | undefined>>]
  | ImmerHook<T | undefined>;

export type ModalChild<T> = (x: T, set: State<T>[1]) => ReactNode;

export type Handler<T> = { handler?: (x: T) => unknown };
export type WithHandler<T> = T & Handler<T>;

export default <T,>(
  { state, title, children, button, handler, closeHandler }: {
    state: State<T>;
    title: (x: T) => string;
    children: ModalChild<T>;
    button?: ModalChild<T>;
    closeHandler?: true | (() => unknown);
  } & Handler<T>,
) => {
  const close = () => {
    if (typeof closeHandler === 'function') closeHandler();
    state[1](undefined);
  };
  return state[0] !== undefined && createPortal(
    <div className='modal' onClick={close}>
      <section onClick={e => e.stopPropagation()}>
        <header>
          <h2 style={{ fontSize: '1.15rem' }}>{title(state[0])}</h2>
          {button?.(state[0], state[1])}
        </header>
        <div>{children(state[0], state[1])}</div>
        <footer>
          {(handler || !closeHandler) && <button
            className='circle'
            onClick={() => {
              handler?.(state[0]!);
              state[1](undefined);
            }}
          >
            <Check/>
          </button>}
          {closeHandler && <button className='circle' onClick={close}>
            <X/>
          </button>}
        </footer>
      </section>
    </div>,
    document.body,
  );
};
