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

  add(...items) {
    _.each(_.flatten(items), item => {
      const index = this.queue.indexOf(item);

      if (index === -1) {
        this.queue.push(item);
      }
    });
  },

  remove(...items) {
    _.each(_.flatten(items), item => {
      const index = this.queue.indexOf(item);

      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    });
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