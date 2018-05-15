/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const path = require('path');
const program = require('commander');
const uuid = require('node-uuid');

const StdOutOutput = require('../lib/output/stdout');

program
  .option('-c, --count <count>', 'Total record count')
  .option('-f, --fxa [filename]', 'FxA CSV')
  .option('-s, --salesforce [filename]', 'Salesforce CSV')
  .option('--pc [percentage]', '% of accounts that need to be created on Salesforce, defaults to 10%')
  .option('--pu [percentage]', '% of accounts that need to be updated on Salesforce, defaults to 5%')
  .option('--pd [percentage]', '% of accounts that need to be deleted on Salesforce, defaults to 10%');

program.parse(process.argv);

const count = parseInt(program.count);
const percentCreate = parseInt(program.pc || '10');
const percentUpdate = parseInt(program.pu || '5');
const percentDelete = parseInt(program.pd || '10');

const fxaWriter = createFxaWriter(program);
const salesforceWriter = createSalesforceWriter(program);
generate(count, percentCreate, percentDelete, percentUpdate, fxaWriter, salesforceWriter)
  .then((counts) => {
    let total = counts.both + counts.create + counts.update + counts.delete;
    counts.total = total;
    console.log('Counts:\n', JSON.stringify(counts, null, 2));
  });

async function generate(count, percentCreate, percentDelete, percentUpdate, fxaStream, salesforceStream) {
  const deleteMax = percentCreate + percentDelete;
  const changeMax = deleteMax + percentUpdate;
  const counts = {
    create: 0,
    update: 0,
    delete: 0,
    both: 0,
  };

  for (let i = 0; i < count; ++i) {
    const uid = uuid.v4().replace(/-/g, '');
    const number = Math.floor(Math.random() * 100);

    if (number < percentCreate) {
      // Creates only exist in FxA database.
      await write(fxaStream, `${uid},${uid}@fxa.com,en\n`);
      counts.create++;
    } else if (number < deleteMax) {
      // Deletes only exist in Salesforce database.
      await write(salesforceStream, `${uid},${uid}@salesforce.com\n`);
      counts.delete++;
    } else if (number < changeMax) {
      // Changes exist in both DBs, use FxA as canonical source.
      await write(fxaStream, `${uid},${uid}@changed.com,en\n`);
      await write(salesforceStream, `${uid},${uid}@original.com\n`);
      counts.update++;
    } else {
      // Entry exists in both DBs
      await write(fxaStream, `${uid},${uid}@same.com,en\n`);
      await write(salesforceStream, `${uid},${uid}@same.com\n`);
      counts.both++;
    }
  }

  return counts;
}

function write(outputStream, contents) {
  return new Promise((resolve, reject) => {
    const ok = outputStream.write(contents);

    if (! ok) {
      outputStream.once('drain', () => resolve());
    } else {
      resolve();
    }
  });
}

function createFxaWriter (program) {
  if (! program.fxa) {
    return new StdOutOutput('fxa       : ', '\n');
  } else {
    const outputPath = path.resolve(process.cwd(), program.fxa);
    return fs.createWriteStream(outputPath);
  }
}
function createSalesforceWriter (program) {
  if (! program.salesforce) {
    return new StdOutOutput('salesforce: ', '\n');
  } else {
    const outputPath = path.resolve(process.cwd(), program.salesforce);
    return fs.createWriteStream(outputPath);
  }
}