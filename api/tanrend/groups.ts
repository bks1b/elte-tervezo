import { getGroups } from '../../server/tanrend/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(() => getGroups());
