import {map} from './helpers/utils';
import {Dispatcher} from './parser/namespace';
import * as ParserList from './parser/index';
const dispatcher = new Dispatcher;
map(ParserList,(item,key) => {
  // remove such as __esModule key
  if((<string>key).indexOf('_') === 0)return;
  dispatcher.addParser(<string>key,item.config,item.parse);
});
export default dispatcher;