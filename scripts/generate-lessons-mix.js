const fs = require('fs');
const path = require('path');

const folderName = 'eng_2500+_0-120_chkmt';

const sourceDir = path.resolve(`data/${folderName}/`);
const destinationDir = path.resolve(`lessons/${folderName}-mix/`);

if (fs.existsSync(destinationDir)) throw new Error('Destination folder already exists.');
fs.mkdirSync(destinationDir);

const destFileName = path.resolve(destinationDir, 'tables2valuesMix.json');
fs.writeFileSync(destFileName, '[\n', 'utf-8');

// const destFileNameBlack = path.resolve(destinationDir, 'tables2valuesBlack.json');
// fs.writeFileSync(destFileNameBlack, '[\n', 'utf-8');

const destFilesUsed = {};

let lastLoggedAt = 0;
fs.readdirSync(sourceDir).forEach((_fileName, fileIndex, fileArray) => {
  const now = Date.now();
  if (lastLoggedAt < now - 10000) {
    lastLoggedAt = now;
    console.log(`${fileIndex} of ${fileArray.length} files processed.`)
  }

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
    // const projectedWinner = result + 0.5;
    const linearScore = result * progress + 0.5
    // const endGameScore = Math.pow(progress, 5) * result + 0.5;
    // const openingScore = Math.pow(progress, 0.5) * result + 0.5;
    // const midGameScore = ((progress > 0.5 ? Math.pow((progress - 0.5) * 2, 2) : Math.pow(progress * 2, 4) - (progress > 0.5 ? 0 : 1)) / 2 + 0.5) * result + 0.5;

    // const isCheckMate = progress === 1 ? projectedWinner : 0.5; // only works if all htmls have checkmate on the end

    // const output = [progress, projectedWinner, linearScore, openingScore, midGameScore, endGameScore, isCheckMate];
    const output = [linearScore];

    const resultingInputArray = [wasWhitesMove];

    // const step = 1 / 12;

    fenStr.split('').forEach((char) => {
      switch(char) {
        case 'p': 
          resultingInputArray.push(0.25);
          break;
        case 'b': 
          resultingInputArray.push(0.2);
          break;
        case 'n': 
          resultingInputArray.push(0.15);
          break;
        case 'r': 
          resultingInputArray.push(0.1);
          break;
        case 'q': 
          resultingInputArray.push(0.05);
          break;
        case 'k': 
          resultingInputArray.push(0);
          break;
        
        case 'P': 
          resultingInputArray.push(0.75);
          break;
        case 'B': 
          resultingInputArray.push(0.8);
          break;
        case 'N': 
          resultingInputArray.push(0.85);
          break;
        case 'R': 
          resultingInputArray.push(0.9);
          break;
        case 'Q': 
          resultingInputArray.push(0.95);
          break;
        case 'K': 
          resultingInputArray.push(1);
          break;
        
        case '/': break;

        default:
          resultingInputArray.push(...Array.from({ length: Number(char) }).map(() => 0.5));
      }
    });

    // if (wasWhitesMove) {
    //   if (destFilesUsed.white) fs.appendFileSync(destFileNameWhite, ',\n', 'utf8');
    //   destFilesUsed.white = true;

    //   fs.appendFileSync(destFileNameWhite, `  ${JSON.stringify({ input: resultingInputArray, output })}`, 'utf-8');
    //   continue;
    // }

    if (destFilesUsed.mix) fs.appendFileSync(destFileName, ',\n', 'utf8');
    destFilesUsed.mix = true;

    fs.appendFileSync(destFileName, `  ${JSON.stringify({ input: resultingInputArray, output })}`, 'utf-8');
  };
});

// fs.appendFileSync(destFileNameWhite, `]\n`, 'utf-8');
fs.appendFileSync(destFileName, `]\n`, 'utf-8');
