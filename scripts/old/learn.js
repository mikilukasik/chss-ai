const fs = require('fs');
const brain = require('brain.js');
const inputs = require('../data/to-learn/learn-this-1621638148049.json');

const lesson = inputs.map(i => ({ output: [i.pop()], input: i }));

const network = new brain.NeuralNetwork();
network.train(lesson, { log: true, logPeriod: 2 });

fs.writeFileSync('./chss-ai.js', network.toFunction().toString(), 'utf8');
fs.writeFileSync('./chss-ai2.json', JSON.stringify(network.toJSON()), 'utf8');
