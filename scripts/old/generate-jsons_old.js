const fs = require('fs');
const path = require('path');

const dir = path.resolve(`./data/to-learn/puzzles-${new Date().toISOString()}`);
if (fs.existsSync(dir)) throw new Error('Destination folder already exists.');
fs.mkdirSync(dir);

const files = {
  all: {
    cells: path.resolve(`${dir}/all-cells.json`),
    pieces: path.resolve(`${dir}/all-pieces.json`),
  },
  openings: {
    cells: path.resolve(`${dir}/opening-cells.json`),
    pieces: path.resolve(`${dir}/opening-pieces.json`),
  },
  midGameEqual: {
    cells: path.resolve(`${dir}/midgame-equal-cells.json`),
    pieces: path.resolve(`${dir}/midgame-equal-pieces.json`),
  },
  midGameWinning: {
    cells: path.resolve(`${dir}/midgame-winning-cells.json`),
    pieces: path.resolve(`${dir}/midgame-winning-pieces.json`),
  },
  midGameLosing: {
    cells: path.resolve(`${dir}/midgame-losing-cells.json`),
    pieces: path.resolve(`${dir}/midgame-losing-pieces.json`),
  },
  endGameEqual: {
    cells: path.resolve(`${dir}/endgame-equal-cells.json`),
    pieces: path.resolve(`${dir}/endgame-equal-pieces.json`),
  },
  endGameWinning: {
    cells: path.resolve(`${dir}/endgame-winning-cells.json`),
    pieces: path.resolve(`${dir}/endgame-winning-pieces.json`),
  },
  endGameLosing: {
    cells: path.resolve(`${dir}/endgame-losing-cells.json`),
    pieces: path.resolve(`${dir}/endgame-losing-pieces.json`),
  },
};

// const destFileName = path.resolve(`./data/to-learn/learn-these-cells-${Date.now()}.json`);
// fs.writeFileSync(destFileName, '[\n', 'utf-8');
for ([x, category] of Object.entries(files)) for ([y, file] of Object.entries(category)) fs.writeFileSync(file, '[\n', 'utf-8');

const filesUsed = {};

const sourceFolder = path.resolve('./data/html_puzzles');


let lastLoggedAt = 0;
fs.readdirSync(sourceFolder).forEach((_fileName, fileIndex, fileArray) => {
  const now = Date.now();
  if (lastLoggedAt < now - 10000) {
    lastLoggedAt = now;
    console.log(`${fileIndex} of ${fileArray.length} files processed.`)
  }

  const fileName = path.resolve(sourceFolder, _fileName);

  const stringContent = fs.readFileSync(fileName, 'utf-8');
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
  // const output = [result];

  const firstMoveLineIndex = lines.findIndex(line => line === 'movesArray = new Array(') + 1;
  const lastMoveLineIndex = lines.findIndex(line => line === 'var current = 0;');

  const moveLines = lines.slice(firstMoveLineIndex, lastMoveLineIndex);
  const totalMoves = moveLines.length;

  moveLines.forEach((line, moveIndex) => {
    const next = moveIndex % 2; // 0: white's turn, 1: balck's turn

    const progress = moveIndex / (totalMoves - 1);
    const output = [result * progress + 0.5];

    const fenStr = `${line.substr(1, line.indexOf(' ') - 1)}`;
    
    const resultingCellInput = [next];
    const resultingPieceInput = { next };

    let tableBalance = 0;
    let tableTotalPieceValue = 0;
    let position = 0

    fenStr.split('').forEach((char) => {
      if (char === '/') return;

      if (Number(char)) {
        position += ~~char;
        resultingCellInput.push(...Array.from({ length: ~~char }).map(() => 0.5));
        return;
      }

      let pieceKey = char;
      let pieceCounter = 1;
      while (typeof resultingPieceInput[pieceKey] !== 'undefined') pieceKey = `${char}${pieceCounter ++}`;
      resultingPieceInput[pieceKey] = position / 63;
      position += 1;

      switch(char) {
        case 'r': 
          resultingCellInput.push(0.1);
          tableBalance -= 5;
          tableTotalPieceValue += 5;
          return;
        case 'n': 
          resultingCellInput.push(0.15);
          tableBalance -= 3;
          tableTotalPieceValue += 3;
          return;
        case 'b': 
          resultingCellInput.push(0.2);
          tableBalance -= 3;
          tableTotalPieceValue += 3;
          return;
        case 'q': 
          resultingCellInput.push(0.05);
          tableBalance -= 9;
          tableTotalPieceValue += 9;
          return;
        case 'k': 
          resultingCellInput.push(0);
          return;
        case 'p': 
          resultingCellInput.push(0.25);
          tableBalance -= 1;
          tableTotalPieceValue += 1;
          return;

        case 'R': 
          resultingCellInput.push(0.9);
          tableBalance += 5;
          tableTotalPieceValue += 5;
          return;
        case 'N': 
          resultingCellInput.push(0.85);
          tableBalance += 3;
          tableTotalPieceValue += 3;
          return;
        case 'B': 
          resultingCellInput.push(0.8);
          tableBalance += 3;
          tableTotalPieceValue += 3;
          return;
        case 'Q': 
          resultingCellInput.push(0.95);
          tableBalance += 9;
          tableTotalPieceValue += 9;
          return;
        case 'K': 
          resultingCellInput.push(1);
          return;
        case 'P': 
          resultingCellInput.push(0.75);
          tableBalance += 1;
          tableTotalPieceValue += 1;
          return;

        default: 
          throw new Error(`Unknown character in FEN: ${char} ${fenStr}`);
      }
    });

    const stringifiedCells = `  ${JSON.stringify({ input: resultingCellInput, output })}`;
    const stringifiedPieces = `  ${JSON.stringify({ input: resultingPieceInput, output })}`;

    if (filesUsed.all) {
      fs.appendFileSync(files.all.cells, ',\n', 'utf8');
      fs.appendFileSync(files.all.pieces, ',\n', 'utf8');
    }
    filesUsed.all = true;

    fs.appendFileSync(files.all.cells, stringifiedCells, 'utf8');
    fs.appendFileSync(files.all.pieces, stringifiedPieces, 'utf8');

    if (Math.abs(tableBalance) <= 4 && tableTotalPieceValue >= 70) {
      // will go in opening lessons
      if (filesUsed.openings) {
        fs.appendFileSync(files.openings.cells, ',\n', 'utf8');
        fs.appendFileSync(files.openings.pieces, ',\n', 'utf8');
      }
      filesUsed.openings = true;

      fs.appendFileSync(files.openings.cells, stringifiedCells, 'utf8');
      fs.appendFileSync(files.openings.pieces, stringifiedPieces, 'utf8');
    }

    if (tableTotalPieceValue <= 74 && tableTotalPieceValue >= 20 && Math.abs(tableBalance) <= 15) {
      // will go in midGame lessons

      if (tableBalance >= -5) {
        // winning
        if (filesUsed.midGameWinning) {
          fs.appendFileSync(files.midGameWinning.cells, ',\n', 'utf8');
          fs.appendFileSync(files.midGameWinning.pieces, ',\n', 'utf8');
        }
        filesUsed.midGameWinning = true;
  
        fs.appendFileSync(files.midGameWinning.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.midGameWinning.pieces, stringifiedPieces, 'utf8');
      }

      if (tableBalance <= 5) {
        // losing
        if (filesUsed.midGameLosing) {
          fs.appendFileSync(files.midGameLosing.cells, ',\n', 'utf8');
          fs.appendFileSync(files.midGameLosing.pieces, ',\n', 'utf8');
        }
        filesUsed.midGameLosing = true;
  
        fs.appendFileSync(files.midGameLosing.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.midGameLosing.pieces, stringifiedPieces, 'utf8');
      }

      if (tableBalance >= -15 && tableBalance <= 15) {
        // equal
        if (filesUsed.midGameEqual) {
          fs.appendFileSync(files.midGameEqual.cells, ',\n', 'utf8');
          fs.appendFileSync(files.midGameEqual.pieces, ',\n', 'utf8');
        }
        filesUsed.midGameEqual = true;
  
        fs.appendFileSync(files.midGameEqual.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.midGameEqual.pieces, stringifiedPieces, 'utf8');
      }
    }

    if (totalMoves - moveIndex < 25) {
      // will go in endGame lessons

      if (tableBalance >= -5) {
        // winning
        if (filesUsed.endGameWinning) {
          fs.appendFileSync(files.endGameWinning.cells, ',\n', 'utf8');
          fs.appendFileSync(files.endGameWinning.pieces, ',\n', 'utf8');
        }
        filesUsed.endGameWinning = true;
  
        fs.appendFileSync(files.endGameWinning.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.endGameWinning.pieces, stringifiedPieces, 'utf8');
      }

      if (tableBalance <= 5) {
        // losing
        if (filesUsed.endGameLosing) {
          fs.appendFileSync(files.endGameLosing.cells, ',\n', 'utf8');
          fs.appendFileSync(files.endGameLosing.pieces, ',\n', 'utf8');
        }
        filesUsed.endGameLosing = true;
  
        fs.appendFileSync(files.endGameLosing.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.endGameLosing.pieces, stringifiedPieces, 'utf8');
      }

      if (tableBalance >= -15 && tableBalance <= 15) {
        // equal
        if (filesUsed.endGameEqual) {
          fs.appendFileSync(files.endGameEqual.cells, ',\n', 'utf8');
          fs.appendFileSync(files.endGameEqual.pieces, ',\n', 'utf8');
        }
        filesUsed.endGameEqual = true;
  
        fs.appendFileSync(files.endGameEqual.cells, stringifiedCells, 'utf8');
        fs.appendFileSync(files.endGameEqual.pieces, stringifiedPieces, 'utf8');
      }
    }


  });
});

for ([x, category] of Object.entries(files)) for ([y, file] of Object.entries(category)) fs.appendFileSync(file, '\n]\n', 'utf-8');
