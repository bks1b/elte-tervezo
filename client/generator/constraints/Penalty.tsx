import { valueAsProperty } from '../../utils/helpers';
import { isMandatory, MAX_PENALTY, Penalty } from '../search/helpers';

export default <T,>({ get }: { get: Parameters<typeof valueAsProperty<T, Partial<Penalty>>> }) =>
  <label>
    <input
      type='range'
      min='1'
      max={MAX_PENALTY + 1}
      {...valueAsProperty(...get)('penalty')(x => x + '', x => +x)}
    />
    <span>
      {(({ penalty }) => isMandatory(penalty!) ? 'Kötelező' : `Kihagyás: ${penalty} hibapont`)(
        get[1]!(get[0][0]!),
      )}
    </span>
  </label>;
