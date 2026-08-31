import { Fragment } from 'react/jsx-runtime';

import { minutesToTime, timeToMinutes } from '../../shared/dates';
import { valueAsProperty } from '../utils/helpers';

export default <T,>({ get }: { get: Parameters<typeof valueAsProperty<T, string[]>> }) =>
  [0, 1].map(i =>
    <Fragment key={i}>
      <input
        type='time'
        {...valueAsProperty(...get)(i)(undefined, x =>
          get[1]!(get[0][0]!)[1 - i]
            ? minutesToTime(
              Math[(['min', 'max'] as const)[i]](
                timeToMinutes(get[1]!(get[0][0]!)[1 - i]),
                timeToMinutes(x),
              ),
            )
            : x)}
      />
      {!i && ' - '}
    </Fragment>
  );
