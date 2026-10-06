/*** Importing modules ***/
import express from 'express';
import morgan from 'morgan'; // logging middleware
import cors from 'cors'; // CORS middleware
import {check, validationResult, body} from 'express-validator'; // validation middleware
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

import CardDao from './dao/card-dao.mjs';
import GameDao from './dao/game-dao.mjs';
import {getUser} from './dao/user-dao.mjs';

const cardDao = new CardDao();
const gameDao = new GameDao();

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('cards'));

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
    credentials: true
};
app.use(cors(corsOptions));


// This function is used to handle validation errors
const onValidationErrors = (validationResult, res) => {
    const errors = validationResult.formatWith(errorFormatter);
    return res.status(422).json({validationErrors: errors.mapped()});
};

// Only keep the error message in the response
const errorFormatter = ({msg}) => {
    return msg;
};

//authentication
passport.use(new LocalStrategy({ usernameField: 'username' }, async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) { 
  return cb(null, user);
  
});

app.use(session({
  secret: "pokemon",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}


/* login API */
app.post('/api/login', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).send({err: info});
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);
      
      // req.user contains the authenticated user, we send all the user info back
      return res.status(201).json(req.user);
    });
  })(req, res, next);
});

/* check if a user is already logged in */
app.get('/api/session/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);  // user is stored in the session by passport
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

/* logout API */
app.delete('/api/logout', (req, res) => {
  req.logout(() => {
    res.end();
  });
});




/* API to get a temporary game */
app.get('/api/games/temp-game', async (req, res) => {
  try {
    const cards = await cardDao.getInitialCards();
    const cards_id = cards.map((c) => c.id);
    const card_to_guess = await cardDao.getRandomCardExcluding(cards_id)
    
    if (cards.err){
        res.status(404).json(cards.err);
    } else {
      res.status(200).json({cards: cards, card_to_guess: card_to_guess});
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});


const validateInitialGame = [
  body('cards').exists().withMessage('Must pass an object cards').isArray({ min: 3, max: 3 }).withMessage('Must be an array of exactly 3 items'),

  body('cards.*.id').exists().withMessage('Each object must have an id property').isInt().withMessage('id property must be an int'),
];

/* API to start a game*/
app.post('/api/games', validateInitialGame, isLoggedIn,  async (req, res) => {
  const invalidFields = validationResult(req);

  if (!invalidFields.isEmpty()) {
    return onValidationErrors(invalidFields, res);
  }

  try {
    const user_id = req.user.id;

    //only cards.id is used
    const { cards } = req.body

    //check that every card is present in db before saving the game
    for (const card of cards) {
      const result = await cardDao.getCardById(card.id);
      if (result.id === undefined) {
        res.status(404).json({err: "card not present in the db"});
        return;
      }
    }

    const gameId = await gameDao.startGame(user_id, cards);
    
    if (gameId.err)
      res.status(404).json(gameId.err);
    else
      res.status(200).json(gameId);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


/* API to get a random card for a game*/
app.get('/api/games/:gameId/random-card', async (req, res) => {
  try {
    const result = await cardDao.getCardForGame(req.params.gameId);

    if(result.err)
      res.status(404).json(result.err);
    else
      res.status(200).json(result);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


/* API to post a new card in a game*/
app.post('/api/games/:gameId/cards',[check('gameId').isInt(), check('id').isInt(), check('index').isInt(), check('round').isInt(), isLoggedIn], async (req, res) => {
  const invalidFields = validationResult(req);

    if (!invalidFields.isEmpty()) {
      return onValidationErrors(invalidFields, res);
    }

  try {
    const gameId = req.params.gameId;

    const game = await gameDao.getGame(gameId);

    //check if game already finished or doesnt exist
    if (game.result !== 'Did Not Finish') {
      res.status(404).json({err: "game is already finished or doesn't exist, cannot add the card"});
    } else {

      const full_card = await gameDao.checkAndAddCard(req.body, gameId);

      if(full_card.err)
        res.status(404).json(full_card.err);
      else
        res.status(200).json(full_card);
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});


/* API to get a card by id*/
app.get('/api/cards/:cardId/', async (req, res) => {
  try {
    const cardId = req.params.cardId;

    const result = await cardDao.getCardById(cardId);

    if(result.err)
      res.status(404).json(result.err);
    else
      res.status(200).json(result);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


/* API to get a game*/
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;

    const game = await gameDao.getGame(gameId);

    game.cards.forEach(card => {
      if (card.card_status === 'Lost') {
        card.bad_index = undefined;
      }
    });


    if(game.err)
      res.status(404).json(game.err);
    else
      res.status(200).json(game);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


/* API to get all games of a user*/
app.get('/api/users/:userId/games', async (req, res) => {
  try {
    const user_id = req.params.userId;
    const games = await gameDao.getAllGames(user_id);

    if(games.err)
      res.status(404).json(games.err);
    else
      res.status(200).json(games);
  } catch (err) {
    res.status(500).json(err.message);
  }
});



// Activating the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
