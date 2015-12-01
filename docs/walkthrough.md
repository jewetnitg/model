Lets start by importing the module, this is only necessary in browserify, if you are using the build, frontend-model is available globally on window.Model.

Please refer to {@link Model} for the full api documentation.

```
import Model from 'frontend-model';
```

before we can make models we need to set up a connection, so our models can communicate with a server
```
Model.Connection({
  name: 'local-xhr',
  url: 'http://localhost:1337',
  adapter: 'XHR'
});
```

Ok, now that the connection has been set up, lets create a model that uses this connection

```
window.user = Model({
  name: 'user',
  url: '/user', // defaults to /this.name, so can be omitted in this case
  connection: 'local-xhr'
});
```

we now have a user model, lets read some data from the server
```
user.fetch()
  .then(() => {
    console.log(user.data);
  });
```
manipulating local data works like this, note that none of these methods save anything to the server
```
var model = user.data[0];
user.set(model, {firstName: 'bob'});

var createdModel = user.create({
  name: 'bob'
});
var clone = user.clone(model);

user.remove(clone);
```

To save changes made locally using set, add and remove, we can call the save, remove and sync methods
```
// save all models to the server that have been changed or added locally
user.save()
  .then(...);

// saves one model
user.save(model)
  .then(...);

// destroy all models on the server that have been removed locally
user.destroy()
    .then(...);

// destroy one model
user.destroy(model)
  .then(...);

// removes, saves and fetches all models
user.sync()
    .then(...);

```

this is the preferred way of listening to model changes

```
var model = user.data[0];
var listener = user.listenTo(model, 'change', function (changedModel) {
  console.log('model changed', changedModel);
});

// this will trigger the listener above
user.set(model, {firstName: 'asd'});

// this will stop the listener
listener.stop();
```