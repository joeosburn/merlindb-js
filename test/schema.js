const { expect } = require('chai');
const MerlinDB = require('..');
const { requestTime } = require('./helpers.js');
const merlindb = new MerlinDB('merlindb://default:merlindb@localhost:8080');

describe('Schema', function() {
  before(async () => await merlindb.connect());

  after(() => merlindb.disconnect());

  it('lists all tables', async () => {
    const result = await merlindb.listTables().run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['rows']).to.have.deep.members([
      {
        tableName: 'books',
        type: 'disk'
      },
      {
        tableName: 'cars',
        type: 'disk'
      },
      {
        tableName: 'fruits',
        type: 'disk'
      }
    ]);
  });

  it('creates a tables', async () => {
    let result = await merlindb.createTable('users').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users created');
    result = await merlindb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['users', 'fruits', 'cars', 'books']);
  });

  it('creates a table with type', async () => {
    let result = await merlindb.createTable('resources', {type: 'memory'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table resources created');
    result = await merlindb.listTables().run();
    expect(result['rows']).to.have.deep.members([
      {
        tableName: 'books',
        type: 'disk'
      },
      {
        tableName: 'cars',
        type: 'disk'
      },
      {
        tableName: 'fruits',
        type: 'disk'
      },
      {
        tableName: 'users',
        type: 'disk'
      },
      {
        tableName: 'resources',
        type: 'memory'
      }
    ]);
    await merlindb.dropTable('resources').run();
  });

  it('renames a tables', async () => {
    let result = await merlindb.renameTable('users', 'accounts').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users renamed to accounts');
    result = await merlindb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['accounts', 'fruits', 'cars', 'books']);
  });

  it('drops a tables', async () => {
    let result = await merlindb.dropTable('accounts').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table accounts dropped');
    result = await merlindb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['fruits', 'cars', 'books']);
  });
});
