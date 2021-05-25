const fs = require('fs');
const path = require('path');

const destFileName = path.resolve(`./data/to-learn/learn-these-cells-${Date.now()}.json`);
fs.writeFileSync(destFileName, '[\n', 'utf-8');

const folder = path.resolve('./data/html2');
fs.readdirSync(folder).forEach((_fileName, fileIndex, fileArray) => {
  const fileName = path.resolve(folder, _fileName);

  const stringContent = fs.readFileSync(fileName, 'utf-8');
  const lines = stringContent.split('\n');

  const resultStr = lines.find(line => line.startsWith(`<br><class="VH">`)).substr(16);
  let result;
  switch (resultStr) {
    case '1-0':
      result = 1;
      break;

    case '0-1':
      result = 0;
      break;
    
    case '=-=':
      result = 0.5
      break;

    default:
      console.warn(`no result in html ${fileName}`, { resultStr });
      return;
  }

  const firstMoveLineIndex = lines.findIndex(line => line === 'movesArray = new Array(') + 1;
  const lastMoveLineIndex = lines.findIndex(line => line === 'var current = 0;');

  const moveLines = lines.slice(firstMoveLineIndex, lastMoveLineIndex).map((line, index) => ({ line, index })).slice(-50);
  // .slice(-20) // keep the last 20 steps only, much less noise

  moveLines.forEach(({ line, index }) => {
    let tableBalance = 0;

    const fenStr = `${line.substr(1, line.indexOf(' ') - 1)}`;
    const resultingArray = [index % 2 /* 0: white's turn, 1: balck's turn */];
    fenStr.split('').forEach((char) => {
      switch(char) {
        case 'r': 
          resultingArray.push(0.1);
          tableBalance += 5;
          return;
        case 'n': 
          resultingArray.push(0.15);
          tableBalance += 3;
          return;
        case 'b': 
          resultingArray.push(0.2);
          tableBalance += 3;
          return;
        case 'q': 
          resultingArray.push(0.05);
          tableBalance += 9;
          return;
        case 'k': 
          resultingArray.push(0);
          return;
        case 'p': 
          resultingArray.push(0.25);
          tableBalance += 1;
          return;

        case 'R': 
          resultingArray.push(0.9);
          tableBalance -= 5;
          return;
        case 'N': 
          resultingArray.push(0.85);
          tableBalance -= 3;
          return;
        case 'B': 
          resultingArray.push(0.8);
          tableBalance -= 3;
          return;
        case 'Q': 
          resultingArray.push(0.95);
          tableBalance -= 9;
          return;
        case 'K': 
          resultingArray.push(1);
          return;
        case 'P': 
          resultingArray.push(0.75);
          tableBalance -= 1;
          return;

        case '/': return;

        default:
          resultingArray.push(...Array.from({ length: Number(char) }).map(() => 0.5));
      }
    });

    resultingArray.push(result);
    if (Math.abs(tableBalance) <= 2) fs.appendFileSync(destFileName, `  ${JSON.stringify(resultingArray)}${(fileIndex < fileArray.length - 1 || index < moveLines.length - 1) ? ',\n' : '\n'}`, 'utf-8');
  });

  
  // console.log(JSON.stringify(moveLines, null, 2))

  // process.exit(0)

});

fs.appendFileSync(destFileName, `]\n`, 'utf-8');
