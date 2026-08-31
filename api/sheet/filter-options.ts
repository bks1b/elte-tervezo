import getData from '../../server/sheet/data.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(async () => (await getData()).filterOptions);
