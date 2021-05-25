const fs = require('fs');
const path = require('path');

const folderName = 'html-engines-checkmate-2700+';

const sourceDir = path.resolve(`data/${folderName}/`);
const destinationDir = path.resolve(`lessons/${folderName}/`);

if (fs.existsSync(destinationDir)) throw new Error('Destination folder already exists.');
fs.mkdirSync(destinationDir);

const destFileNameWhite = path.resolve(destinationDir, 'tables2valuesWhite.json');
fs.writeFileSync(destFileNameWhite, '[\n', 'utf-8');

const destFileNameBlack = path.resolve(destinationDir, 'tables2valuesBlack.json');
fs.writeFileSync(destFileNameBlack, '[\n', 'utf-8');

const destFilesUsed = {};

let lastLoggedAt = 0;
fs.readdirSync(sourceDir).forEach((_fileName, fileIndex, fileArray) => {
  const now = Date.now();
  if (lastLoggedAt < now - 10000) {
    lastLoggedAt = now;
    console.log(`${fileIndex} of ${fileArray.length} files processed.`)
  }

  // if (fileIndex > 20) process.exit(0)

  const sourceFileName = path.resolve(sourceDir, _fileName);
  const stringContent = fs.readFileSync(sourceFileName, 'utf-8');
  const lines = stringContent.split('\n');

  const resultStr = lines.find(line => line.startsWith(`<br><class="VH">`)).substr(16);
  let result;
  switch (resultStr) {
    case '1-0':
      result = 0.5;
      break;

    case '0-1':
      result = -0.5;
      break;
    
    case '=-=':
      result = 0;
      break;

    default:
      console.warn(`no result in html ${fileName}`, { resultStr });
      return;
  }

  const firstMoveLineIndex = lines.findIndex(line => line === 'movesArray = new Array(') + 1;
  const lastMoveLineIndex = lines.findIndex(line => line === 'var current = 0;');

  const moveLines = lines.slice(firstMoveLineIndex, lastMoveLineIndex); //.map((line, index) => ({ line, index })).slice(-50);
  // .slice(-20) // keep the last 20 steps only, much less noise
  const totalMoves = moveLines.length;

  for (const [moveIndex, line] of moveLines.entries()) {
    // let tableBalance = 0;

    const fenStr = `${line.substr(1, line.indexOf(' ') - 1)}`;

    if (moveIndex === 0) {
      if (fenStr !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR') {
        console.warn(`First fen is invalid in ${sourceFileName}`);
        return;
      }

      continue;
    }

    const wasWhitesMove = moveIndex % 2;
    const progress = moveIndex / (totalMoves - 1);
    const output = [result * progress + 0.5];

    const resultingArray = [];
    // const resultingArray = [index % 2 /* 0: white's turn, 1: balck's turn */];
    fenStr.split('').forEach((char) => {
      switch(char) {
        case 'p': 
          resultingArray.push(0.25);
          break;
        case 'b': 
          resultingArray.push(0.2);
          break;
        case 'n': 
          resultingArray.push(0.15);
          break;
        case 'r': 
          resultingArray.push(0.1);
          break;
        case 'q': 
          resultingArray.push(0.05);
          break;
        case 'k': 
          resultingArray.push(0);
          break;
        
        case 'P': 
          resultingArray.push(0.75);
          break;
        case 'B': 
          resultingArray.push(0.8);
          break;
        case 'N': 
          resultingArray.push(0.85);
          break;
        case 'R': 
          resultingArray.push(0.9);
          break;
        case 'Q': 
          resultingArray.push(0.95);
          break;
        case 'K': 
          resultingArray.push(1);
          break;
        
        case '/': break;

        default:
          resultingArray.push(...Array.from({ length: Number(char) }).map(() => 0.5));
      }
    });

    if (wasWhitesMove) {
      if (destFilesUsed.white) fs.appendFileSync(destFileNameWhite, ',\n', 'utf8');
      destFilesUsed.white = true;

      fs.appendFileSync(destFileNameWhite, `  ${JSON.stringify({ input: resultingArray, output })}`, 'utf-8');
      continue;
    }

    if (destFilesUsed.black) fs.appendFileSync(destFileNameBlack, ',\n', 'utf8');
    destFilesUsed.black = true;

    fs.appendFileSync(destFileNameBlack, `  ${JSON.stringify({ input: resultingArray, output })}`, 'utf-8');
  };
});

fs.appendFileSync(destFileNameWhite, `]\n`, 'utf-8');
fs.appendFileSync(destFileNameBlack, `]\n`, 'utf-8');
