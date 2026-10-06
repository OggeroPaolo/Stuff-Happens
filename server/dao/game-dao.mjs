import Game from '../models/game.mjs'
import Card from '../models/card.mjs'
import CardDao from './card-dao.mjs';
import dayjs from 'dayjs';

import db from '../db.mjs'

export default function GameDao() {

  //starts and returns the started game
  this.startGame = (user_id, cards) => {

    return new Promise((resolve, reject) => {

      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else {
            db.run(
              'INSERT INTO Games (user_id, result) VALUES (?, ?)',
              [user_id, "Did Not Finish"],
              function (err) {
                if (err) {
                  db.run('ROLLBACK', (rollbackErr) => {
                    rollbackErr ? reject(rollbackErr) : reject(err);
                  });
                }

                const gameId = this.lastID;

                const stmt = db.prepare(
                  'INSERT INTO GameCards (game_id, card_id, status, round) VALUES (?, ?, ?, ?)'
                );

                const tasks = cards.map((card) =>
                  new Promise((res, rej) => {
                    stmt.run([gameId, card.id, "Initial", -1], (err) => {
                      if (err) rej(err);
                      else res();
                    });
                  })
                );

                Promise.all(tasks)
                .then(() => {
                  stmt.finalize((err) => {
                    if (err) {
                      return db.run('ROLLBACK', (rollbackErr) => {
                        return rollbackErr ? reject(rollbackErr) : reject(err);
                      });
                    } else {
                      db.run("COMMIT", (err) => {
                        if (err) return reject(err);
                        else {
                          return resolve(gameId)};
                      });
                    }
                  });
                })
                .catch((err) => {
                  db.run('ROLLBACK', (rollbackErr) => {
                    return rollbackErr ? reject(rollbackErr) : reject(err);
                  });
                });
              }
            );
          }
        });
      });
    });
  }

  this.addCard = (game_id, card_id, status, game_result, completion_time, round) => {
    if (!game_result) {
      return new Promise((resolve, reject) => {
        const query = 'INSERT INTO GameCards (game_id, card_id, status, round) VALUES (?, ?, ?, ?)'

        db.run(query, [game_id, card_id, status, round], function (err) {
          if (err) {
            reject(err);
          }
          else {
            resolve(this.lastID);
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(
            `INSERT INTO GameCards (game_id, card_id, status, round) VALUES (?, ?, ?, ?)`,
            [game_id, card_id, status, round],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              // Update the game result
              db.run(
                `UPDATE Games SET result = ?, completion_time = ? WHERE id = ?`,
                [game_result, completion_time, game_id],
                function (err2) {
                  if (err2) {
                    db.run('ROLLBACK');
                    return reject(err2);
                  }

                  db.run('COMMIT', (err3) => {
                    if (err3) {
                      return reject(err3);
                    }

                    resolve(this.lastID); // lastID from the UPDATE, not INSERT
                  });
                }
              );
            }
          );
        });
      });
    }
  };

  //return a game
  this.getGame = (game_id) => {

    return new Promise((resolve, reject) => {
      const query = `SELECT G.id AS game_id, G.user_id AS user_id, G.result AS result, GC.status AS card_status, GC.round AS round,
                      C.id AS card_id, C.title AS card_title, C.image AS card_image, C.bad_index AS card_bad_index  
                      FROM Games G, GameCards GC, Cards C WHERE GC.game_id = ? AND GC.card_id = C.id 
                      AND G.id = GC.game_id`

      db.all(query, [game_id], (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows === undefined)
            resolve({ err: `No game with gameId = ${game_id} in db` });
          else
            resolve(mapRowsToGame(rows));
        }
      });
    });
  }

  //return all cards in a game
  this.getAllGames = (user_id) => {

    return new Promise((resolve, reject) => {
      const query = `SELECT G.id AS game_id, G.user_id AS user_id, G.result AS result, GC.status AS card_status, GC.round AS round,
                      C.id AS card_id, C.title AS card_title, C.image AS card_image, G.completion_time as completion_time 
                      FROM Games G, GameCards GC, Cards C 
                      WHERE G.user_id = ? AND GC.card_id = C.id AND G.id = GC.game_id
                      ORDER BY G.completion_time ASC`

      db.all(query, [user_id], (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows === undefined)
            resolve({ err: `No games found for user with userId = ${user_id}` });
          else
            resolve(mapRowsToGames(rows));
        }
      });
    });
  }

  this.checkAndAddCard = async (card, gameId) => {
    try {
      const cardDao = new CardDao();
    
    let full_card = await cardDao.getCardById(card.id);

    //check that the card to be added is in the db
    if (full_card.id === undefined)
      throw Error("no card in database with gine id");
    else {
      const correct_index = await cardDao.getCorrectIndex(full_card, gameId);

      const status = card.index === correct_index? 'Won' : 'Lost';

      const cards = await cardDao.getGameCards(gameId);

      let game_result;
      let completion_time;

      if (cards.filter(card => card.card_status !== 'Lost').length >= 5 && status==='Won'){
        game_result = 'Won';
        completion_time = dayjs().format('YYYY-MM-DD HH:mm:ss');
      }

      if (cards.filter(card => card.card_status === 'Lost').length >= 2 && status==='Lost') {
        game_result = 'Lost';
        completion_time = dayjs().format('YYYY-MM-DD HH:mm:ss');
      }

      const result = await this.addCard(gameId, card.id, status, game_result, completion_time, card.round);
      if (result.err)
        return result;

      full_card = {...full_card, card_status: status};

      return full_card;
    }
    
    } catch {
      throw Error("Error adding a card to a game")
    }
    
  }
}


function mapRowsToGame(rows) {
  
  const mapped_cards = rows.map((row) => new Card(row.card_id, row.card_title, row.card_image, row.card_bad_index, row.card_status, row.round));
  mapped_cards.sort((a,b) => a.bad_index - b.bad_index);
  return new Game(rows[0].game_id, rows[0].user_id, rows[0].result, mapped_cards, rows[0].completion_time);
}

function mapRowsToGames(rows) {
  const games = {};

  rows.forEach((row) => {
    if (!games[row.game_id]) {
      games[row.game_id] = new Game(row.game_id, row.user_id, row.result, [], row.completion_time);
    }

    games[row.game_id].cards.push(
      new Card(row.card_id, row.card_title, row.card_image, row.card_bad_index, row.card_status, row.round)
    );
  });

  Object.values(games).forEach(game => {
    game.cards.sort((a, b) => a.bad_index - b.bad_index);
  });

  return Object.values(games).sort((a, b) => b.id - a.id);
}

function mapRowsToIndex(rows) {
  return rows.map((row) => new parseFloat(row.index));
}