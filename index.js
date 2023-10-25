const net = require('net');
const msgpack = require('msgpack-lite');

function MerlinDB(url) {
  this.socket = new net.Socket();
  this.url = url;
  this.request = {};
  this.requests = [];
  this.incomingBuffer = Buffer.alloc(0);

  this.handlers = {};
  this.handler = 0;

  this.socket.on('close', () => {
    // console.log('disconnected');=
  });

  this.socket.on('data', (data) => {
    this.incomingBuffer = Buffer.concat([this.incomingBuffer, data]);

    while (this.incomingBuffer.length >= 12) {
      const messageSize = this.incomingBuffer.readUint32LE(8);
      const totalSize = 12 + messageSize;

      if (this.incomingBuffer.length < totalSize) {
        return;
      }

      const handlerNumber = this.incomingBuffer.readDoubleLE();
      const timestamp = this.handlers[handlerNumber].timestamp;
      let requestTime = (currentTime() - timestamp).toPrecision(2);

      const response = this.incomingBuffer.subarray(12, totalSize);

      if (this.incomingBuffer.length > totalSize) {
        this.incomingBuffer = this.incomingBuffer.subarray(totalSize);
      } else {
        this.incomingBuffer = Buffer.alloc(0);
      }

      const result = msgpack.decode(response);
      result['requestTime'] = requestTime;
      this.handlers[handlerNumber].cb(result);
    }
  });
}

MerlinDB.prototype.table = function(tableName) {
  this.request.table = tableName;
  this.request.request = 'get';
  return this;
};

MerlinDB.prototype.fields = function(fields) {
  if (Array.isArray(fields)) {
    fields = Object.fromEntries(fields.map(name => [name, true]));
  }

  this.request.fields = fields;
  return this;
};

MerlinDB.prototype.filter = function(filters) {
  filters = prepareFilter(filters);

  if (this.request.filters) {
    if (!Array.isArray(this.request.filters)) {
      this.request.filters = [this.request.filters];
    }

    this.request.filters.push(filters);
  } else {
    this.request.filters = filters;
  }

  return this;
};

MerlinDB.prototype.include = function(includes) {
  this.request.includes = this.request.includes || [];
  this.request.includes.push(includes);
  return this;
};

MerlinDB.prototype.get = function(id) {
  this.request.request = 'get';
  this.request.id = id;
  return this;
};

MerlinDB.prototype.count = function() {
  this.request.request = 'count';
  return this;
}

MerlinDB.prototype.order = function(order) {
  this.request.order = this.request.order || [];

  if (typeof order === 'string') {
    this.request.order.push({[order]: true});
  } else {
    this.request.order.push(order);
  }

  return this;
}

MerlinDB.prototype.limit = function(limit) {
  this.request.limit = limit;
  return this;
}

MerlinDB.prototype.insert = function(rows) {
  this.request.request = 'insert';
  this.request.rows = Array.isArray(rows) ? rows : Array.of(rows);
  return this;
};

MerlinDB.prototype.destroy = function() {
  this.request.request = 'destroy';
  return this;
};

MerlinDB.prototype.update = function(data) {
  this.request.request = 'update';
  this.request.data = data;
  return this;
};

MerlinDB.prototype.replace = function(data) {
  this.request.request = 'replace';
  this.request.data = data;
  return this;
};

MerlinDB.prototype.deleteKey = function(key) {
  this.request.request = 'deleteKey';
  this.request.key = key;
  return this;
};

MerlinDB.prototype.listTables = function () {
  this.request.request = 'listTables';
  return this;
};

MerlinDB.prototype.createTable = function(tableName, options = {}) {
  if (options.type) {
    this.request.type = options.type;
  }

  this.request.request = 'createTable';
  this.request.tableName = tableName;
  return this;
};

MerlinDB.prototype.dropTable = function(tableName) {
  this.request.request = 'dropTable';
  this.request.tableName = tableName;
  return this;
};

MerlinDB.prototype.renameTable = function(oldTableName, newTableName) {
  this.request.request = 'renameTable';
  this.request.oldTableName = oldTableName;
  this.request.newTableName = newTableName;
  return this;
};

MerlinDB.prototype.as = function(requestName) {
  this.request.requestName = requestName;
  return this;
}

MerlinDB.prototype.queue = function() {
  this.requests.push(this.request);
  this.request = {};
  return this;
}

MerlinDB.prototype.run = function(cb) {
  let message = this.request;

  if (this.requests.length) {
    this.queue();
    message = {
      "requests": this.requests
    };
  }

  this.request = {};
  this.requests = [];

  const handlerNumber = this.handler;

  this.handler++;
  if (this.handler > 1000) this.handler = 0;

  var messageStr = msgpack.encode(message);
  this.socket.write(requestHeader(messageStr, handlerNumber));
  this.socket.write(messageStr);

  if (cb) {
    this.handlers[handlerNumber] = {
      timestamp: currentTime(),
      cb: result => cb(result)
    }
  } else {
    return (new Promise((resolve, reject) => {
      this.handlers[handlerNumber] = {
        timestamp: currentTime(),
        cb: (result) => {
          resolve(result);
        }
      }
    }));
  }
};

MerlinDB.prototype.connect = function() {
  const urlMatches = this.url.match(/merlindb\:\/\/(?:([^:@]+):?([^@]+)?@)?([^:]+)\:(\d+)/);
  const username = urlMatches[1];
  const password = urlMatches[2];
  const host = urlMatches[3];
  const port = parseInt(urlMatches[4], 10);

  return (new Promise((resolve, reject) => {
    this.socket.connect(port, host, () => {
      if (username != null && password != null) {
        this.request.request = 'authenticate';
        this.request.username = username;
        this.request.password = password;

        this.run((result) => {
          if (result["status"] != "OK") {
            throw new Error('Failed to authenticate');
          }
          resolve()
        });
      } else {
        resolve();
      }
    });
  }));
}

MerlinDB.prototype.disconnect = function() {
  this.socket.destroy();
};

MerlinDB.Or = function(...filters) {
  return {__or: filters};
};

function currentTime() {
  var hrtime = process.hrtime();
  return (hrtime[0] * 1000000 + hrtime[1] / 1000 ) / 1000;
}

function requestHeader(request, stamp) {
  const header = Buffer.allocUnsafe(14);
  header.writeUInt8(1);
  header.writeUint32LE(request.length, 1);
  header.writeDoubleLE(stamp, 5);
  header.writeUInt8(30, 13);
  return header;
}

function prepareFilter(filters) {
  if (Array.isArray(filters)) {
    return filters.map((filter) => prepareFilter(filter));
  } else if (Object.getPrototypeOf(filters) === Object.prototype) {
    Object.keys(filters).forEach((key) => {
      const value = filters[key];

      if (Object.getPrototypeOf(value) === Object.prototype) {
        filters[key] = prepareFilter(value);
      } else if (Array.isArray(value)) {
        filters[key] = value.map((filter) => prepareFilter(filter));
      } else {
        const [ newKey, newValue ] = prepareFilterValue(key, value);
        delete filters[key];
        filters[newKey] = newValue;
      }
    });

    return filters;
  } else {
    return filters;
  }
}

function prepareFilterValue(key, value) {
  const keyInfo = key.split(' ');

  key = keyInfo[0];
  const operator = keyInfo[1] || '==';

  return [
    key,
    {
      __operator: operator,
      __value: value
    }
  ]
}

module.exports = MerlinDB;
