const fs = require('fs');
const path = require('path');
const brain = require('brain.js');
const StreamArray = require( 'stream-json/streamers/StreamArray');

const lessonType = 'eng_2500+_0-120_chkmt-mix';
const iterations = 25000;
const logPeriod = 2;

const lessonNames = [
  'tables2valuesMix',
];

const sourceDir = `lessons/${lessonType}`;
const destinationDir = path.resolve(`results/${lessonType}-GPU-i${iterations}/`);

if (fs.existsSync(destinationDir)) throw new Error('Destination lessonType already exists.');
fs.mkdirSync(destinationDir);

lessonNames.forEach((lessonName) => {
  const lesson = [];
  let learning = false;
  const learn = () => {
    if (learning) return;
    learning = true;

    const network = new brain.NeuralNetworkGPU();
    console.log(lesson.length, lesson[0]);
    let started = Date.now();
    let lastLog = { lessonType, lessonName, iterations, sampleSize: lesson.length };

    const trainingResult = network.train(lesson, { log: ({ error, iterations: _i }) => {
      const elapsed = Date.now() - started;
      const msPerIteration = elapsed / _i;
      const speed = `${(60 * 60 * 1000 / msPerIteration).toFixed(1)}/h`;
      const remainingIterations = iterations - _i;
      const remainingHours = (msPerIteration * remainingIterations / 1000 / 60 / 60).toFixed(2);
      
    
      lastLog = {...lastLog, lessonType, lessonName, error, iterations, speed, sampleSize: lesson.length };
      console.log({ lessonName, error, sampleSize: lesson.length, completed: `${_i} / ${iterations}`, speed, remainingHours });
    }, logPeriod, iterations, errorThresh: 0.0005 });

    lastLog = {...lastLog, trainingResult };
    
    fs.writeFileSync(path.resolve(destinationDir, `${lessonName}.json`), JSON.stringify(network.toJSON()), 'utf8');
    fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-meta.json`), JSON.stringify({ lastLog }, null, 2), 'utf8');
    // fs.writeFileSync(path.resolve(destinationDir, `${lessonName}.js`), network.toFunction().toString(), 'utf8');
    // fs.writeFileSync(path.resolve(destinationDir, `${lessonName}-with-meta.js`), `${network.toFunction().toString()}\n\n/*\n${JSON.stringify(lastLog, null, 2)}\n*/`, 'utf8');
  };



  const jsonStream = StreamArray.withParser();
  fs.createReadStream(`${sourceDir}/${lessonName}.json`).pipe(jsonStream.input);

  jsonStream.on('data', ({ key, value }) => {
    if (key % 100000 === 0) console.log(`${key} lines loaded`)
    if (key > 4000000) {
      jsonStream.destroy();
      return learn();
    }
    lesson[key] = value;
  });

  jsonStream.on('end', learn);
});
