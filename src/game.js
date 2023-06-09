import { Chess, SQUARES } from 'chess.js';
import { Configuration, OpenAIApi } from "openai";
import { Chessground, Piece } from 'chessground';

// importing css and images for webpack to recognize them when bundling
import './css/game.css';
import './css/chessground.base.css';
import './css/gioco.css';
import './css/neo.css';
import './img/horse.ico';
import logo from './img/gpt_logo.png';

const START_PROMPT = "Let's simulate playing a game of chess! In this game, we will take turns saying our move, in the format: piece, start position, end position. Please separate the information only with a comma and do not say anything other than the three pieces of information I mentioned.";

// trigger game() when "Play" clicked, and setHard() when "Switch Difficulty" clicked
document.getElementById("resetBtn").addEventListener("click", game);
document.getElementById("hardBtn").addEventListener("click", setHard);

// Not sure if needed, but meant to just generate board visual
const ground = Chessground(document.getElementById('chessground'), {viewOnly: true});

let msg_hist = []; // list of messages
let gpt_color = 'none'; // what side is chatgpt
let castling = ["K", "Q", "k", "q"]; // FEN castling section
let enPassant = "-"; // FEN enPassant
let moves = [0,1]; // FEN half-moves and full-moves
let temp = 1; // chatgpt response temp
let delay = 1200; // delay for each chatgpt move

// add gpt logo to chatgpt response display
const div = document.getElementById("gpt_logo");
const gpt_logo = new Image();
gpt_logo.src = logo;
div.appendChild(gpt_logo);

// start new game
function game() {
   document.getElementById("gpt_text").innerHTML = "[ChatGPT response will show up here]";
   
   // disable difficulty btn when game starts
   document.getElementById('hardBtn').disabled = true;
   
   // pick gpt_color randomly
   gpt_color = ['white', 'black'][Math.floor(Math.random() * 2)];

   // new chess.js and chessground objects
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

   // start game with first gpt response request, with slightly different start prompts depending on color.
   if (gpt_color === 'white') {
      ground.toggleOrientation();
      msg_hist = [{role: "user", content: START_PROMPT + " You will go first and play as White."}];
      getChatGPTResponse(true).then(result => performChatMove(ground, chess, result[0].toLowerCase(), result[1].toLowerCase(), result[2].toLowerCase()));
   } else {
      msg_hist = [{role: "user", content: START_PROMPT + " I will go first. You will play as Black. Please confirm you understand."}];
      getChatGPTResponse(true).then(result => console.log(result));
   }
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
   return key.get(piece_letter);
}

// Extremely convoluted ways to write "side data" section of FEN based on last move made and current board state
function updateSideData(chess, piece, orig, dest) {
   if (piece.type === "k") { // castling check 1 - check if king is being moved
      if (piece.color === "w" && castling[0] !== "") {
         castling[0] = "";
      }
      else if (piece.color === "b" && castling[2] !== "") {
         castling[2] = "";
      }
   } else if (piece.type === "r") { // castling check 2 - check if rook moving from start position (bad: allows castling if rook returns to start)
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
   } else if (piece.type === "p") { // en Passant check - need to check if pawn moved 2 and can be taken by en passant
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

   // count consecutive moves where no pieces taken
   if (chess.get(dest) === null) {
      moves[0] += 1;
   } else {
      moves[0] = 0;
   }
   
   // count full moves
   if (chess.turn() === "b"){
      moves[1] += 1;
   }
}

// generate FEN using global vars
function generateFen(fen, color) {
   let castle = castling.join("");
   if (castle === "") {
      castle = "-";
   }

   return [fen, color.charAt(0), castle, enPassant, moves[0], moves[1]].join(" ");
}

// handles game over text and game results
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

   // display winner for 2s and reenable difficulty button
   document.getElementById('hardBtn').disabled = false;
   let res_text = document.getElementById('result_text');
   res_text.innerHTML = winner.charAt(0).toUpperCase() + winner.slice(1) + " wins!";
   res_text.style.visibility = "visible";
   res_text.style.opacity = 1;
   setTimeout(()=>{
      res_text.style.opacity = 0;
      res_text.style.visibility = "hidden";
   }, 2000);
}

// format list of valid moves
function validMoves(chess) {
   let output = [];
   for (const move of chess.moves({verbose: true})) {
      output.push(toPiece(move.piece)+ ", " + move.from + ", " + move.to);
   }
   return output.join("\n")
}

// update gpt text display (originally wanted to add typing animation)
function updateText(text) {
   document.getElementById("gpt_text").innerHTML = text;
}

// bad name, just switches between difficulties (changes temp)
function setHard() {
   const btn = document.getElementById("hardBtn");
   const label = document.getElementById("diff_label");
   if (btn.classList.contains('on')) {
      btn.classList.remove('on');
      label.innerHTML = "Difficulty: Easy";
      temp = 0.3;
   } else {
      btn.classList.add('on');
      temp = 1;
      label.innerHTML = "Difficulty: Hard";
   }
   delay = 1200;
}

// function to invoke after every move made on the chessground board
function chessGPT(cg, chess) {
   return (orig, dest) => {
      // perform user move
      const piece = toPiece(chess.get(orig).type);
      
      // auto promote pawn to queen if applicable
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
   
      // load user move from chessground to chess.js using FEN, checking for change in king count beforehand
      let fen = cg.getFen();
      if ((fen.match(/k/g) || []).length !== 1 || (fen.match(/K/g) || []).length !== 1) {
         gameOver(cg, false, ((fen.match(/k/g) || []).length !== 1) ? "white" : "black");
         return;
      }

      chess.load(generateFen(fen, toColor(chess, true)));
      
      // check for mate, add message for chatGPT with user move to message history, and perform chatGPT move base don response (after delay)
      let msg = "";
      if (chess.isCheckmate() || chess.isStalemate()) {
         gameOver(cg, chess.isStalemate(), toColor(chess, true));
      } else {
         if (chess.isCheck()) { // ensure chatGPT does not ignore checks by reminding it of its legal moves
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

// execute chat move based on response
function performChatMove(cg, chess, piece, src, dest) {
   // log move made
   // console.log("ChatGPT: " + piece + " " + src + " " + dest);

   const currPiece = {role: piece, color: gpt_color};

   // janky solution to illegal moves: perform move in chessground, save FEN, and load FEN into chess js
   cg.setPieces(new Map([
      [src, currPiece]
   ]));
   cg.move(src, dest);

   // auto promote pawn to queen if necessary
   const opp_rank = gpt_color === "white" ? "8" : "1";
   if (piece.charAt(0) === "p" && dest.charAt(1) === opp_rank) {
      cg.setPieces(new Map([
         [dest, {role: "queen", color: gpt_color}]
      ]));
   }

   // switch turn to other side (user)
   cg.set({
      turnColor: toColor(chess, true),
   });

   let fen = cg.getFen();

   // checking for king shenanigans
   if ((fen.match(/k/g) || []).length !== 1 || (fen.match(/K/g) || []).length !== 1) {
      gameOver(cg, false, ((fen.match(/k/g) || []).length !== 1) ? "white" : "black");
      return;
   }

   // load updated FEN into chess.js object
   updateSideData(chess, piece, src, dest);
   chess.load(generateFen(fen, toColor(chess, true)));

   // switch sides back to user, giving them ability to move again
   cg.set({movable: {
      color: toColor(chess, false),
      dests: toDests(chess)
   }});

   // check for mates
   if (chess.isCheckmate() || chess.isStalemate()) {
      gameOver(cg, chess.isStalemate(), gpt_color);
   }
}

// get chat responses from openAI API
async function getChatGPTResponse() {
   // code for calling API directly from code
   // const response = await openai.createChatCompletion({
   //    model: "gpt-3.5-turbo",
   //    messages: msg_hist,
   //    max_tokens: 15,
   //    temperature: temp
   // });

   // POST to lambda function (uses POST to send msg_hist in body, probably bad practice :/)
   const response = (await fetch('https://4oqfislme54sl6hrpqsv2qaxce0hytob.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
         "Content-Type": "application/json",
       },
      body: JSON.stringify([temp, msg_hist]),
      cache: 'default'
   }));

   
   let responseJSON = "";
   
   // meant to catch issues where openAI api takes too long or fails to respond, not sure if it works
   try {
      responseJSON = await response.json();
   } catch (e) {
      responseJSON = {message: JSON.stringify({user: "assistant", content: "I took too long. Your move!"})};
   }

   let gpt_resp;
   if (typeof responseJSON.message === "undefined") {
      responseJSON = {message: JSON.stringify({user: "assistant", content: "I took too long. Your move!"})};
   }
   gpt_resp = JSON.parse(responseJSON.message);

   // add msg to hist, try to extract move info from msg with expectation of comma separated format
   msg_hist.push(gpt_resp);
   const output = gpt_resp.content.match(/\w+/g);
   if (output === null) {
      return "No valid response.";
   }

   updateText(gpt_resp.content);
   return output
}

// from https://github.com/lichess-org/chessground-examples/blob/master/src/units/svg.ts
// might use if live board analysis added in the future??
// const glyphToSvg = {
//    // Inaccuracy
//    '?!': `
//  <g transform="translate(68 2) scale(0.3)">
//    <circle style="fill:#56b4e9" cx="50" cy="50" r="50" />
//    <path style="fill:#ffffff;stroke-width:0.81934" d="m 37.734375,21.947266 c -3.714341,0 -7.128696,0.463992 -10.242187,1.392578 -3.113493,0.928585 -6.009037,2.130656 -8.685547,3.605468 l 4.34375,8.765626 c 2.348774,-1.201699 4.643283,-2.157093 6.882812,-2.867188 2.239529,-0.710095 4.504676,-1.064453 6.798828,-1.064453 2.294152,0 4.069851,0.463993 5.326172,1.392578 1.310944,0.873963 1.966797,2.185668 1.966797,3.933594 0,1.747925 -0.546219,3.276946 -1.638672,4.58789 -1.037831,1.256322 -2.786121,2.757934 -5.24414,4.50586 -2.785757,2.021038 -4.751362,3.961188 -5.898438,5.818359 -1.147076,1.857171 -1.720703,4.149726 -1.720703,6.88086 v 2.951171 h 10.568359 v -2.376953 c 0,-1.147076 0.137043,-2.10247 0.410156,-2.867187 0.327737,-0.764718 0.928772,-1.557613 1.802735,-2.376953 0.873963,-0.81934 2.103443,-1.802143 3.6875,-2.949219 2.130284,-1.584057 3.905982,-3.058262 5.326172,-4.423828 1.420189,-1.42019 2.485218,-2.951164 3.195312,-4.589844 0.710095,-1.63868 1.064453,-3.576877 1.064453,-5.816406 0,-4.205946 -1.583838,-7.675117 -4.751953,-10.40625 -3.113492,-2.731134 -7.510649,-4.095703 -13.191406,-4.095703 z m 24.744141,0.818359 2.048828,39.083984 h 9.75 L 76.324219,22.765625 Z M 35.357422,68.730469 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365567,0.983208 -2.046875,2.731498 -2.046875,5.244141 0,2.403397 0.681308,4.151687 2.046875,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.048828,-2.840744 2.048828,-5.244141 0,-2.512643 -0.683262,-4.260933 -2.048828,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z m 34.003906,0 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365566,0.983208 -2.048828,2.731498 -2.048828,5.244141 0,2.403397 0.683262,4.151687 2.048828,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.046875,-2.840744 2.046875,-5.244141 0,-2.512643 -0.681309,-4.260933 -2.046875,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z" />
//  </g>
//  `,
 
//    // Mistake
//    '?': `
//  <g transform="translate(68 2) scale(0.3)">
//    <circle style="fill:#e69f00" cx="50" cy="50" r="50" />
//    <path style="fill:#ffffff;stroke-width:0.932208" d="m 40.435856,60.851495 q 0,-4.661041 1.957637,-7.830548 1.957637,-3.169507 6.711897,-6.618677 4.194937,-2.983065 5.966132,-5.127144 1.864416,-2.237299 1.864416,-5.220365 0,-2.983065 -2.237299,-4.474598 -2.144079,-1.584754 -6.059353,-1.584754 -3.915273,0 -7.737326,1.21187 -3.822053,1.211871 -7.830548,3.262729 L 28.13071,24.495382 q 4.567819,-2.516962 9.881405,-4.101716 5.313586,-1.584753 11.6526,-1.584753 9.694964,0 15.008549,4.66104 5.406807,4.66104 5.406807,11.839042 0,3.822053 -1.21187,6.618677 -1.211871,2.796624 -3.635612,5.220365 -2.423741,2.33052 -6.059352,5.033923 -2.703403,1.957637 -4.194936,3.355949 -1.491533,1.398312 -2.050858,2.703403 -0.466104,1.305091 -0.466104,3.262728 v 2.703403 H 40.435856 Z m -1.491533,18.923822 q 0,-4.288156 2.33052,-5.966131 2.33052,-1.771195 5.686469,-1.771195 3.262728,0 5.593248,1.771195 2.33052,1.677975 2.33052,5.966131 0,4.101716 -2.33052,5.966132 -2.33052,1.771195 -5.593248,1.771195 -3.355949,0 -5.686469,-1.771195 -2.33052,-1.864416 -2.33052,-5.966132 z" />
//  </g>
//  `,
 
//    // Blunder
//    '??': `
//  <g transform="translate(68 2) scale(0.3)">
//    <circle style="fill:#df5353" cx="50" cy="50" r="50" />
//    <path style="fill:#ffffff;stroke-width:0.810558" d="m 31.799294,22.220598 c -3.67453,-10e-7 -7.050841,0.460303 -10.130961,1.378935 -3.08012,0.918633 -5.945403,2.106934 -8.593226,3.565938 l 4.297618,8.67363 c 2.3236,-1.188818 4.592722,-2.135794 6.808247,-2.838277 2.215525,-0.702483 4.45828,-1.053299 6.727842,-1.053299 2.269562,0 4.025646,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.541416,3.241939 -1.62216,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755898,1.999376 -4.700572,3.917682 -5.835354,5.754947 -1.13478,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.4566 v -2.34982 c 0,-1.134781 0.135856,-2.081756 0.406042,-2.838277 0.324222,-0.756521 0.918373,-1.539262 1.782969,-2.349819 0.864595,-0.810559 2.079262,-1.783901 3.646342,-2.918683 2.10745,-1.567078 3.863533,-3.025082 5.268501,-4.376012 1.404967,-1.404967 2.459422,-2.919725 3.161905,-4.540841 0.702483,-1.621116 1.053298,-3.539423 1.053298,-5.754948 0,-4.160865 -1.567492,-7.591921 -4.70165,-10.29378 -3.080121,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z m 38.66449,0 c -3.67453,-10e-7 -7.05285,0.460303 -10.132971,1.378935 -3.08012,0.918633 -5.943393,2.106934 -8.591215,3.565938 l 4.295608,8.67363 c 2.323599,-1.188818 4.592721,-2.135794 6.808246,-2.838277 2.215526,-0.702483 4.458281,-1.053299 6.727842,-1.053299 2.269563,0 4.025647,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.539406,3.241939 -1.62015,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755897,1.999376 -4.700572,3.917682 -5.835353,5.754947 -1.134782,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.456599 v -2.34982 c 0,-1.134781 0.133846,-2.081756 0.404032,-2.838277 0.324223,-0.756521 0.918374,-1.539262 1.782969,-2.349819 0.864596,-0.810559 2.081273,-1.783901 3.648352,-2.918683 2.107451,-1.567078 3.863534,-3.025082 5.268502,-4.376012 1.404966,-1.404967 2.45942,-2.919725 3.161904,-4.540841 0.702483,-1.621116 1.053299,-3.539423 1.053299,-5.754948 0,-4.160865 -1.567493,-7.591921 -4.701651,-10.29378 -3.08012,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z M 29.449473,68.50341 c -1.945339,0 -3.593943,0.513038 -4.944873,1.539744 -1.350931,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675261,4.107352 2.026192,5.188097 1.35093,1.026707 2.999534,1.539745 4.944873,1.539745 1.891302,0 3.51153,-0.513038 4.86246,-1.539745 1.35093,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675262,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.971158,-1.539744 -4.86246,-1.539744 z m 38.662481,0 c -1.945339,0 -3.591933,0.513038 -4.942864,1.539744 -1.35093,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675262,4.107352 2.026192,5.188097 1.350931,1.026707 2.997525,1.539745 4.942864,1.539745 1.891302,0 3.513539,-0.513038 4.864469,-1.539745 1.350931,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675261,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.973167,-1.539744 -4.864469,-1.539744 z" />
//  </g>
//  `,
//  };