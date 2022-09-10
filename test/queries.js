const { expect } = require('chai');

const client = require('../joedb-client');
const { requestTime, resetFruit, resetCars, resetBooks } = require('./helpers.js');

describe('Queries', function() {
  var joedb;

  before(function(done) {
    client('joedb://localhost:8080').connect((conn) => {
      joedb = conn;
      done();
    });
  });

  before(async () => await resetFruit(joedb));

  after(function() {
    joedb.disconnect();
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
    let result = await joedb.table('fruits').withFields({fruit: true, size: true}).run();
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
    let result = await joedb.table('fruits').withFields({fruit: 'name', id: 'key'}).run();
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

  it('selects nested fields', async () => {
    await resetCars(joedb);
    let result = await joedb.table('cars').withFields({type: true, about: {'model': true, engine: {plugin: true}}}).run();
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
    it('filters on fields', async () => {
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

    it('filters with a function', async () => {
      let result = await joedb.table('fruits').filter({size: (size) => size == 'Medium'}).run();
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
      let result = await joedb.table('cars').filter({american: true}).withFields({id: true}).run();
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
      let result = await joedb.table('books').filter({'published >': 1700, 'published <': 1900}).run();
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

    it('includes on included records', async () => {
      await joedb.table('fruits').get('apple').update({after: 'Lunch'}).run();
      let results = await joedb.table('meals').include({side: 'fruits'}).include({side: {after: 'meals'}}).get('Breakfast').run();
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
            size: 'Medium',
            after: {
              id: 'Lunch',
              entree: 'Sandwhich',
              side: 'peach',
              dessert: 'peach'
            }
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
