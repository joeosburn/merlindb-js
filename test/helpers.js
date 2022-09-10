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

module.exports.resetBooks = async (joedb) => {
  await joedb.createTable('books').run();
  await joedb.table('books').destroy().run();
  await joedb.table('books').insert(bookRows).run();
}

module.exports.resetCars = async (joedb) => {
  await joedb.createTable('cars').run();
  await joedb.table('cars').destroy().run();
  await joedb.table('cars').insert(carRows).run();
}

module.exports.resetFruit = async (joedb) => {
  await joedb.createTable('fruits').run();
  await joedb.table('fruits').destroy().run();
  await joedb.table('fruits').insert(fruitRows).run();
}

module.exports.requestTime = (result) => {
  console.log(`Request time was ${result['requestTime']}ms`);
}
