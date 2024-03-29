const { expect } = require('chai');
const MerlinDB = require('..');
const { requestTime, resetFruit } = require('./helpers.js');
const merlindb = new MerlinDB('merlindb://default:merlindb@localhost:8080');

describe('Mutations', function() {
  before(async () => {
    console.log('before starting');
    await merlindb.connect();
  });

  after(() => merlindb.disconnect());

  it('inserts data into a table', async () => {
    console.log('test starting');
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').insert({
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
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').insert({
      fruit: 'Pomegranate',
      color: 'Pink',
      size: 'Medium'
    }).run();
    requestTime(result);
    result = await merlindb.table('fruits').filter({fruit: 'Pomegranate'}).run();
    expect(result['rows'][0]['id']).to.exist;
    expect(result['rows'][0]['id']).to.not.be.empty;
  });

  it('updates a single row in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').get('apple').update({color: 'Green'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('1 row(s) updated');
    result = await merlindb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([{
      id: 'apple',
      fruit: 'Apple',
      color: 'Green',
      size: 'Medium'
    }]);
  });

  it('updates all rows in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').update({size: 'Unknown', color: null}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('4 row(s) updated');
    result = await merlindb.table('fruits').run();
    expect(result['rows']).to.have.deep.members([
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
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').filter({size: 'Medium'}).update({fruit: 'Medium Sized'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('2 row(s) updated');
    result = await merlindb.table('fruits').run();
    expect(result['rows']).to.have.deep.members([
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

  it('deletes a key from a row in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').get('apple').deleteKey('color').run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('1 row(s) updated');
    result = await merlindb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([{
      id: 'apple',
      fruit: 'Apple',
      size: 'Medium'
    }]);
  });

  it('deletes a key from all rows in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').deleteKey('color').run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('4 row(s) updated');
    result = await merlindb.table('fruits').fields(['id', 'color']).run();
    expect(result['rows']).to.have.deep.members([
      {
        id: 'apple'
      },
      {
        id: 'cherry'
      },
      {
        id: 'peach'
      },
      {
        id: 'watermelon'
      }
    ]);
  });

  it('destroys rows from a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').get('apple').destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('1 row(s) destroyed');
    result = await merlindb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([]);
  });

  it('destroys all rows in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('4 row(s) destroyed');
    result = await merlindb.table('fruits').run();
    expect(result['rows']).to.deep.equal([]);
  });

  it('destroys filtered rows in a table', async () => {
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').filter({size: 'Medium'}).destroy().run();
    requestTime(result);
    expect(result['status']).to.equal('OK')
    expect(result['message']).to.equal('2 row(s) destroyed');
    result = await merlindb.table('fruits').run();
    expect(result['rows']).to.have.deep.members([
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
    await resetFruit(merlindb);
    let result = await merlindb.table('fruits').get('apple').replace(
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
    result = await merlindb.table('fruits').get('apple').run();
    expect(result['rows']).to.deep.equal([{
      id: 'apple',
      fruit: 'Apple',
      flavor: 'Sour',
      color: 'Green',
      type: 'Granny Smith'
    }]);
  });
});
