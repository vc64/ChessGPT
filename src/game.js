// // code from: https://chessboardjs.com/examples#5000

// // NOTE: this example uses the chess.js library:
// // https://github.com/jhlywa/chess.js
// // npm install chess.js

// import { Chess } from '../node_modules/chess.js'
// // const { Chess } = require('./chess.js')
// // var game = new Chess()

// // const { Chess } = require('chess.js')

// var config = {
//    draggable: true,
//    position: 'start',
//    onDragStart: onDragStart,
//    onDrop: onDrop,
//    onSnapEnd: onSnapEnd
//  }
// var board = Chessboard('board', config)
// var game = new Chess()
// var $status = $('#status')
// var $fen = $('#fen')
// var $pgn = $('#pgn')

// function onDragStart (source, piece, position, orientation) {
//   // do not pick up pieces if the game is over
//   if (game.game_over()) return false

//   // only pick up pieces for the side to move
//   if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
//       (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
//     return false
//   }
// }

// function onDrop (source, target) {
//   // see if the move is legal
//   var move = game.move({
//     from: source,
//     to: target,
//     promotion: 'q' // NOTE: always promote to a queen for example simplicity
//   })

//   // illegal move
//   if (move === null) return 'snapback'

//   updateStatus()
// }

// // update the board position after the piece snap
// // for castling, en passant, pawn promotion
// function onSnapEnd () {
//   board.position(game.fen())
// }

// function updateStatus () {
//   var status = ''

//   var moveColor = 'White'
//   if (game.turn() === 'b') {
//     moveColor = 'Black'
//   }

//   // checkmate?
//   if (game.in_checkmate()) {
//     status = 'Game over, ' + moveColor + ' is in checkmate.'
//   }

//   // draw?
//   else if (game.in_draw()) {
//     status = 'Game over, drawn position'
//   }

//   // game still on
//   else {
//     status = moveColor + ' to move'

//     // check?
//     if (game.in_check()) {
//       status += ', ' + moveColor + ' is in check'
//     }
//   }

//   $status.html(status)
//   $fen.html(game.fen())
//   $pgn.html(game.pgn())
// }

// var config = {
//   draggable: true,
//   position: 'start',
//   onDragStart: onDragStart,
//   onDrop: onDrop,
//   onSnapEnd: onSnapEnd
// }
// board = Chessboard('board', config)

// updateStatus()

// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

import { Chess } from 'chess.js'
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: "pk-WkiGNtobhmAHtydNHszJqnXsfyliGYdvRZRqRBudaBUGmPad",
	basePath: "https://api.pawan.krd/v1/chat/completions",
});
const openai = new OpenAIApi(configuration);

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $chatgpt = $('#chatgpt')
var move = 

async function chatGPTMove() {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: ""}]
  })
  .then((res) => {
    console.log(res.data.choices[0].message.content);
    game.move(res.data.choices[0].message.content);
  })
}


function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
}

var config = {
  draggable: true,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
  // sparePieces: true
}
board = Chessboard('myBoard', config)

async function start() {
  board.start()
  game.reset()
  updateStatus()
  console.log("hehe")
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Let's play a game of chess. Here are the rules. We will take turns telling each other what move we make, in the form: piece, start position, end position. Once we start the game, only respond with the piece, start position, and end position, separated by commas. Do not respond with anything else."}]
  })
  .then((res) => {
    console.log(res.data.choices[0].message.content);
    console.log("hello");
    // game.move(res.data.choices[0].message.content);
  })
}


// $('#startBtn').on('click', board.start)
$('#resetBtn').on('click', start)
// $('#clearBtn').on('click', board.clear)
// $('#clearBtn').on('click', board.clear, game.clear())

updateStatus()