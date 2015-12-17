/**
 * @author rik
 */
import _ from 'lodash';

import replaceObjectProperties from '../helpers/replaceObjectProperties';

function Repository(model) {
  const props = {
    data: {
      value: model.data
    },
    byId: {
      value: model.byId
    },
    model: {
      value: model
    }
  };

  return Object.create(Repository.prototype, props);
}

Repository.prototype = {

  id(model) {
    return typeof model !== 'object' ? model : model[this.model.idAttribute];
  },

  add(models) {
    if (Array.isArray(models)) {
      return _.map(models, model => {
        return this.add(model);
      });
    } else if (typeof models === 'object') {
      return this.addOne(models);
    }
  },

  addOne(model) {
    const id = this.model.id(model);
    const existingModel = this.get(model);
    const event = existingModel ? 'update' : 'add';
    let _model = null;

    if (existingModel) {
      _model = replaceObjectProperties(existingModel, model);
    } else {
      _model = model;
      this.data.push(_model);
    }

    this.model.trigger('change', _model);
    this.model.trigger(event, _model);

    if (id) {
      this.byId[id] = _model;
    }

    return _model;
  },

  remove(models) {
    if (Array.isArray(models)) {
      return _.map(models, model => {
        return this.remove(model);
      });
    } else if (typeof models === 'object') {
      return this.removeOne(models);
    }
  },

  removeOne(model) {
    const index = this.data.indexOf(model);
    const id = this.model.id(model);

    if (index !== -1) {
      this.data.splice(index, 1);
    }

    if (id) {
      delete this.byId[id];
    }

    this.model.trigger('change', model);
    this.model.trigger('remove', model);

    return model;
  },

  get(modelOrId) {
    const id = this.model.id(modelOrId);

    if (id) {
      return this.byId[id];
    } else {
      return _.find(this.data, modelOrId);
    }
  },

  empty() {
    while (this.data.length) {
      const model = this.data.pop();
      const id = this.model.id(model);

      if (id) {
        delete this.byId[id];
      }
    }
  }

};

export default Repository;