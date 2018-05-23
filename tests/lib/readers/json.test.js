const path = require('path');
const JSONReader = require('../../../lib/readers/json');

let jsonReader;
let counts;

beforeEach(() => {
  jsonReader = new JSONReader(
    path.join(__dirname, '..', '..', '..', 'test_data', 'commands.json')
  );

  counts = {
    create: 0,
    update: 0,
    delete: 0,
  };
});

test('emits the expected number of events', () => {
  return new Promise((resolve, reject) => {
    jsonReader.on('complete', (completeCounts) => {
      resolve((() => {
        expect(completeCounts.lines).toBe(1201);

        // Counts came from the data generator.
        expect(counts.create).toBe(1080);
        expect(completeCounts.create).toBe(1080);

        expect(counts.update).toBe(79);
        expect(completeCounts.update).toBe(79);

        expect(counts.delete).toBe(42);
        expect(completeCounts.delete).toBe(42);
      })());
    });

    jsonReader.on('create', () => counts.create++);
    jsonReader.on('update', () => counts.update++);
    jsonReader.on('delete', () => counts.delete++);

    jsonReader.run();
  });
});

