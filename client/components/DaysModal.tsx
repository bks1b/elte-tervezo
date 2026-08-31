import { DAYS } from '../../shared/dates';
import { checkboxAsProperty } from '../utils/helpers';
import Modal, { State } from './Modal';

export default <T, U>(
  { state, get, title, days }: {
    state: State<T>;
    get: (x: T) => Parameters<typeof checkboxAsProperty<U, Partial<Record<number, boolean>>>>;
    title: string;
    days: number[];
  },
) =>
  <Modal state={state} title={() => title}>
    {data =>
      days.map(i =>
        <label key={i}>
          <input type='checkbox' {...checkboxAsProperty(...get(data))(i)(x => !!x)}/>
          {DAYS[i]}
        </label>
      )}
  </Modal>;
