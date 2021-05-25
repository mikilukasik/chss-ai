const fs = require('fs');
const path = require('path');
const brain = require('brain.js');

const folder = 'puzzles-2021-05-24T11:16:42.158Z';
const iterations = 20000;
const logPeriod = 2;

const lessonNames = [
  'all',
  'opening',
  'endgame-losing',
  'endgame-winning',
  'endgame-equal',
  'midgame-losing',
  'midgame-winning',
  'midgame-equal',
];

const types = [
  'pieces',
  'cells',
];

const sourceDir = `../data/to-learn/${folder}/`;
const destinationDir = path.resolve(`data/results/${folder}-${iterations}/`);

if (fs.existsSync(destinationDir)) throw new Error('Destination folder already exists.');
fs.mkdirSync(destinationDir);

types.forEach((type) => lessonNames.forEach((lessonName) => {
  const lesson = require(`${sourceDir}/${lessonName}-${type}.json`)
  const network = new brain.NeuralNetwork();
  
  let started = Date.now();
  let lastLog;

  network.train(lesson, { log: ({ error, iterations: _i }) => {
    const elapsed = Date.now() - started;
    const msPerIteration = elapsed / _i;
    const remainingIterations = iterations - _i;
    const remainingHours = (msPerIteration * remainingIterations / 1000 / 60 / 60).toFixed(2);
  
    lastLog = { error, completed: `${_i} / ${iterations}`, remainingHours, lessonName, type };
    console.log(lastLog);
  }, logPeriod, iterations });
  
  fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-${type}.js`), network.toFunction().toString(), 'utf8');
  fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-${type}.json`), JSON.stringify(network.toJSON()), 'utf8');
  fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-${type}-meta.json`), JSON.stringify({ lastLog }, null, 2), 'utf8');
}));
