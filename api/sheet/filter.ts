import { filter } from '../../server/sheet/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(async q => (await filter())?.(q.spec, q.type, +q.min, +q.max), [
  'spec',
  'type',
  'min',
  'max',
]);
