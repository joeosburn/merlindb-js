const { expect } = require('chai');
const JoeDB = require('..');
const { requestTime } = require('./helpers.js');
const joedb = new JoeDB('joedb://localhost:8080');

describe('Schema', function() {
  before(async () => await joedb.connect());

  after(() => joedb.disconnect());

  it('lists all tables', async () => {
    const result = await joedb.listTables().run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['rows']).to.have.members(['fruits', 'cars', 'books']);
  });

  it('creates a tables', async () => {
    let result = await joedb.createTable('users').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users created');
    result = await joedb.listTables().run();
    expect(result['rows']).to.have.members(['users', 'fruits', 'cars', 'books']);
  });

  it('drops a tables', async () => {
    let result = await joedb.dropTable('users').run();
    requestTime(result);
    expect(result['status']).to.equal('OK');
    expect(result['message']).to.equal('Table users dropped');
    result = await joedb.listTables().run();
    expect(result['rows']).to.have.members(['fruits', 'cars', 'books']);
  });
});
