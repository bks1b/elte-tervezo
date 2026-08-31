import { useMemo } from 'react';

import Modal, { Handler, ModalChild, State } from '../../components/Modal';
import { ModalType, useSetModal } from '../../contexts/modal';

export default <T extends Handler<T>>(
  { children, state, title, getId, validate }: {
    state: State<T>;
    children: ModalChild<T>;
    title: (c: boolean, x: T) => string;
    getId: (x: T | undefined) => string | undefined;
    validate: (x: T, c: boolean) => string | undefined;
  },
) => {
  const setModal = useSetModal();
  const creating = useMemo(() => !getId(state[0]), [!state[0]]);
  return <Modal
    state={state}
    title={x => title(creating, x)}
    handler={x => {
      const error = validate(x, creating);
      if (error) throw setModal(ModalType.ERROR, error);
      x.handler?.(x);
    }}
    closeHandler
  >
    {children}
  </Modal>;
};
