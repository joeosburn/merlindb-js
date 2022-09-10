const { expect } = require('chai');
const JoeDB = require('..');
const { requestTime, resetFruit } = require('./helpers.js');
const joedb = new JoeDB('joedb://localhost:8080');

describe('Mutations', function() {
  before(async () => await joedb.connect());

  after(() => joedb.disconnect());

  it('inserts data into a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').insert({
      id: 'pineapple',
      fruit: 'Pinneapple',
      color: 'Tan',
      size: 'Large'
    }).run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('1 row(s) inserted');
  });

  it("automatically adds ids to rows inserted that don't include ids", async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').insert({
      fruit: 'Pomegranate',
      color: 'Pink',
      size: 'Medium'
    }).run();
    requestTime(result);
    result = await joedb.table('fruits').filter({fruit: 'Pomegranate'}).run();
    expect(result['rows'][0]['id']).to.exist;
    expect(result['rows'][0]['id']).to.not.be.empty;
  });

  it('updates a single row in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').get('apple').update({color: 'Green'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('1 row(s) updated');
    result = await joedb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([{
      id: 'apple',
      fruit: 'Apple',
      color: 'Green',
      size: 'Medium'
    }]);
  });

  it('updates all rows in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').update({size: 'Unknown', color: null}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('4 row(s) updated');
    result = await joedb.table('fruits').run();
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Apple',
        color: null,
        id: 'apple',
        size: 'Unknown'
      },
      {
        fruit: 'Cherry',
        color: null,
        id: 'cherry',
        size: 'Unknown'
      },
      {
        fruit: 'Peach',
        color: null,
        id: 'peach',
        size: 'Unknown'
      },
      {
        fruit: 'Watermelon',
        color: null,
        id: 'watermelon',
        size: 'Unknown'
      }
    ]);
  });

  it('updates filtered rows in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').filter({size: 'Medium'}).update({fruit: 'Medium Sized'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('2 row(s) updated');
    result = await joedb.table('fruits').run();
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Medium Sized',
        color: 'Red',
        id: 'apple',
        size: 'Medium'
      },
      {
        fruit: 'Cherry',
        color: 'Red',
        id: 'cherry',
        size: 'Small'
      },
      {
        fruit: 'Medium Sized',
        color: 'Orange',
        id: 'peach',
        size: 'Medium'
      },
      {
        fruit: 'Watermelon',
        color: 'Green',
        id: 'watermelon',
        size: 'Large'
      }
    ]);
  });

  it('destroys rows from a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').get('apple').destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('1 row(s) destroyed');
    result = await joedb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([]);
  });

  it('destroys all rows in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('4 row(s) destroyed');
    result = await joedb.table('fruits').run();
    expect(result['rows']).to.deep.equal([]);
  });

  it('destroys filtered rows in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').filter({size: 'Medium'}).destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('2 row(s) destroyed');
    result = await joedb.table('fruits').run();
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Cherry',
        color: 'Red',
        id: 'cherry',
        size: 'Small'
      },
      {
        fruit: 'Watermelon',
        color: 'Green',
        id: 'watermelon',
        size: 'Large'
      }
    ]);
  });

  it('replaces a single row in a table', async () => {
    await resetFruit(joedb);
    let result = await joedb.table('fruits').get('apple').replace(
      {
        id: 'apple',
        fruit: 'Apple',
        flavor: 'Sour',
        color: 'Green',
        type: 'Granny Smith'
      }
    ).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('1 row replaced');
    result = await joedb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([{
      id: 'apple',
      fruit: 'Apple',
      flavor: 'Sour',
      color: 'Green',
      type: 'Granny Smith'
    }]);
  });
});
