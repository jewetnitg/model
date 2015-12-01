import events from 'events';

import _ from 'lodash';

import Queue from './Queue';
import Repository from './Repository';
import Listener from './Listener';

import communicator from '../singletons/communicator';

import models from '../singletons/models';
import modelsById from '../singletons/modelsById';

import makeRestRequestsForModel from '../helpers/makeRestRequestsForModel';
import replaceObjectProperties from '../helpers/replaceObjectProperties';
import ModelSpec from '../specs/ModelSpec';

/**
 * This function creates an Model.
 *
 * @class Model
 * @author Rik Hoffbauer
 *
 * @param {Object}[options={}] - Object containing the properties listed below.
 *
 * @property name {String} The name of the model.
 * @property connection {String} The connection this model should use
 * @property {String} [url=`/${name}`] - The base url of the model ('/user' for example)
 * @property {Object} [api={}] - Object the model will be extended with
 * @property {Object} [schema={}] - Object describing the properties of a Model, NOT IMPLEMENTED YET
 * @property {Object} [defaults={}] - Object with default properties of the model, schema will deprecate this property
 * @property {String} [event=The models name] - Server event for the model, 'user' for example
 * @property {String} [requests={}] - Requests for this model, other than the restful findAll(), findById(id), create(model), update(id, model), destroy(id) methods, which are created automatically
 * @property {String} [idAttribute='id'] - The attribute on which the id of the model resides.
 * @property {String} [createdOnAttribute='createdAt'] - The attribute on which the created on property of the model resides.
 * @property {String} [updatedOnAttribute='updatedAt'] - The attribute on which the updated on property of the model resides.
 *
 * @todo handle connection events
 * @todo implement schema, deprecate defaults
 * @todo tbd: do we want to allow for transformer functions to be defined that are executed before and after a request to the server is made
 * @todo allow idAttribute, createdAtAttribute and updateAtAttribute to be implemented as functions
 *
 * @example
 * import Model from 'frontend-model';
 *
 * const model = Model({
 *   name: 'user',
 *   url: '/user',
 *   connection: 'local-xhr',
 *   requests: {
 *     login: {
 *       route: '/user/login',
 *       method: 'get'
 *     }
 *   },
 *   event: 'user',
 *   idAttribute: 'id'
 * });
 */
function Model(options = {}) {
  const props = ModelSpec(options, Model);
  const model = Object.create(Model.prototype, props);

  _.extend(model, options.api);

  // bind context of all api methods
  const methods = _.methods(options.api);
  if (methods.length) {
    _.bindAll(model, _.methods(options.api));
  }

  privateApi.constructListener.call(model);
  privateApi.constructRepository.call(model);
  privateApi.constructQueues.call(model);
  privateApi.constructRequests.call(model);

  Model.models[model.name] = model;

  return model;
}

/**
 * All data for all models
 *
 * @name models
 * @memberof Model
 * @static
 * @type Object
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.models.users; // [{name: 'bob'}, {...}, {...}]
 */
Model.models = models;

/**
 * All data for all models by id
 *
 * @name byId
 * @memberof Model
 * @static
 * @type Object
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.models.byId; // {1: {name: 'bob'}, 2: {...}, 3: {...}}
 */
Model.byId = modelsById;

/**
 * The default values for a model, these may be changed.
 *
 * @name defaults
 * @memberof Model
 * @static
 * @type Object
 *
 * @property {String} [name=''] Shouldn't be set to anything, default name of a model should be an empty string
 * @property {String} [connection=''] Connection might be useful to set, so you don't have to provide it to every model
 * @property {String} [requests={}] You can create requests that become available for every model
 * @property {String} [api={}] Provide a default api for all models
 * @property {String} [schema={}] Provide a default schema for all models
 * @property {String} [defaults={}] Set defaults for all models, probably not useful
 * @property {String} [idAttribute='id'] Set the idAttribute of every object, might be useful
 * @property {String} [updatedOnAttribute='updatedAt] Set the updatedAt of every object, might be useful
 * @property {String} [createdOnAttribute='createdAt'] Set the createdAt of every object, might be useful
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.defaults.connection = 'local-xhr';
 */
Model.defaults = {
  name: '',
  connection: '',
  requests: {},
  api: {},
  schema: {},
  defaults: {},
  idAttribute: 'id',
  updatedOnAttribute: 'updatedAt',
  createdOnAttribute: 'createdAt'
};

/**
 * Communicator used by the Model to communicate with the server, see the frontend-communicator documentation for more information.
 *
 * @name communicator
 * @type Object
 * @memberof Model
 * @static
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.communicator.connect('local-xhr')
 *   .then(...);
 */
Model.communicator = communicator;

/**
 * Adapter factory, see the frontend-communicator documentation for more information.
 *
 * @method Adapter
 * @memberof Model
 * @static
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.Adapter({
 *   connect() {
 *   }
 *   ...
 * });
 */
Model.Adapter = communicator.Adapter;

/**
 * Connection factory, see the frontend-communicator documentation for more information.
 *
 * @method Connection
 * @memberof Model
 * @static
 *
 * @example
 * import Model from 'frontend-model';
 *
 * Model.Connection({
 *   name: 'local-xhr',
 *   adapter: 'XHR',
 *   url: 'http://localhost:1337'
 * });
 */
Model.Connection = communicator.Connection;

Model.prototype = {

  /**
   * Listens to an event and triggers the callback when it occurs.
   *
   * @method on
   * @memberof Model
   * @instance
   *
   * @param event {String} The event to listen for
   * @param callback {Function} The function to trigger when the event has occurred
   *
   * @returns {*}
   */
  on(event, callback) {
    return this.listener.on(event, callback);
  },

  /**
   * Stops removes one or all listeners from an event
   *
   * @method off
   * @memberof Model
   * @instance
   *
   * @param event{String} The event that has to be stopped listening to
   * @param {Function} [callback] - The callback that should be removed
   *
   * @returns {*}
   */
  off(event, callback) {
    return this.listener.off(event, callback);
  },

  /**
   * Listens to an event and triggers the callback when it occurs. After this happens the listener is removed.
   *
   * @method once
   * @memberof Model
   * @instance
   *
   * @param event {String} The event to listen for
   * @param callback {Function} The function to trigger when the event has occurred
   *
   * @returns {*}
   */
  once(event, callback) {
    return this.listener.once(event, callback);
  },

  /**
   * Triggers an event with data
   *
   * @method trigger
   * @memberof Model
   * @instance
   *
   * @param event {String} Event to trigger
   * @param data {*} Data to trigger with the event
   *
   * @returns {*}
   */
  trigger(event, data) {
    return this.listener.trigger(event, data);
  },

  /**
   * Listens to changes in one, or all models.
   *
   * @method listenTo
   * @memberof Model
   * @instance
   *
   * @param {Object} [model] Model to listen to
   * @param {Object} [event] Event to listen to
   * @param callback {Function} Function to call when the event has been triggered for this model.
   *
   * @returns {Object} Listener object, this is used to stop listening, by passing it into stopListeningTo, or by calling the stop() method provided on it
   * @example
   * user.listenTo(model, function (changedModel) {...});
   * user.listenTo(function (changedModel) {...});
   */
  listenTo(model, event, callback) {
    return this.listener.listenTo(model, event, callback);
  },

  /**
   * Determines whether a model is new (doesn't exist on the server)
   *
   * @method isNew
   * @memberof Model
   * @instance
   *
   * @param model {object} model in question
   * @returns {boolean}
   * @example
   * < model.isNew({
   *   name: 'bob'
   * });
   * > false
   *
   * < model.isNew({
   *  id: 3
   * });
   * > true
   */
  isNew(model) {
    return typeof model[this.idAttribute] === 'undefined';
  },

  /**
   * Gets the id for a model
   *
   * @method id
   * @memberof Model
   * @instance
   *
   * @param model {Object|String|Number} Model or id
   *
   * @returns {*}
   * @example
   * model.id({...});
   */
  id(model) {
    return typeof model === 'object' ? model[this.idAttribute] : model;
  },

  /**
   * Syncs the local data with server data, first destroys and saves models from and to the server that have been removed / changed / created locally.
   * After removing and saving local models to the server, the current data is fetched from the server
   *
   * @method sync
   * @memberof Model
   * @instance
   *
   * @returns {Promise}
   * @example
   * model.sync()
   *   .then(...);
   */
  sync() {
    return Promise.all([
      this.save(),
      this.destroy()
    ]).then(() => {
      return this.reset();
    });
  },

  /**
   * Saves a model to the server, if model is provided, all to be saved models will be saved to the server (all locally created and changed models)
   *
   * @method save
   * @memberof Model
   * @instance
   *
   * @param {Object} [model] The model to save, if none specified, all models that are to be saved will be saved
   *
   * @returns {Promise}
   * @example
   * // to save all newly created or updated models
   * model.save()
   *   .then(...);
   *
   * // save one model
   * model.save({
   *     name: 'bob'
   *   })
   *   .then(...);
   */
  save(model) {
    if (typeof model !== 'object') {
      return this.queues.save.run();
    }

    if (this.isNew(model)) {
      return this.server.create(model);
    } else {
      return this.server.update(this.id(model), model);
    }
  },

  /**
   * Fetches a model from the server
   *
   * @method fetch
   * @memberof Model
   * @instance
   *
   * @param model {Object|String|Number} Model or model id
   * @returns {Promise}
   * @example
   * // fetch all models
   * model.fetch()
   *   .then(...);
   *
   * // fetch one model by object
   * model.fetch({
   *     id: 3,
   *     ...
   *   })
   *   .then(...);
   *
   * // fetch one model by id
   * model.fetch(3)
   *   .then(...);
   *
   */
  fetch(model) {
    const id = this.id(model);

    if (id) {
      return this.server.findById(id);
    } else {
      return this.server.findAll();
    }
  },

  /**
   * Resets the data of the model to the state of the server. Gets rid of any changes that haven't been saved yet.
   *
   * @method reset
   * @memberof Model
   * @instance
   *
   * @returns {Promise}
   * @example
   * model.reset()
   *   .then(...)
   */
  reset() {
    this.queues.save.empty();
    this.queues.destroy.empty();

    // remove all models
    replaceObjectProperties(this.byId);
    replaceObjectProperties(this.data);

    // get all models
    return this.fetch();
  },

  /**
   * Destroy a model on the server, to remove a model locally see {@link Model#remove}
   *
   * @method destroy
   * @memberof Model
   * @instance
   *
   * @param {Object|String|Number} [model] Model or model id
   *
   * @returns {Promise}
   * @example
   * // to destroy all newly created or updated models
   * model.destroy()
   *   .then(...);
   *
   * // destroy one model by object
   * model.save({
   *     id: 3
   *   })
   *   .then(...);
   *
   * // destroy one model by id
   * model.destroy(3)
   *   .then(...);
   */
  destroy(model) {
    if (typeof model === 'undefined') {
      return this.queues.destroy.run();
    }

    const id = this.id(model);

    if (id) {
      return this.server.destroy(id);
    } else {
      privateApi.removeModelFromLocalData.call(this, model);
      return Promise.resolve();
    }
  },

  /**
   * See {@link Model#add}
   *
   * @method set
   * @memberof Model
   * @instance
   * @alias add
   *
   * @param model {Object} model that is to be set
   * @param properties {Object} new properties that have to be set
   *
   * @example
   * model.set(model.data[0], {firstName: 'bob});
   */
  set(model, properties = {}) {
    _.extend(model, properties);
    this.add(model);
    return model;
  },

  /**
   * Adds one or more models to the local data, if models already exist, their properties are replaced.
   *
   * @method add
   * @memberof Model
   * @instance
   * @alias set
   *
   * @param models (Object|Array<Object>)} models to be added
   * @example
   * model.add({});
   * model.add([{}]);
   * model.add([{}], {});
   */
  add(models) {
    privateApi.addModelsToLocalData.call(this, models, true);
  },

  /**
   * Removes one or more models from the local data, to remove a model from the server see {@link Model#destroy}.
   *
   * @method remove
   * @memberof Model
   * @instance
   *
   * @param models {...(Object|Array<Object>)} models to be removed
   * @example
   * // etc.
   * model.remove({});
   * model.remove([{}]);
   * model.remove([{}], {});
   *
   */
  remove(models) {
    privateApi.removeModelsFromLocalData.call(this, models, true);
  },

  /**
   * Creates a a new model, and adds it to the local data, when sync(), save() or save(createdModel) is called it will be saved to the server.
   *
   * @method create
   * @memberof Model
   * @instance
   *
   * @param attributes {Object} Properties of the model to create
   *
   * @returns {Object}
   * @example
   * const createdModel = model.create({
   *   name: 'bob'
   * });
   * // to save to the server:
   * model.sync(); // syncs everything, most expensive
   * // or
   * model.save(); // saves everything, significantly less expensive
   * // or
   * model.save(createdModel); // saves just this model, least expensive
   */
  create(attributes = {}) {
    const model = _.extend({}, this.defaults, attributes);
    this.add(model);
    return model;
  },

  /**
   * Clones a model, by cloning the object and removing its id, createOn and updatedOn properties. The attributes of these three properties can be configured using the idAttribute, createdOnAttribute and updatedOnAttribute.
   *
   * @method clone
   * @memberof Model
   * @instance
   *
   * @param model {Object} Model that is to be cloned
   *
   * @returns {Object}
   * @example
   * const clonedModel = model.clone({
   *   name: 'bob'
   * });
   * // to save to the server:
   * model.sync(); // syncs everything, most expensive
   * // or
   * model.save(); // saves everything, significantly less expensive
   * // or
   * model.save(clonedModel); // saves just this model, least expensive
   */
  clone(model = {}) {
    const cloned = _.clone(model);

    delete cloned[this.idAttribute];
    delete cloned[this.createdOnAttribute];
    delete cloned[this.updatedOnAttribute];

    return this.create(cloned);
  }

};

// private API of the Model, these methods are always called with the context of a Model
const privateApi = {

  constructRepository() {
    this.repository = Repository(this);
  },

  constructListener() {
    this.listener = Listener(this);
  },

  constructQueues() {
    this.queues = {
      save: Queue((model) => {
        return this.save(model);
      }),
      destroy: Queue((model) => {
        return this.destroy(model);
      })
    };
  },

  constructRequests() {
    _.extend(this.requests, makeRestRequestsForModel(this, privateApi));

    _.each(this.requests, (requestOptions, name) => {
      const options = _.clone(requestOptions);
      options.name = `${this.name}.${options.name || name}`;
      options.connection = options.connection || this.connection;

      communicator.Request(options);
    });
  },

  removeModelsFromLocalData(models = [], addToQueue = false) {
    const _models = this.repository.remove(models);

    if (addToQueue) {
      this.queues.destroy.add(_models);
    }
  },

  addModelsToLocalData(models = [], addToQueue = false) {
    const _models = this.repository.add(models);

    if (addToQueue) {
      this.queues.save.add(_models);
    }
  }

};

export default Model;