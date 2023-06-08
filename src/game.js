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
import { Chess, SQUARES } from 'chess.js'
// import './chessboard-1.0.0/chessboard-1.0.0.js'
import { Configuration, OpenAIApi } from "openai";
// import $ from 'jquery';
import './css/game.css';
import './css/chessground.base.css';
import './css/gioco.css';
import './css/neo.css';
// import './css/theme.css';
import './img/horse.ico';
import './img/horse.ico';
import logo from './img/gpt_logo.png';

import { Chessground, Piece } from 'chessground';
// const fs = require('fs');
const START_PROMPT = "Let's simulate playing a game of chess! In this game, we will take turns saying our move, in the format: piece, start position, end position. Please separate the information only with a comma and do not say anything other than the three pieces of information I mentioned.";
// const CONFIRM = "will go first. Please confirm you understand.";

document.getElementById("resetBtn").addEventListener("click", game);
// document.getElementById("easyBtn").addEventListener("click", setEasy);
document.getElementById("hardBtn").addEventListener("click", setHard);

const ground = Chessground(document.getElementById('chessground'), {viewOnly: true});

const gpt_config = new Configuration({
	apiKey: "pk-WkiGNtobhmAHtydNHszJqnXsfyliGYdvRZRqRBudaBUGmPad",
	basePath: "https://api.pawan.krd/v1",
});

let msg_hist = [];
const openai = new OpenAIApi(gpt_config);
let gpt_color = 'n';
let castling = ["K", "Q", "k", "q"];
let enPassant = "-";
let moves = [0,1];
let temp = 1;
let delay = 1200;

const div = document.getElementById("gpt_logo");
const gpt_logo = new Image();
gpt_logo.src = logo;
div.appendChild(gpt_logo);

function game() {
   document.getElementById("gpt_text").innerHTML = "[ChatGPT response will show up here]";
   document.getElementById('hardBtn').disabled = true;
   gpt_color = ['white', 'black'][Math.floor(Math.random() * 2)];

   const chess = new Chess();
   const config = {movable: {
      color: 'white',
      free: false,
      dests: toDests(chess)
      },
      premovable: { // disabled for now
         enabled: false, // allow premoves for color that can not move
         showDests: true, // whether to add the premove-dest class on squares
         castle: true, // whether to allow king castle premoves
         dests: toDests(chess) // premove destinations for the current selection
       }
   };

   const ground = Chessground(document.getElementById('chessground'), config);
   ground.set({
      movable: {
         events: {
         after: chessGPT(ground, chess)
         }
      }
   });

   if (gpt_color === 'white') {
      ground.toggleOrientation();
      msg_hist = [{role: "user", content: START_PROMPT + " You will go first and play as White."}];
      getChatGPTResponse(true).then(result => performChatMove(ground, chess, result[0].toLowerCase(), result[1].toLowerCase(), result[2].toLowerCase()));
   } else {
      msg_hist = [{role: "user", content: START_PROMPT + " I will go first. You will play as Black. Please confirm you understand."}];
      getChatGPTResponse(true).then(result => console.log(result));
   }

   // const chess = new Chess();
   // const config = {movable: {
   //    color: 'white',
   //    free: false,
   //    dests: toDests(chess)
   //    },
   //    premovable: { // disabled for now
   //       enabled: false, // allow premoves for color that can not move
   //       showDests: true, // whether to add the premove-dest class on squares
   //       castle: true, // whether to allow king castle premoves
   //       dests: toDests(chess) // premove destinations for the current selection
   //     }
   // };
   // const ground = Chessground(document.getElementById('chessground'), config);
   // ground.set({
   //    movable: {
   //       events: {
   //       after: chessGPT(ground, chess)
   //       }
   //    }
   // });
   
   // ground.setAutoShapes([{ orig: 'e4', brush: 'green', customSvg: glyphToSvg['??'] }]);
}

// from https://github.com/lichess-org/chessground-examples/blob/master/src/util.ts
function toDests(chess){
   const dests = new Map();
   SQUARES.forEach(s => {
     const ms = chess.moves({square: s, verbose: true});
     if (ms.length) dests.set(s, ms.map(m => m.to));
   });
   return dests;
}

// from https://github.com/lichess-org/chessground-examples/blob/master/src/util.ts
function toColor(chess, swap) {
   if (swap) {
      return (chess.turn() === 'w') ? 'black' : 'white';   
   }
   return (chess.turn() === 'w') ? 'white' : 'black';
}

function toPiece(piece_letter) {
   const key = new Map([
      ['p', 'pawn'],
      ['b', 'bishop'],
      ['n', 'knight'],
      ['r', 'rook'],
      ['q', 'queen'],
      ['k', 'king']
   ])

   // console.log(piece_letter);
   // console.log(key);

   return key.get(piece_letter);
}

function updateSideData(chess, piece, orig, dest) {
   // let piece = chess.get(orig);
   if (piece.type === "k") {
      if (piece.color === "w" && castling[0] !== "") {
         castling[0] = "";
      }
      else if (piece.color === "b" && castling[2] !== "") {
         castling[2] = "";
      }
   } else if (piece.type === "r") {
      if (piece.color === "w") {
         if (castling[0] !== "" && orig === "h1") {
            castling[0] = "";
         } else if (castling[1] !== "" && orig === "a1") {
            castling[1] = "";
         }
      }
      else {
         if (castling[2] !== "" && orig === "h8") {
            castling[2] = "";
         } else if (castling[3] !== "" && orig === "a8") {
            castling[3] = "";
         }
      }
   } else if (piece.type === "p") {
      const rank = Number(dest.charAt(1));
      const file = dest.charAt(0);
      if (rank - Number(orig.charAt(1)) > 1) {
         const diff = rank === 4 ? -1 : 1;

         const pawn = {type: "p", color: piece.color === "w" ? "b" : "w"};
         let check = [];
         if (file !== "a") {
            check.push(String.fromCharCode(file.charCodeAt(0) - 1) + rank.toString());
         }

         if (file !== "g") {
            check.push(String.fromCharCode(file.charCodeAt(0) + 1) + rank.toString());
         }

         for (const elem of check) {
            if (chess.get(elem) === pawn) {
               enPassant = file + (rank + diff).toString();
            }
         }
      } else {
         enPassant = "-";
      }
   }

   if (chess.get(dest) === null) {
      moves[0] += 1;
   } else {
      moves[0] = 0;
   }
   
   if (chess.turn() === "b"){
      moves[1] += 1;
   }
}

function generateFen(fen, color) {
   let castle = castling.join("");
   if (castle === "") {
      castle = "-";
   }

   return [fen, color.charAt(0), castle, enPassant, moves[0], moves[1]].join(" ");
}

// function gameOver(cg, chess, override_white = false) {
//    cg.set({
//       movable: {free: false}
//    });

//    let winner = "error";
//    if (chess.isCheckmate()) {
//       winner = toColor(chess, true);
//    } else if (chess.isStalemate()) {

//    }
//    if (!chess.isCheckmate()) {
//       winner = override_white ? 'white' : 'black';
//    } else {
//       winner = toColor(chess, true);
//    }
//    // document.getElementById('gpt_text').innerHTML = "Game Over: " + winner + " wins!";
//    document.getElementById('hardBtn').disabled = false;
//    let res_text = document.getElementById('result_text');
//    res_text.innerHTML = winner.charAt(0).toUpperCase() + winner.slice(1) + " wins!";
//    res_text.style.visibility = "visible";
//    res_text.style.opacity = 1;
//    setTimeout(()=>{
//       res_text.style.opacity = 0;
//       res_text.visibility = "hidden";
//    }, 1750);
// }

function gameOver(cg, stale, color="none") {
   cg.set({
      movable: {free: false}
   });

   let winner = "error";
   if (stale) {
      winner = "No one ";
   } else {
      winner = color.charAt(0).toUpperCase() + color.slice(1);
   }

   document.getElementById('hardBtn').disabled = false;
   let res_text = document.getElementById('result_text');
   res_text.innerHTML = winner.charAt(0).toUpperCase() + winner.slice(1) + " wins!";
   res_text.style.visibility = "visible";
   res_text.style.opacity = 1;
   setTimeout(()=>{
      res_text.style.opacity = 0;
      res_text.style.visibility = "hidden";
   }, 1750);
}

function validMoves(chess) {
   let output = [];
   for (const move of chess.moves({verbose: true})) {
      output.push(toPiece(move.piece)+ ", " + move.from + ", " + move.to);
   }
   return output.join("\n")
}

function updateText(text) {
   document.getElementById("gpt_text").innerHTML = text;
   // document.getElementById("gpt_text").classList.add('text-animate');
   // setTimeout(()=>{
   //    document.getElementById("gpt_text").classList.remove('text-animate');
   // }, 50);
}

// function setEasy() {
//    document.getElementById("easyBtn").classList.add('text-animate');
//    if (element.classList.contains("myClass");)
//    temp = 0.5;
//    delay = 800;
// }

function setHard() {
   const btn = document.getElementById("hardBtn");
   const label = document.getElementById("diff_label");
   if (btn.classList.contains('on')) {
      btn.classList.remove('on');
      label.innerHTML = "Difficulty: Easy";
      // btn.innerHTML = "Difficulty: Easy";
      temp = 0.3;
      delay = 1200;
   } else {
      btn.classList.add('on');
      temp = 1;
      delay = 1200;
      label.innerHTML = "Difficulty: Hard";
   }

   console.log(temp);
}

// function kingCheck(chess, piece, src, dest) {
//    const dest_piece = chess.get(dest).type;

   

//    if (piece === "k") {
//       return dest_piece === "k";
//    }
//    chess.get(dest).type === "k" || (chess.get(src) === "k" && piece != "k")
// }

//  export function aiPlay(cg: Api, chess: ChessInstance, delay: number, firstMove: boolean) {
//    return (orig, dest) => {
//      chess.move({from: orig, to: dest});
//      setTimeout(() => {
//        const moves = chess.moves({verbose:true});
//        const move = firstMove ? moves[0] : moves[Math.floor(Math.random() * moves.length)];
//        chess.move(move.san);
//        cg.move(move.from, move.to);
//        cg.set({
//          turnColor: toColor(chess),
//          movable: {
//            color: toColor(chess),
//            dests: toDests(chess)
//          }
//        });
//        cg.playPremove();
//      }, delay);
//    };
//  }

// pass in chessground object and chess.js object
function chessGPT(cg, chess) {
   return (orig, dest) => {
      const piece = toPiece(chess.get(orig).type);
      
      const opp_rank = gpt_color === "white" ? "1" : "8";
      if (piece.charAt(0) === "p" && dest.charAt(1) === opp_rank) {
         cg.setPieces(new Map([
            [dest, {role: "queen", color: gpt_color === "white" ? "black" : "white"}]
         ]));
      }
      
      updateSideData(chess, chess.get(orig), orig, dest);

      cg.set({
         turnColor: toColor(chess, true),
      });
   
      let fen = cg.getFen();

      chess.load(generateFen(fen, toColor(chess, true)));
      // chess.move({from: orig, to: dest});
      
      let msg = "";
      if (chess.isCheckmate() || chess.isStalemate()) {
         gameOver(cg, chess.isStalemate(), toColor(chess, true));
      } else {
         if (chess.isCheck()) {
            msg = ". You are in check. Your valid moves are:\n" + validMoves(chess) + ". Please choose one, sticking to the exact format specified of piece, start position, end position";
         }
         msg_hist.push({role: "user", content: piece + ", " + orig + ", " + dest + msg});
         setTimeout(() => {
            if (chess.turn() === gpt_color[0]) {
               getChatGPTResponse().then(result => performChatMove(cg, chess, result[0].toLowerCase(), result[1].toLowerCase(), result[2].toLowerCase()));
            }
         }, delay);
      }
   }
}

function performChatMove(cg, chess, piece, src, dest) {
   console.log("ChatGPT: " + piece + " " + src + " " + dest);

   const currPiece = {role: piece, color: gpt_color};

   cg.setPieces(new Map([
      [src, currPiece]
   ]));
   cg.move(src, dest);

   const opp_rank = gpt_color === "white" ? "8" : "1";
   if (piece.charAt(0) === "p" && dest.charAt(1) === opp_rank) {
      cg.setPieces(new Map([
         [dest, {role: "queen", color: gpt_color}]
      ]));
   }

   cg.set({
      turnColor: toColor(chess, true),
   });

   let fen = cg.getFen();

   if ((fen.match(/k/g) || []).length !== 1 || (fen.match(/K/g) || []).length !== 1) {
      // gameOver(cg, chess, (fen.match(/k/g) || []).length !== 1);
      gameOver(cg, false, ((fen.match(/k/g) || []).length !== 1) ? "white" : "black");
      return;
   }

   updateSideData(chess, piece, src, dest);

   console.log(generateFen(fen, toColor(chess, true)));
   chess.load(generateFen(fen, toColor(chess, true)));
   

   cg.set({movable: {
      color: toColor(chess, false),
      dests: toDests(chess)
   }});
   // chess.load(fen + castling.join());
   // chess.put({ type: piece[0], color: gpt_color}, src);
   // let curr_piece = chess.remove(src);
   // chess.remove(dest);
   // chess.put(curr_piece, dest);
   // chess.turn = "white";
   // chess.move({from: src, to: dest});

   console.log(chess.ascii());

   if (chess.isCheckmate() || chess.isStalemate()) {
      gameOver(cg, chess.isStalemate(), gpt_color);
   }

   // if (kingCheck(chess, piece, src, dest)) {
   //    gameOver(cg, chess);
   // } else {
   
   // }
}

async function getChatGPTResponse() {
   // const response = await openai.createChatCompletion({
   //    model: "gpt-3.5-turbo",
   //    messages: msg_hist,
   //    max_tokens: 15,
   //    temperature: temp
   // });

   // const timeLimit = 8000;
   
   // let timeout;
   // const timeoutPromise = new Promise((resolve, reject) => {
   //       timeout = setTimeout(() => {
   //          resolve(JSON.stringify({message: ""}));
   //       }, timeLimit);
   // });

   const response = (await fetch('https://4oqfislme54sl6hrpqsv2qaxce0hytob.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
         "Content-Type": "application/json",
       },
      body: JSON.stringify([temp, msg_hist]),
      cache: 'default'
   }));

   // const response = await Promise.race([response_aws, timeoutPromise]);
   // if(timeout){ //the code works without this but let's be safe and clean up the timeout
   //       clearTimeout(timeout);
   // }

   let responseJSON = "";

   // if (response !== "Internal Server Error") {
   //    responseJSON = await response.json();
   // }
   
   try {
      responseJSON = await response.json();
   } catch (e) {
      responseJSON = JSON.stringify({message: "I took too long. Your move!"});
   }

   console.log("hello");
   console.log(responseJSON);

   const gpt_resp = JSON.parse(responseJSON.message);

   console.log(gpt_resp.content);
   msg_hist.push(gpt_resp);
   const output = gpt_resp.content.match(/\w+/g);
   if (output === null) {
      return "No valid response.";
   }
   updateText(gpt_resp.content);
   return output
}

// from https://github.com/lichess-org/chessground-examples/blob/master/src/units/svg.ts
const glyphToSvg = {
   // Inaccuracy
   '?!': `
 <g transform="translate(68 2) scale(0.3)">
   <circle style="fill:#56b4e9" cx="50" cy="50" r="50" />
   <path style="fill:#ffffff;stroke-width:0.81934" d="m 37.734375,21.947266 c -3.714341,0 -7.128696,0.463992 -10.242187,1.392578 -3.113493,0.928585 -6.009037,2.130656 -8.685547,3.605468 l 4.34375,8.765626 c 2.348774,-1.201699 4.643283,-2.157093 6.882812,-2.867188 2.239529,-0.710095 4.504676,-1.064453 6.798828,-1.064453 2.294152,0 4.069851,0.463993 5.326172,1.392578 1.310944,0.873963 1.966797,2.185668 1.966797,3.933594 0,1.747925 -0.546219,3.276946 -1.638672,4.58789 -1.037831,1.256322 -2.786121,2.757934 -5.24414,4.50586 -2.785757,2.021038 -4.751362,3.961188 -5.898438,5.818359 -1.147076,1.857171 -1.720703,4.149726 -1.720703,6.88086 v 2.951171 h 10.568359 v -2.376953 c 0,-1.147076 0.137043,-2.10247 0.410156,-2.867187 0.327737,-0.764718 0.928772,-1.557613 1.802735,-2.376953 0.873963,-0.81934 2.103443,-1.802143 3.6875,-2.949219 2.130284,-1.584057 3.905982,-3.058262 5.326172,-4.423828 1.420189,-1.42019 2.485218,-2.951164 3.195312,-4.589844 0.710095,-1.63868 1.064453,-3.576877 1.064453,-5.816406 0,-4.205946 -1.583838,-7.675117 -4.751953,-10.40625 -3.113492,-2.731134 -7.510649,-4.095703 -13.191406,-4.095703 z m 24.744141,0.818359 2.048828,39.083984 h 9.75 L 76.324219,22.765625 Z M 35.357422,68.730469 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365567,0.983208 -2.046875,2.731498 -2.046875,5.244141 0,2.403397 0.681308,4.151687 2.046875,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.048828,-2.840744 2.048828,-5.244141 0,-2.512643 -0.683262,-4.260933 -2.048828,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z m 34.003906,0 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365566,0.983208 -2.048828,2.731498 -2.048828,5.244141 0,2.403397 0.683262,4.151687 2.048828,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.046875,-2.840744 2.046875,-5.244141 0,-2.512643 -0.681309,-4.260933 -2.046875,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z" />
 </g>
 `,
 
   // Mistake
   '?': `
 <g transform="translate(68 2) scale(0.3)">
   <circle style="fill:#e69f00" cx="50" cy="50" r="50" />
   <path style="fill:#ffffff;stroke-width:0.932208" d="m 40.435856,60.851495 q 0,-4.661041 1.957637,-7.830548 1.957637,-3.169507 6.711897,-6.618677 4.194937,-2.983065 5.966132,-5.127144 1.864416,-2.237299 1.864416,-5.220365 0,-2.983065 -2.237299,-4.474598 -2.144079,-1.584754 -6.059353,-1.584754 -3.915273,0 -7.737326,1.21187 -3.822053,1.211871 -7.830548,3.262729 L 28.13071,24.495382 q 4.567819,-2.516962 9.881405,-4.101716 5.313586,-1.584753 11.6526,-1.584753 9.694964,0 15.008549,4.66104 5.406807,4.66104 5.406807,11.839042 0,3.822053 -1.21187,6.618677 -1.211871,2.796624 -3.635612,5.220365 -2.423741,2.33052 -6.059352,5.033923 -2.703403,1.957637 -4.194936,3.355949 -1.491533,1.398312 -2.050858,2.703403 -0.466104,1.305091 -0.466104,3.262728 v 2.703403 H 40.435856 Z m -1.491533,18.923822 q 0,-4.288156 2.33052,-5.966131 2.33052,-1.771195 5.686469,-1.771195 3.262728,0 5.593248,1.771195 2.33052,1.677975 2.33052,5.966131 0,4.101716 -2.33052,5.966132 -2.33052,1.771195 -5.593248,1.771195 -3.355949,0 -5.686469,-1.771195 -2.33052,-1.864416 -2.33052,-5.966132 z" />
 </g>
 `,
 
   // Blunder
   '??': `
 <g transform="translate(68 2) scale(0.3)">
   <circle style="fill:#df5353" cx="50" cy="50" r="50" />
   <path style="fill:#ffffff;stroke-width:0.810558" d="m 31.799294,22.220598 c -3.67453,-10e-7 -7.050841,0.460303 -10.130961,1.378935 -3.08012,0.918633 -5.945403,2.106934 -8.593226,3.565938 l 4.297618,8.67363 c 2.3236,-1.188818 4.592722,-2.135794 6.808247,-2.838277 2.215525,-0.702483 4.45828,-1.053299 6.727842,-1.053299 2.269562,0 4.025646,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.541416,3.241939 -1.62216,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755898,1.999376 -4.700572,3.917682 -5.835354,5.754947 -1.13478,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.4566 v -2.34982 c 0,-1.134781 0.135856,-2.081756 0.406042,-2.838277 0.324222,-0.756521 0.918373,-1.539262 1.782969,-2.349819 0.864595,-0.810559 2.079262,-1.783901 3.646342,-2.918683 2.10745,-1.567078 3.863533,-3.025082 5.268501,-4.376012 1.404967,-1.404967 2.459422,-2.919725 3.161905,-4.540841 0.702483,-1.621116 1.053298,-3.539423 1.053298,-5.754948 0,-4.160865 -1.567492,-7.591921 -4.70165,-10.29378 -3.080121,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z m 38.66449,0 c -3.67453,-10e-7 -7.05285,0.460303 -10.132971,1.378935 -3.08012,0.918633 -5.943393,2.106934 -8.591215,3.565938 l 4.295608,8.67363 c 2.323599,-1.188818 4.592721,-2.135794 6.808246,-2.838277 2.215526,-0.702483 4.458281,-1.053299 6.727842,-1.053299 2.269563,0 4.025647,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.539406,3.241939 -1.62015,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755897,1.999376 -4.700572,3.917682 -5.835353,5.754947 -1.134782,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.456599 v -2.34982 c 0,-1.134781 0.133846,-2.081756 0.404032,-2.838277 0.324223,-0.756521 0.918374,-1.539262 1.782969,-2.349819 0.864596,-0.810559 2.081273,-1.783901 3.648352,-2.918683 2.107451,-1.567078 3.863534,-3.025082 5.268502,-4.376012 1.404966,-1.404967 2.45942,-2.919725 3.161904,-4.540841 0.702483,-1.621116 1.053299,-3.539423 1.053299,-5.754948 0,-4.160865 -1.567493,-7.591921 -4.701651,-10.29378 -3.08012,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z M 29.449473,68.50341 c -1.945339,0 -3.593943,0.513038 -4.944873,1.539744 -1.350931,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675261,4.107352 2.026192,5.188097 1.35093,1.026707 2.999534,1.539745 4.944873,1.539745 1.891302,0 3.51153,-0.513038 4.86246,-1.539745 1.35093,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675262,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.971158,-1.539744 -4.86246,-1.539744 z m 38.662481,0 c -1.945339,0 -3.591933,0.513038 -4.942864,1.539744 -1.35093,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675262,4.107352 2.026192,5.188097 1.350931,1.026707 2.997525,1.539745 4.942864,1.539745 1.891302,0 3.513539,-0.513038 4.864469,-1.539745 1.350931,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675261,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.973167,-1.539744 -4.864469,-1.539744 z" />
 </g>
 `,
 };



// const configuration = new Configuration({
// 	apiKey: "pk-WkiGNtobhmAHtydNHszJqnXsfyliGYdvRZRqRBudaBUGmPad",
// 	basePath: "https://api.pawan.krd/v1/chat/completions",
// });
// const openai = new OpenAIApi(configuration);

// var board = null
// var game = new Chess()
// var $status = $('#status')
// var $fen = $('#fen')
// var $pgn = $('#pgn')
// var $chatgpt = $('#chatgpt')
// // var move = 

// async function chatGPTMove() {
//   const response = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: ""}]
//   })
//   .then((res) => {
//     console.log(res.data.choices[0].message.content);
//     game.move(res.data.choices[0].message.content);
//   })
// }


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
//   onDragStart: onDragStart,
//   onDrop: onDrop,
//   onSnapEnd: onSnapEnd
//   // sparePieces: true
// }
// board = Chessboard('myBoard', config)

// async function start() {
//   board.start()
//   game.reset()
//   updateStatus()
//   console.log("hehe")
//   const response = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: "Let's play a game of chess. Here are the rules. We will take turns telling each other what move we make, in the form: piece, start position, end position. Once we start the game, only respond with the piece, start position, and end position, separated by commas. Do not respond with anything else."}]
//   })
//   .then((res) => {
//     console.log(res.data.choices[0].message.content);
//     console.log("hello");
//     // game.move(res.data.choices[0].message.content);
//   })
// }


// // $('#startBtn').on('click', board.start)
// $('#resetBtn').on('click', start)
// // $('#clearBtn').on('click', board.clear)
// // $('#clearBtn').on('click', board.clear, game.clear())

// updateStatus()