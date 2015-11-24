/**
 * @author rik
 */
function makeRestRequestsForModel(model, privateApi) {
  function addModelsToLocalData(models) {
    privateApi.addModelsToLocalData.call(model, [models]);
    return models;
  }

  function removeModelsFromLocalData(response, requestBody) {
    privateApi.removeModelsFromLocalData.call(model, [requestBody]);
    return requestBody;
  }

  return {
    findAll: {
      method: 'get',
      route: model.url,
      resolve: addModelsToLocalData
    },
    findById: {
      method: 'get',
      route: `${model.url}/:id`,
      resolve: addModelsToLocalData
    },
    update: {
      method: 'put',
      route: `${model.url}/:id`,
      resolve: addModelsToLocalData
    },
    create: {
      method: 'post',
      route: model.url,
      resolve: addModelsToLocalData
    },
    destroy: {
      method: 'delete',
      route: `${model.url}/:id`,
      resolve: removeModelsFromLocalData
    }
  };
}

export default makeRestRequestsForModel;