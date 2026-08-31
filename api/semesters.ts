import { getSemesters } from '../server/semesters.js';
import { endpoint } from '../server/utils.js';

export default endpoint(() => getSemesters());
