/**
 * @author rik
 */
import _ from 'lodash';

function replaceObjectProperties(obj = {}, newProperties = {}) {
  if (Array.isArray(obj)) {
    _.each(obj, (val, index) => {
      obj.splice(index, 1);
    });

    if (newProperties) {
      obj.push.apply(obj, newProperties);
    }
  } else if (typeof obj === 'object') {
    _.each(obj, (val, key) => {
      delete obj[key]
    });

    _.extend(obj, newProperties);
  }

  return obj;
}

export default replaceObjectProperties;