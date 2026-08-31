import { getOptionalities } from '../../server/sheet/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(async q => (await getOptionalities())(q.id.split(',')), ['id']);
