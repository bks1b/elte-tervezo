import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ImmerHook, useImmer } from 'use-immer';

import { DAY_VOWELS, DAYS, SHIFTED_DAYS, timeToMinutes } from '../../../shared/dates';
import { capitalize } from '../../../shared/parsers';
import { getRuns, join } from '../../../shared/utils';
import DaysModal from '../../components/DaysModal';
import TimeInterval from '../../components/TimeInterval';
import { ModalType, useSetModal } from '../../contexts/modal';
import { options, valueAsProperty } from '../../utils/helpers';
import { DayConstraints, MAX_PENALTY } from '../search/helpers';
import Penalty from './Penalty';

export const DEFAULT_DAYS = [, true, true, true, true];
export const DEFAULT_INTERVAL = ['08:00', '18:00'];
export const DEFAULT_BREAK = 90;
export const DEFAULT_GAP = 90;

export default ({ constraints }: { constraints: ImmerHook<DayConstraints> }) => {
  const setModal = useSetModal();
  const daysModal = useImmer<number | undefined>(undefined);
  return <section className='surface'>
    <header className='buttons'>
      <h2>Szabályok</h2>
      <div>
        <button
          className='circle'
          onClick={() =>
            constraints[1](x => void x.unshift({ days: DEFAULT_DAYS, penalty: MAX_PENALTY + 1 }))}
        >
          <Plus/>
        </button>
      </div>
    </header>
    <DaysModal<number, DayConstraints>
      state={daysModal}
      get={i => [constraints, x => x[i].days]}
      title='Napok'
      days={SHIFTED_DAYS}
    />
    <div className='list'>
      {constraints[0].map((constraint, i) =>
        <article key={join(i, constraints[0].length)}>
          <div className='toolbar'>
            <span>
              {capitalize(
                getRuns(constraint.days.flatMap((x, j) => x ? [SHIFTED_DAYS.indexOf(j)] : []), r =>
                  r.map(j => SHIFTED_DAYS[j]).map(j => ({
                    name: DAYS[j],
                    replacedName: DAYS[j].replace(/a$/, 'á'),
                    vowel: DAY_VOWELS[j],
                  }))).flatMap(r =>
                    r.length > 2
                      ? [`${r[0].replacedName}t${r[0].vowel}l ${r.at(-1)!.replacedName}ig`]
                      : r.map(x =>
                        x.name
                      ).join(' és ')
                  ).join(', '),
              )}:
            </span>
            <label>
              <select
                {...valueAsProperty(constraints)(i)(
                  x => +!!x.gap + 2 * +!!x.interval + +!!x.break + '',
                  x => ({
                    ...constraint,
                    gap: x === '1' ? constraint.gap ?? DEFAULT_GAP : undefined,
                    interval: ['2', '3'].includes(x)
                      ? constraint.interval ?? DEFAULT_INTERVAL
                      : undefined,
                    break: x === '3' ? constraint.break ?? DEFAULT_BREAK : undefined,
                  }),
                )}
              >
                {options(['Üres nap', 'Leghosszabb lyukasóra', 'Napi időablak', 'Ebédszünet'], [
                  '0',
                  '1',
                  '2',
                  '3',
                ])}
              </select>
              {!!constraint.gap && <label>
                <input
                  type='number'
                  min={1}
                  max={60 * 24}
                  {...valueAsProperty(constraints, x => x[i])('gap')()}
                />
                perc
              </label>}
              {constraint.interval && <label>
                <TimeInterval
                  get={[constraints, x => x[i].interval!]}
                />
              </label>}
              {!!constraint.break && <label>
                között összefüggő
                <input
                  type='number'
                  min={1}
                  max={timeToMinutes(constraint.interval![1])
                    - timeToMinutes(constraint.interval![0])}
                  {...valueAsProperty(constraints, x => x[i])('break')()}
                />
                perc
              </label>}
            </label>
          </div>
          <div className='toolbar'>
            <div className='actions'>
              <button className='circle' onClick={() => daysModal[1](i)}>
                <Pencil/>
              </button>
              <button
                className='circle'
                onClick={() =>
                  setModal(ModalType.CONFIRM, 'Biztosan törölni szeretnéd a szabályt?', () =>
                    constraints[1](x => void x.splice(i, 1)))}
              >
                <Trash2/>
              </button>
            </div>
            <Penalty get={[constraints, x => x[i]]}/>
          </div>
        </article>
      )}
    </div>
  </section>;
};
