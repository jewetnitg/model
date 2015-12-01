/**
 * @author rik
 */
import Communicator from 'frontend-communicator';
import XHR from 'frontend-communicator/src/adapters/XHR';

const communicator = Communicator({
  name: 'frontend-model-communicator',
  adapters: {
    // register the XHR adapter by default
    XHR
  }
});

export default communicator;