import { ImmerHook } from 'use-immer';

import { Subject } from '../../../shared/types';
import { WithHandler } from '../../components/Modal';
import { useData } from '../../contexts/data';
import { valueAsProperty } from '../../utils/helpers';
import ModalWrapper from './ModalWrapper';

export type SubjectModalState = WithHandler<{ subject: Subject; code: string }>;

export default ({ state }: { state: ImmerHook<SubjectModalState | undefined> }) => {
  const { subjects } = useData();
  return <ModalWrapper
    state={state}
    title={creating => `Tárgy ${creating ? 'hozzáadása' : 'szerkesztése'}`}
    getId={x => x?.code}
    validate={(data, creating) => {
      if (!data.code.trim())
        return 'A tárgykód nem lehet üres.';
      if (!data.subject.name.trim())
        return 'A név nem lehet üres.';
      if (creating && data.code.trim() in subjects[0])
        return 'A tárgykód már létezik.';
    }}
  >
    {() =>
      <>
        <label>
          Tárgykód:<input size={18} placeholder='IP-18MATAG' {...valueAsProperty(state)('code')()}/>
        </label>
        <label>
          Név:
          <input
            size={36}
            placeholder='Matematikai alapok'
            {...valueAsProperty(state, x => x.subject)('name')()}
          />
        </label>
      </>}
  </ModalWrapper>;
};
