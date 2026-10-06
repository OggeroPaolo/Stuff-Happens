import Card from '../models/card.mjs'
import GameDao from './game-dao.mjs';

import db from '../db.mjs'

export default function CardDao() {

  //return 3 random cards from the db
  this.getInitialCards = () => {

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM Cards ORDER BY RANDOM() LIMIT 3'

      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows === undefined)
            resolve({ err: `No cards in db.` });
          else
            resolve(mapRowsToCards(rows));
        }
      });
    });
  }

  this.getRandomCardExcluding = (cards_id) => {

    return new Promise((resolve, reject) => {
      const placeholders = cards_id.map(() => '?').join(',');
      const query = `
        SELECT id, title, image 
        FROM Cards 
        ${cards_id.length > 0 ? `WHERE id NOT IN (${placeholders})` : ''} 
        ORDER BY RANDOM()
      `;

      db.all(query, cards_id, (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows.length === 0)
            resolve({ err: `Not enough cards in db to get another random card.` });
          else
            resolve(mapRowsToCards(rows)[0]);
        }
      });
    });
  }

  this.getCardForGame = async (game_id) => {
    const gameDao = new GameDao();

    const cards = (await gameDao.getGame(game_id)).cards;

    const cards_id = cards.map((c) => c.id);

    let card = await this.getRandomCardExcluding(cards_id);

    return card;
  }

  this.getCardById = (card_id) => {

    return new Promise((resolve, reject) => {

      const query = `SELECT * FROM Cards WHERE id = ?`;

      db.all(query, [card_id], (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows === undefined)
            resolve({ err: `No captions in the database.` });
          else
            resolve(mapRowsToCards(rows)[0]);
        }
      });
    });
  }


  this.getCorrectIndex = async (card, game_id) => {
    const gameDao = new GameDao();
    const game = await gameDao.getGame(game_id);

    let correct_index = 0;
    game.cards.forEach((v, index) => {
      if (v.card_status != 'Lost' && card.bad_index > v.bad_index)
        correct_index += 1;
    });

    return correct_index;
  }

  this.getGameCards = (game_id) => {

    return new Promise((resolve, reject) => {

      const query = `SELECT * FROM Cards C, GameCards GC WHERE GC.game_id = ? AND GC.card_id = C.id`;

      db.all(query, [game_id], (err, rows) => {
        if (err) {
          reject(err);
        }
        else {
          if (rows === undefined)
            resolve({ err: `No captions in the database.` });
          else
            resolve(mapRowsToCardsWithStatus(rows));
        }
      });
    });
  }
}


function mapRowsToCards(rows) {
  return rows.sort((a, b) => a.bad_index - b.bad_index).map((row) => new Card(row.id, row.title, row.image, row.bad_index));
}

function mapRowsToCardsWithStatus(rows) {
  return rows.map((row) => new Card(row.id, row.title, row.image, row.bad_index, row.status));
}