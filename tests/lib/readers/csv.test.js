const path = require('path');
const CSVReader = require('../../../lib/readers/csv');

let csvReader;
let counts;

beforeEach(() => {
  csvReader = new CSVReader(
    path.join(__dirname, '..', '..', '..', 'test_data', 'fxa_sorted.csv'),
    path.join(__dirname, '..', '..', '..', 'test_data', 'salesforce_sorted.csv'),
    ','
  );

  counts = {
    create: 0,
    update: 0,
    delete: 0,
  };
});

test('emits the expected number of events', () => {
  return new Promise((resolve, reject) => {
    csvReader.on('complete', (completeCounts) => {
      resolve((() => {
        // Counts came from the data generator.
        expect(counts.create).toBe(1087);
        expect(completeCounts.create).toBe(1087);

        expect(counts.update).toBe(72);
        expect(completeCounts.update).toBe(72);

        expect(counts.delete).toBe(46);
        expect(completeCounts.delete).toBe(46);

        expect(completeCounts.ignore).toBe(2795);
      })());
    });

    csvReader.on('create', () => counts.create++);
    csvReader.on('update', () => counts.update++);
    csvReader.on('delete', () => counts.delete++);

    csvReader.run();
  });
});


test('_splitLineBuffer, splits, trims', () => {
  const buffer = new Buffer('  uid,  email ,locale  ,createDate   ');
  expect(csvReader._splitLineBuffer(buffer)).toEqual([
    'uid',
    'email',
    'locale',
    'createDate'
  ]);
});

test('_splitLineBuffer returns ["zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"] if no buffer', () => {
  expect(csvReader._splitLineBuffer()).toEqual([
    'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
  ]);
});
