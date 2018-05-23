/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require('events');
const readline = require('n-readlines');

const MESSAGES = {
  primaryEmailChanged: 'update',
  verified: 'create',
  delete: 'delete',
};

class JSONReader extends EventEmitter {
  constructor (jsonInputPath) {
    super();

    this.jsonInputPath = jsonInputPath;
  }

  run () {
    const jsonLineReader = new readline(this.jsonInputPath);

    const counts = {
      create: 0,
      update: 0,
      delete: 0,
      lines: 0
    };

    let line = jsonLineReader.next();
    while (line) {
      counts.lines++;

      const item = JSON.parse(line);
      const eventName = item.event;
      if (item.createDate) {
        item.createDate = this._normalizeJSONDate(item.createDate);
      }

      if (item.timestamp) {
        item.timestamp = this._normalizeJSONDate(item.timestamp);
      }

      this.emit(MESSAGES[item.event], item);

      counts[MESSAGES[eventName]]++;
      line = jsonLineReader.next();
    }

    this.emit('complete', counts);
  }

  _normalizeJSONDate (iso8601Date) {
    return new Date(iso8601Date);
  }
}

 module.exports = JSONReader;
