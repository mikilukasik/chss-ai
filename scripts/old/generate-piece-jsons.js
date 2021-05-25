const fs = require('fs');
const path = require('path');

const destFileName = path.resolve(`./data/to-learn/learn-these-pieces-${Date.now()}.json`);
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
    // let tableBalance = 0;

    const fenStr = `${line.substr(1, line.indexOf(' ') - 1)}`;
    // const resultingCellArray = [index % 2 /* 0: white's turn, 1: balck's turn */];
    const input = { next: index % 2 }

    let position = 0
    // console.log(fenStr)
    fenStr.split('').forEach((char) => {
      if (char === '/') return;
      if (Number(char)) {
        position += ~~char;
        return;
      }

      let key = char;
      let counter = 1;
      while (input[key]) key = `${char}${counter ++}`;
      
      input[key] = position / 63;

      // console.log({ input, key, position })

      position += 1;
    });

    // resultingCellArray.push(result);
    /* if (Math.abs(tableBalance) <= 2) */ fs.appendFileSync(destFileName, `  ${JSON.stringify({ input, output: [result] })}${(fileIndex < fileArray.length - 1 || index < moveLines.length - 1) ? ',\n' : '\n'}`, 'utf-8');
    // process.exit()
    
  
  });

  
  // console.log(JSON.stringify(moveLines, null, 2))

  // process.exit(0)

});

fs.appendFileSync(destFileName, `]\n`, 'utf-8');
