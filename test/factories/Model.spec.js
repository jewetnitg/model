/**
 * @author rik
 */
import _ from 'lodash';

import Model from '../../src/factories/Model';
import ModelValidator from '../../src/validators/Model';

describe(`Model`, () => {

  it(`should be a function`, (done) => {
    expect(Model).to.be.a('function');
    done();
  });

});