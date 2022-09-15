const net = require('net');
const msgpack = require('msgpack-lite');
function JoeDB(url) {
  this.socket = new net.Socket();
  this.url = url;
  this.request = {};
  this.requests = [];
  this.receivedData = null;

  this.socket.on('close', () => {
    // console.log('disconnected');=
  });

  this.socket.on('data', (data) => {
    const stamp = data.readDoubleBE();
    const result = msgpack.decode(data.slice(12, data.length));
    result['requestTime'] = (currentTime() - stamp).toPrecision(2);
    this.receivedData(result);
    this.receivedData = null;
  });
}

JoeDB.prototype.table = function(tableName) {
  this.request.table = tableName;
  this.request.request = 'get';
  return this;
};

JoeDB.prototype.withFields = function(fields) {
  this.request.fields = fields;
  return this;
};

JoeDB.prototype.filter = function(filters) {
  this.request.filters = { ...(this.request.filters || {}), ...filters };
  return this;
};

JoeDB.prototype.include = function(includes) {
  this.request.includes = this.request.includes || [];
  this.request.includes.push(includes);
  return this;
};

JoeDB.prototype.get = function(id) {
  this.request.request = 'get';
  this.request.id = id;
  return this;
};

JoeDB.prototype.insert = function(rows) {
  this.request.request = 'insert';
  this.request.rows = Array.isArray(rows) ? rows : Array.of(rows);
  return this;
};

JoeDB.prototype.destroy = function() {
  this.request.request = 'destroy';
  return this;
};

JoeDB.prototype.update = function(data) {
  this.request.request = 'update';
  this.request.data = data;
  return this;
};

JoeDB.prototype.replace = function(data) {
  this.request.request = 'replace';
  this.request.data = data;
  return this;
};

JoeDB.prototype.listTables = function () {
  this.request.request = 'listTables';
  return this;
};

JoeDB.prototype.createTable = function(tableName) {
  this.request.request = 'createTable';
  this.request.tableName = tableName;
  return this;
};

JoeDB.prototype.dropTable = function(tableName) {
  this.request.request = 'dropTable';
  this.request.tableName = tableName;
  return this;
};

JoeDB.prototype.as = function(requestName) {
  this.request.requestName = requestName;
  return this;
}

JoeDB.prototype.queue = function() {
  this.requests.push(this.request);
  this.request = {};
  return this;
}

JoeDB.prototype.run = function(opts = {}, cb) {
  let message = this.request;

  if (this.requests.length) {
    this.queue();
    message = {
      "requests": this.requests
    };
  }

  var messageStr = msgpack.encode(message);
  this.socket.write(requestHeader(messageStr));
  this.socket.write(messageStr);

  if (cb) {
    this.receivedData = (result) => {
      this.request = {};
      cb(result);
    };
  } else {
    return (new Promise((resolve, reject) => {
      this.receivedData = (result) => {
        this.request = {};
        this.requests = [];
        resolve(result);
      };
    }));
  }
};

JoeDB.prototype.connect = function() {
  const urlMatches = this.url.match(/joedb\:\/\/([^\:]+)\:(\d+)/);
  this.socket.connect(parseInt(urlMatches[2], 10), urlMatches[1], function() {
    return new Promise((resolve, reject) => resolve());
  });
}

JoeDB.prototype.disconnect = function() {
  this.socket.destroy();
};

function currentTime() {
  var hrtime = process.hrtime();
  return (hrtime[0] * 1000000 + hrtime[1] / 1000 ) / 1000;
}

function requestHeader(request) {
  const header = Buffer.allocUnsafe(14);
  header.writeUInt8(1);
  header.writeUInt32BE(request.length, 1);
  header.writeDoubleBE(currentTime(), 5);
  header.writeUInt8(30, 13);
  return header;
}

module.exports = JoeDB;
