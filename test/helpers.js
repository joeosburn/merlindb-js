const fruitRows =
[
  {
    id: 'apple',
    fruit: 'Apple',
    size: 'Medium',
    color: 'Red'
  },
  {
    id: 'cherry',
    fruit: 'Cherry',
    size: 'Small',
    color: 'Red'
  },
  {
    id: 'peach',
    fruit: 'Peach',
    size: 'Medium',
    color: 'Orange'
  },
  {
    id: 'watermelon',
    fruit: 'Watermelon',
    size: 'Large',
    color: 'Green'
  }
];

const carRows =
[
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
    id: 'model3',
    type: 'Sedan',
    american: true,
    about: {
      make: 'Tesla',
      model: 'Model 3',
      engine: {
        plugin: true,
        type: 'Electric'
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
  },
  {
    id: 'telluride',
    type: 'SUV',
    american: false,
    about: {
      make: 'Kia',
      model: 'Telluride',
      engine: {
        plugin: false,
        type: 'Gas'
      }
    }
  },
  {
    id: 'suburban',
    type: 'SUV',
    american: true,
    about: {
      make: 'Chevrolet',
      model: 'Suburban',
      engine: {
        plugin: false,
        type: 'Gas'
      }
    }
  }
];

const bookRows = [
  {
    id: 'pilgrimsprogress',
    author: 'Paul Bunyan',
    name: "The Pilgim's Progress",
    published: 1678,
    millionssold: 250.5
  },
  {
    id: 'lotr',
    author: 'J. R. R. Tolkien',
    name: 'The Lord of the Rings',
    published: 1954,
    millionssold: 150.7
  },
  {
    id: 'donquixote',
    author: 'Miguel de Cervantes',
    name: 'Don Quixote',
    published: 1605,
    millionssold: 500.12
  },
  {
    id: 'grimmsfairytales',
    author: 'Jacob and Wilhelm Grimm',
    name: "Grimms' Fairy Tales",
    published: 1812,
    millionssold: 135.37
  }
];

const chai = require('chai');
const chaiArrays = require('chai-arrays');
chai.use(chaiArrays);

module.exports.resetBooks = async (merlindb) => {
  await merlindb.createTable('books').run();
  await merlindb.table('books').destroy().run();
  await merlindb.table('books').insert(bookRows).run();
}

module.exports.resetCars = async (merlindb) => {
  await merlindb.createTable('cars').run();
  await merlindb.table('cars').destroy().run();
  await merlindb.table('cars').insert(carRows).run();
}

module.exports.resetFruit = async (merlindb) => {
  await merlindb.createTable('fruits').run();
  await merlindb.table('fruits').destroy().run();
  await merlindb.table('fruits').insert(fruitRows).run();
}

module.exports.requestTime = (result) => {
  console.log(`Request time was ${result['requestTime']}ms`);
}
