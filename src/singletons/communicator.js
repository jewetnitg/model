/**
 * @author rik
 */
import Communicator from 'frontend-communicator';
import XHR from 'frontend-communicator/src/adapters/XHR';
import SAILS_IO from 'frontend-communicator/src/adapters/SAILS_IO';

const communicator = Communicator({
  name: 'frontend-model-communicator',
  adapters: {
    // register the XHR and SAILS_IO adapter by default
    XHR,
    SAILS_IO
  }
});

export default communicator;