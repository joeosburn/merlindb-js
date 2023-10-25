const { expect } = require('chai');
const MerlinDB = require('..');
const { requestTime, resetFruit } = require('./helpers.js');
const merlindb = new MerlinDB('merlindb://default:merlindb@localhost:8080');

describe('Requests', function() {
  before(async () => await merlindb.connect());

  after(() => merlindb.disconnect());

  it('inserts multiple rows into a table via multiple mutations', async () => {
    await resetFruit(merlindb);
    await merlindb.table('fruits').destroy().run();

    let result = await merlindb
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

    result = await merlindb.table('fruits').run();
    expect(result['rows']).to.have.deep.members([
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
    let result = await merlindb
      .listTables().as('first').queue()
      .table('fruits').as('second').run();

    let responses = result['responses']
    expect(responses[0].requestName).to.equal('first');
    expect(responses[1].requestName).to.equal('second');
  });
});
