# ChessGPT

Ever wanted to play chess against ChatGPT? Try it [here](https://vc64.github.io/ChessGPT/)!

## Rules and Directions:

1. Choose your difficulty (only works when not in a game).
2. Click "Play" to start a new game and to be randomly assigned a side.
3. Standard rules of chess apply to you, but maybe not to ChatGPT.
4. Both sides win either by checkmate or if the opponent has an incorrect number of Kings.
5. ChatGPT's responses will be displayed at the top. ChatGPT loves telling people it won when it hasn't.
6. If ChatGPT's response is not a formatted move, you get to move again.

## Summary
This is a web app I am running on a static page using Github Pages. I use Webpack for project organization and bundling modules, and node for package management. Website was made with vanilla HTML, CSS, and JS. [OpenAI API](https://platform.openai.com/docs/api-reference) was evidently used to get ChatGPT responses, but the API calls are done through an AWS Lambda function that acts as a simple backend (mainly to hide the API key). [Chess.js](https://github.com/jhlywa/chess.js) by Jeff Hlywa was a life-saver for adding chess logic because I would have lost my mind if I had to add it myself. [Chessground](https://github.com/lichess-org/chessground) by Lichess was used for the interactive board and pieces (this was also a life-saver). 

## Notes and Thoughts
Originally planned to be a quick weekend thing, but turned out to be a week-long project. I've wanted to make this ever since ChatGPT first came out. Sadly, I only recently found the time to make this, so I'm sure there are other (better) versions out there already. Anyway, this is my messy attempt at it. As I'm very inexperienced in web development, this project involved a LOT of learning, googling, and (admittedly) copying code. I have tried my best to add comments throughout my code that cite my sources when I literally used someone else's code verbatim. In the future, maybe I will properly learn frontend and backend development, as well as how exactly to center a div??? (kidding, kind of). But actually, I still cannot understand how to truly secure an API key used by a web app, even with a frontend and backend. 

For fun, here's a small recap:

* Started with chessboard.js and chess.js, but got lost and didn't like chessboard.js very much.
* Switched to chessground, spent a while learning webpack.
* Implemented first working version with chess.js logic, finally got chessground working with custom aspects.
* Worked on UI, added intro screen, remade layout for game, struggled to figure out responsive design.
* Played around with game, added difficulty modes based on temperature of ChatGPT response, 
* Began making AWS lambda function for API calls, struggled to figure out how to secure API key and how to get AWS lambda to work (CORS, no API gateway, programming lambda function handler, etc.).
* Fixing bugs, adding stalemate detection, fixing king detection, and trying to fix timeout issue from openAI API (not sure if current fix works).
* Finalized fixes to timeout issue from openAI, grants free move to player
* Changed difficulty levels to Normal and Harsh, where focus is less about response temperature and more about memory (chat history gets regularly cleaned for Harsh, should technically make it harder as chatgpt forgets what is on the board and therefore makes more illegal moves?)

## Future Thoughts

Could I somehow reduce the message history so that I don't send larger and larger requests to ChatGPT? Might help with speed but the main reason would be to reduce cost. 

I also want to add a difficulty where chatgpt is told all legal moves from the current position before it is asked what move to make. Might result in very long messages.
