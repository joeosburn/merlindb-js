const { expect } = require('chai');

const client = require('../joedb-client');
const { requestTime, resetFruit } = require('./helpers.js');

describe('Requests', function() {
  var joedb;

  before(function(done) {
    client('joedb://localhost:8080').connect((conn) => {
      joedb = conn;
      done();
    });
  });

  after(function() {
    joedb.disconnect();
  })

  it('inserts multiple rows into a table via multiple mutations', async () => {
    await resetFruit(joedb);
    await joedb.table('fruits').destroy().run();

    let result = await joedb
      .table('fruits').insert({
        id: 'pineapple',
        fruit: 'Pinneapple'
      }).queue()
      .table('fruits').insert({
        id: 'orange',
        fruit: 'Orange'
      }).queue()
      .table('fruits').insert({
        id: 'plum',
        fruit: 'Plum'
      }).run();

    requestTime(result);
    
    const responses = result['responses']

    responses.forEach((response) => {
      expect(response['status']).to.equal('OK');
      expect(response['message']).to.equal('1 row(s) inserted');
    });

    result = await joedb.table('fruits').run();
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Pinneapple',
        id: 'pineapple'
      },
      {
        fruit: 'Orange',
        id: 'orange'
      },
      {
        fruit: 'Plum',
        id: 'plum'
      }
    ]);
  });

  it('names multiple requests', async () => {
    let result = await joedb
      .listTables().as('first').queue()
      .table('fruits').as('second').run();

    let responses = result['responses']
    expect(responses[0].requestName).to.equal('first');
    expect(responses[1].requestName).to.equal('second');
  });
});