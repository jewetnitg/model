/**
 * @author rik
 */
import _ from 'lodash';

function replaceObjectProperties(obj = {}, newProperties = {}) {
  if (obj === newProperties) {
    return obj;
  }

  if (Array.isArray(obj)) {
    while (obj.length) {
      obj.pop();
    }

    if (Array.isArray(newProperties)) {
      obj.push.apply(obj, newProperties);
    }
  } else if (typeof obj === 'object') {
    _.each(obj, (val, key) => {
      delete obj[key]
    });

    if (typeof newProperties === 'object') {
      _.extend(obj, newProperties);
    }
  }

  return obj;
}

export default replaceObjectProperties;