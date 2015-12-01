/**
 * @author rik
 */
import _ from 'lodash';

function Queue(task) {
  const props = {
    queue: {
      value: []
    },
    task: {
      value: task
    }
  };

  return Object.create(Queue.prototype, props);
}

Queue.prototype = {

  add(items) {
    if (Array.isArray(items)) {
      _.each(items, item => {
        this.add(item);
      });
    } else {
      const index = this.queue.indexOf(items);

      if (index === -1) {
        this.queue.push(items);
      }
    }
  },

  remove(items) {
    if (Array.isArray(items)) {
      _.each(items, item => {
        this.remove(item);
      });
    } else {
      const index = this.queue.indexOf(items);

      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    }
  },

  empty() {
    while (this.queue.length) {
      this.queue.pop();
    }
  },

  run() {
    const promises = [];

    while (this.queue.length) {
      const item = this.queue.pop();

      promises.push(
        this.task(item)
      );

    }

    return Promise.all(promises);
  }

};

export default Queue;