const { expect } = require('chai');
const JoeDB = require('..');
const { requestTime } = require('./helpers.js');
const joedb = new JoeDB('joedb://default:joedb@localhost:8080');

describe('Schema', function() {
  before(async () => await joedb.connect());

  after(() => joedb.disconnect());

  it('lists all tables', async () => {
    const result = await joedb.listTables().run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['rows']).to.have.deep.members([
      {
        tableName: 'books',
        type: 'hop'
      },
      {
        tableName: 'cars',
        type: 'hop'
      },
      {
        tableName: 'fruits',
        type: 'hop'
      }
    ]);
  });

  it('creates a tables', async () => {
    let result = await joedb.createTable('users').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users created');
    result = await joedb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['users', 'fruits', 'cars', 'books']);
  });

  it('creates a table with type', async () => {
    let result = await joedb.createTable('resources', {type: 'memory'}).run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table resources created');
    result = await joedb.listTables().run();
    expect(result['rows']).to.have.deep.members([
      {
        tableName: 'books',
        type: 'hop'
      },
      {
        tableName: 'cars',
        type: 'hop'
      },
      {
        tableName: 'fruits',
        type: 'hop'
      },
      {
        tableName: 'users',
        type: 'hop'
      },
      {
        tableName: 'resources',
        type: 'memory'
      }
    ]);
    await joedb.dropTable('resources').run();
  });

  it('renames a tables', async () => {
    let result = await joedb.renameTable('users', 'accounts').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users renamed to accounts');
    result = await joedb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['accounts', 'fruits', 'cars', 'books']);
  });

  it('drops a tables', async () => {
    let result = await joedb.dropTable('accounts').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table accounts dropped');
    result = await joedb.listTables().run();
    expect(result['rows'].map(r => r.tableName)).to.have.members(['fruits', 'cars', 'books']);
  });
});
