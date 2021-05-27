const fs = require('fs');
const path = require('path');
const brain = require('brain.js');
const StreamArray = require( 'stream-json/streamers/StreamArray');

const lessonType = 'eng_2500+_0-120_chkmt';
const iterations = 10000;
const logPeriod = 2;

const lessonNames = [
  'tables2valuesBlack',
  'tables2valuesWhite',
];

const sourceDir = `lessons/${lessonType}/`;
const destinationDir = path.resolve(`results/${lessonType}-i${iterations}/`);

if (fs.existsSync(destinationDir)) throw new Error('Destination lessonType already exists.');
fs.mkdirSync(destinationDir);

lessonNames.forEach((lessonName) => {
  const lesson = [];
  const jsonStream = StreamArray.withParser();
  fs.createReadStream(`${sourceDir}/${lessonName}.json`).pipe(jsonStream.input);
  jsonStream.on('data', ({ key, value: { input, output }}) => {
    lesson[key] = { input, output: [output[2]] };
  });

  jsonStream.on('end', () => {
    const network = new brain.NeuralNetwork();
    console.log(lesson.length)
    let started = Date.now();
    let lastLog;

    network.train(lesson, { log: ({ error, iterations: _i }) => {
      const elapsed = Date.now() - started;
      const msPerIteration = elapsed / _i;
      const speed = `${(60 * 60 * 1000 / msPerIteration).toFixed(1)}/h`;
      const remainingIterations = iterations - _i;
      const remainingHours = (msPerIteration * remainingIterations / 1000 / 60 / 60).toFixed(2);
      
    
      lastLog = { lessonType, lessonName, error, iterations, speed };
      console.log({ lessonName, error, completed: `${_i} / ${iterations}`, speed, remainingHours });
    }, logPeriod, iterations, errorThresh: 0.0005 });
    
    fs.writeFileSync(path.resolve(destinationDir, `${lessonName}.js`), network.toFunction().toString(), 'utf8');
    fs.writeFileSync(path.resolve(destinationDir, `${lessonName}.json`), JSON.stringify(network.toJSON()), 'utf8');
    fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-meta.json`), JSON.stringify({ lastLog }, null, 2), 'utf8');
  });
});
