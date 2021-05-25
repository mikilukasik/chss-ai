const fs = require('fs');
const brain = require('brain.js');
const lesson = require('../../data/to-learn/learn-these-pieces-1621742162924.json')

const network = new brain.NeuralNetwork();
network.train(lesson, { log: true, logPeriod: 2 });

fs.writeFileSync('./chss-ai-pieces.js', network.toFunction().toString(), 'utf8');
fs.writeFileSync('./chss-ai-pieces.json', JSON.stringify(network.toJSON()), 'utf8');
