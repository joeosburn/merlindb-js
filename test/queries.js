const { expect } = require('chai');
const JoeDB = require('..');
const { requestTime, resetFruit, resetCars, resetBooks } = require('./helpers.js');
const joedb = new JoeDB('joedb://default:joedb@localhost:8080');

describe('Queries', function() {
  before(async () => {
    await joedb.connect();
    await resetFruit(joedb);
  });

  after(() => {
    joedb.disconnect();
  });

  it('handles a bunch of queries at once', async () => {
    joedb.table('fruits').run();
    joedb.table('fruits').run();
    joedb.table('fruits').run();
    joedb.table('fruits').run();
    let result = await joedb.table('fruits').get('apple').run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Apple',
        color: 'Red',
        id: 'apple',
        size: 'Medium'
      }
    ]);
  });

  it('queries a table', async () => {
    let result = await joedb.table('fruits').run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Apple',
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
        fruit: 'Peach',
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

  it('gets a record by id', async () => {
    let result = await joedb.table('fruits').get('apple').run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Apple',
        color: 'Red',
        id: 'apple',
        size: 'Medium'
      }
    ]);
  });

  it('selects certain fields', async () => {
    let result = await joedb.table('fruits').fields(['fruit', 'size']).run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
        fruit: 'Apple',
        size: 'Medium'
      },
      {
        fruit: 'Cherry',
        size: 'Small'
      },
      {
        fruit: 'Peach',
        size: 'Medium'
      },
      {
        fruit: 'Watermelon',
        size: 'Large'
      }
    ]);
  });

  it('selects certain fields with other names', async () => {
    let result = await joedb.table('fruits').fields({fruit: 'name', id: 'key'}).run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
        name: 'Apple',
        key: 'apple'
      },
      {
        name: 'Cherry',
        key: 'cherry'
      },
      {
        name: 'Peach',
        key: 'peach'
      },
      {
        name: 'Watermelon',
        key: 'watermelon'
      }
    ]);
  });

  it('orders results', async () => {
    let result = await joedb.table('fruits').fields(['fruit']).order('fruit').run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      { fruit: 'Apple' },
      { fruit: 'Cherry' },
      { fruit: 'Peach' },
      { fruit: 'Watermelon' }
    ]);
  });

  it('orders results desc', async () => {
    let result = await joedb.table('fruits').fields(['fruit']).order({'fruit':'desc'}).run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      { fruit: 'Watermelon' },
      { fruit: 'Peach' },
      { fruit: 'Cherry' },
      { fruit: 'Apple' }
    ]);
  });

  it('limits results', async () => {
    let result = await joedb.table('fruits').fields(['id']).limit(2).run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      { id: 'apple' },
      { id: 'cherry' }
    ]);
  });

  it('selects nested fields', async () => {
    await resetCars(joedb);
    let result = await joedb.table('cars').fields({type: true, about: {'model': true, engine: {plugin: true}}}).run();
    requestTime(result);
    expect(result['rows']).to.deep.equal([
      {
          type: 'Sedan',
          about: {
              model: 'Prius',
              engine: {
                  plugin: false
              }
          }
      },
      {
          type: 'Sedan',
          about: {
              model: 'Model 3',
              engine: {
                  plugin: true
              }
          }
      },
      {
          type: 'Minivan',
          about: {
              model: 'Pacifica',
              engine: {
                  plugin: true
              }
          }
      },
      {
          type: 'SUV',
          about: {
              model: 'Telluride',
              engine: {
                  plugin: false
              }
          }
      },
      {
          type: 'SUV',
          about: {
              model: 'Suburban',
              engine: {
                  plugin: false
              }
          }
      }
    ]);
  });

  describe('Filtering', () => {
    it('filters on one condition', async () => {
      let result = await joedb.table('fruits').filter({size: 'Medium'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          fruit: 'Apple',
          color: 'Red',
          id: 'apple',
          size: 'Medium'
        },
        {
          fruit: 'Peach',
          color: 'Orange',
          id: 'peach',
          size: 'Medium'
        }
      ]);
    });

    it('filters on two conditions', async () => {
      let result = await joedb.table('fruits').filter({size: 'Medium', color: 'Orange'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          fruit: 'Peach',
          color: 'Orange',
          id: 'peach',
          size: 'Medium'
        }
      ]);
    });

    it('filters on two similar conditions', async () => {
      let result = await joedb.table('fruits').fields(['id'])
        .filter([{'size CONTAINS': 'a'}, {'size CONTAINS': 'e'}])
        .run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        { id: 'watermelon' }
      ]);
    });

    it('filters on two or conditions', async () => {
      let result = await joedb.table('fruits').fields(['id'])
        .filter(JoeDB.Or({color: 'Orange'}, {color: 'Green'})).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        { id: 'peach' },
        { id: 'watermelon' }
      ]);
    });

    it('filters on three or conditions', async () => {
      let result = await joedb.table('fruits').fields(['id'])
        .filter(JoeDB.Or({color: 'Orange'}, {color: 'Green'}, {size: 'Medium'})).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        { id: 'apple' },
        { id: 'peach' },
        { id: 'watermelon' }
      ]);
    });

    it('filters on complex conditions', async () => {
      let result = await joedb.table('fruits').fields(['id'])
        .filter([
          JoeDB.Or({size: 'Medium'}, {size: 'Small'}),
          JoeDB.Or({color: 'Orange'}, {color: 'Red'}),
          {'fruit CONTAINS': 'a'}
        ]).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        { id: 'apple' },
        { id: 'peach' }
      ]);
    });

    it('filters on fields by does not equal', async () => {
      let result = await joedb.table('fruits').filter({'size !=': 'Medium'}).run();
      requestTime(result);
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

    it('filters on fields by case insensitve equals', async () => {
      let result = await joedb.table('fruits').filter({'fruit LIKE': 'APPLE'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          fruit: 'Apple',
          color: 'Red',
          id: 'apple',
          size: 'Medium'
        }
      ]);
    });

    it('filters on fields with regexps', async () => {
      let result = await joedb.table('fruits').filter({'size =~': '^M(.*)m$'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          fruit: 'Apple',
          color: 'Red',
          id: 'apple',
          size: 'Medium'
        },
        {
          fruit: 'Peach',
          color: 'Orange',
          id: 'peach',
          size: 'Medium'
        }
      ]);
    });

    it('filters on boolean values', async () => {
      await resetCars(joedb);
      let result = await joedb.table('cars').filter({american: true}).fields({id: true}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'model3'
        },
        {
          id: 'pacifica'
        },
        {
          id: 'suburban'
        }
      ]);
    });

    it('filters on numeric values', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({published: 1605}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'donquixote',
          author: 'Miguel de Cervantes',
          name: 'Don Quixote',
          published: 1605,
          millionssold: 500.12
        }
      ]);
    });

    it('filters on greater than', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'published >': 1812}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'lotr',
          author: 'J. R. R. Tolkien',
          name: 'The Lord of the Rings',
          published: 1954,
          millionssold: 150.7
        }
      ]);
    });

    it('filters on greater than or equal to', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'published >=': 1812}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'lotr',
          author: 'J. R. R. Tolkien',
          name: 'The Lord of the Rings',
          published: 1954,
          millionssold: 150.7
        },
        {
          id: 'grimmsfairytales',
          author: 'Jacob and Wilhelm Grimm',
          name: "Grimms' Fairy Tales",
          published: 1812,
          millionssold: 135.37
        }
      ]);
    });

    it('filters on less than', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'published <': 1678}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'donquixote',
          author: 'Miguel de Cervantes',
          name: 'Don Quixote',
          published: 1605,
          millionssold: 500.12
        }
      ]);
    });

    it('filters on less than or equal to', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'published <=': 1678}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'pilgrimsprogress',
          author: 'Paul Bunyan',
          name: "The Pilgim's Progress",
          published: 1678,
          millionssold: 250.5
        },
        {
          id: 'donquixote',
          author: 'Miguel de Cervantes',
          name: 'Don Quixote',
          published: 1605,
          millionssold: 500.12
        }
      ]);
    });

    it('filters in a range', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter([{'published >': 1700}, {'published <': 1900}]).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'grimmsfairytales',
          author: 'Jacob and Wilhelm Grimm',
          name: "Grimms' Fairy Tales",
          published: 1812,
          millionssold: 135.37
        }
      ]);
    });

    it('filters on floating points', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'millionssold >': 250.5}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'donquixote',
          author: 'Miguel de Cervantes',
          name: 'Don Quixote',
          published: 1605,
          millionssold: 500.12
        }
      ]);
    });

    it('filters on floating points', async () => {
      await resetBooks(joedb);
      let result = await joedb.table('books').filter({'millionssold >=': 250.5}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          id: 'pilgrimsprogress',
          author: 'Paul Bunyan',
          name: "The Pilgim's Progress",
          published: 1678,
          millionssold: 250.5
        },
        {
          id: 'donquixote',
          author: 'Miguel de Cervantes',
          name: 'Don Quixote',
          published: 1605,
          millionssold: 500.12
        }
      ]);
    });

    it('filters multiple times', async () => {
      let result = await joedb.table('fruits').filter({size: 'Medium'}).filter({color: 'Red'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
        {
          fruit: 'Apple',
          color: 'Red',
          id: 'apple',
          size: 'Medium'
        }
      ]);
    });

    it('filters nested properties', async () => {
      await resetCars(joedb);
      let result = await joedb.table('cars').filter({about: {engine: {type: 'Hybrid'}}}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([
          {
            id: 'prius',
            type: 'Sedan',
            american: false,
            about: {
                make: 'Toyota',
                model: 'Prius',
                engine: {
                    plugin: false,
                    type: 'Hybrid'
                }
            }
        },
        {
          id: 'pacifica',
          type: 'Minivan',
          american: true,
          about: {
              make: 'Chrysler',
              model: 'Pacifica',
              engine: {
                  plugin: true,
                  type: 'Hybrid'
              }
          }
        }
      ]);
    });

    it('filters out rows without a given property', async () => {
      await resetCars(joedb);
      var result = await joedb.table('cars').filter({about: {size: 'Large'}}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([]);
      result = await joedb.table('cars').filter({make: 'Hyundai'}).run();
      requestTime(result);
      expect(result['rows']).to.deep.equal([]);
    });
  });

  describe('Including', async () => {
    before(async () => {
      await joedb.createTable('meals').run();
      await joedb.table('meals').insert([
        {id: 'Breakfast', entree: 'Cereal', side: 'apple', dessert: 'cherry'},
        {id: 'Lunch', entree: 'Sandwhich', side: 'peach', dessert: 'peach'}
      ]).run();
    });
    after(async () => await joedb.dropTable('meals').run());

    it('includes a get all request', async () => {
      let results = await joedb.table('meals').include({side: 'fruits'}).run();
      requestTime(results);
      expect(results['rows']).to.deep.equal([
        {
          id: 'Breakfast',
          entree: 'Cereal',
          dessert: 'cherry',
          side: {
            fruit: 'Apple',
            color: 'Red',
            id: 'apple',
            size: 'Medium'
          }
        },
        {
          id: 'Lunch',
          entree: 'Sandwhich',
          dessert: 'peach',
          side: {
            fruit: 'Peach',
            color: 'Orange',
            id: 'peach',
            size: 'Medium'
          }
        }
      ]);
    });

    it('includes on single get requests', async () => {
      let results = await joedb.table('meals').include({side: 'fruits'}).get('Breakfast').run();
      requestTime(results);
      expect(results['rows']).to.deep.equal([
        {
          id: 'Breakfast',
          entree: 'Cereal',
          dessert: 'cherry',
          side: {
            fruit: 'Apple',
            color: 'Red',
            id: 'apple',
            size: 'Medium'
          }
        }
      ]);
    });

    it('includes multiple fields', async () => {
      let results = await joedb.table('meals').include({dessert: 'fruits'}).include({side: 'fruits'}).run();
      requestTime(results);
      expect(results['rows']).to.deep.equal([
        {
          id: 'Breakfast',
          entree: 'Cereal',
          dessert: {
            fruit: 'Cherry',
            color: 'Red',
            id: 'cherry',
            size: 'Small'
          },
          side: {
            fruit: 'Apple',
            color: 'Red',
            id: 'apple',
            size: 'Medium'
          }
        },
        {
          id: 'Lunch',
          entree: 'Sandwhich',
          dessert: {
            fruit: 'Peach',
            color: 'Orange',
            id: 'peach',
            size: 'Medium'
          },
          side: {
            fruit: 'Peach',
            color: 'Orange',
            id: 'peach',
            size: 'Medium'
          }
        }
      ]);
    });

    it('filters on included fields', async () => {
      let results = await joedb.table('meals').include({side: 'fruits'}).filter({side: {color: 'Red'}}).run();
      requestTime(results);
      expect(results['rows']).to.deep.equal([
        {
          id: 'Breakfast',
          entree: 'Cereal',
          dessert: 'cherry',
          side: {
            fruit: 'Apple',
            color: 'Red',
            id: 'apple',
            size: 'Medium'
          }
        }
      ]);
    });

    it('includes array values', async () => {
      await resetFruit(joedb);
      await joedb.table('meals').insert({id: 'a', foods: ['apple', 'cherry']}).run();
      let results = await joedb.table('meals').include({foods: 'fruits'}).get('a').run();
      requestTime(results);
      expect(results['rows']).to.deep.equal([
        {
          id: 'a',
          foods: [
            {
              fruit: 'Apple',
              color: 'Red',
              id: 'apple',
              size: 'Medium'
            },
            {
              fruit: 'Cherry',
              color: 'Red',
              id: 'cherry',
              size: 'Small'
            }
          ]
        }
      ]);
    });
  });
});
