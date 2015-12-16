/**
 * @author rik
 */
import _ from 'lodash';

import communicator from '../singletons/communicator';
import modelsById from '../singletons/modelsById';
import models from '../singletons/models';
import ModelValidator from '../validators/Model';

function ModelSpec(options, Model) {
  options = _.merge({}, Model.defaults, {
    event: options.name,
    url: `/${options.name}`
  }, options);

  ModelValidator.construct(options);

  const server = communicator.servers[options.connection][options.name] = communicator.servers[options.connection][options.name] || {};
  const connection = communicator.connections[options.connection];

  return {
    name: {
      value: options.name
    },
    defaults: {
      value: options.defaults
    },
    connection: {
      value: connection
    },
    event: {
      value: options.event
    },
    autoSubscribe: {
      value: options.autoSubscribe
    },
    schema: {
      value: options.schema
    },
    requests: {
      value: options.requests
    },
    url: {
      value: options.url
    },
    idAttribute: {
      value: options.idAttribute
    },
    updatedOnAttribute: {
      value: options.updatedOnAttribute
    },
    createdOnAttribute: {
      value: options.createdOnAttribute
    },

    /**
     * Object containing functions representing requests
     *
     * @name server
     * @memberof Model
     * @instance
     * @type Object<Function>
     * @example
     * model.server.login()
     *   .then(...);
     */
    server: {
      value: server
    },

    /**
     * Object that maps model ids to models
     *
     * @name byId
     * @memberof Model
     * @instance
     * @type Object<Object>
     * @example
     * < model.byId["aaedfeae53d23d23f2f31ddsd"]
     * > Object {name: ...}
     */
    byId: {
      value: modelsById[options.name] = {}
    },

    /**
     * Array containing all models
     *
     * @name data
     * @memberof Model
     * @instance
     *
     * @type Array<Object>
     * @example
     * < model.data[0]
     * > Object {name: ...}
     */
    data: {
      value: models[options.name] = []
    }
  };
}

export default ModelSpec;