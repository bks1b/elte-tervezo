import { createContext, ReactNode, useState } from 'react';

import Modal from '../components/Modal';
import { makeUse } from '../utils/hooks';

export enum ModalType {
  ERROR = 'Hiba',
  CONFIRM = 'Megerősítés',
  INFO = 'Információ',
}

const ModalContext = createContext<
  ((
    type: ModalType,
    content: ReactNode,
    handler?: () => unknown,
    closeHandler?: () => unknown,
  ) => void) | undefined
>(undefined);

export const useSetModal = makeUse(ModalContext);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const state = useState<
    { type: ModalType; content: ReactNode; handler?: () => unknown; closeHandler?: () => unknown }
  >();
  return <ModalContext.Provider
    value={(type, content, handler, closeHandler) =>
      state[1]({ type, content, handler, closeHandler })}
  >
    <Modal
      state={state}
      title={x => x.type}
      handler={state[0]?.handler}
      closeHandler={state[0]?.type === ModalType.CONFIRM || state[0]?.closeHandler}
    >
      {x => x.content}
    </Modal>
    {children}
  </ModalContext.Provider>;
};
