import Card from "./models/card.mjs"
import Game from "./models/game.mjs"

const SERVER_URL = 'http://localhost:3001/api';


const startGame = async (game) => {
    try  {
        const response = await fetch(SERVER_URL + '/games',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(game)
            });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            return response.json();
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {
        throw new Error("Error: " + ex)
    }
};


const getTempGame = async () => {
    try {
        const response = await fetch(SERVER_URL + `/games/temp-game`, { credentials: 'include' });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const game = await response.json();
            return mapJsonToInitialGame(game);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {

        throw new Error("Error: " + ex)
    }
};


const getGame = async (gameId) => {
    try {
        const response = await fetch(SERVER_URL + `/games/${gameId}`, { credentials: 'include' });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const game = await response.json();
            return mapJsonToGame(game);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {

        throw new Error("Error: " + ex)
    }
};


const getGames = async (userId) => {
    try {
        const response = await fetch(SERVER_URL + `/users/${userId}/games/`, { credentials: 'include' });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const games = await response.json();
            return mapJsonToGames(games);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {

        throw new Error("Error: " + ex)
    }
};


const getRandomCardForGame = async (gameId) => {
    try {
        const response = await fetch(SERVER_URL + `/games/${gameId}/random-card`, { credentials: 'include' });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const card = await response.json();
            return mapJsonToCard(card);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {

        throw new Error("Error: " + ex)
    }
};


const getCardById = async (cardId) => {
    try {
        const response = await fetch(SERVER_URL + `/cards/${cardId}`, { credentials: 'include' });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const card = await response.json();
            return mapJsonToCard(card);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {

        throw new Error("Error: " + ex)
    }
};


const addCard = async (gameId, card, card_index) => {
    try  {
        const response = await fetch(SERVER_URL + `/games/${gameId}/cards`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({id: card.id, index: card_index, round: card.round})
            });
        if (response.ok) {
            let type = response.headers.get('Content-Type');
            if (!type.startsWith('application/json')) {
              throw new TypeError(`Expected JSON, got ${type}`);
            }
            const card = await response.json();
            return mapJsonToCard(card);
        } else {
            throw new Error("Application error ")
        }
    } catch (ex) {
        throw new Error("Error: " + ex)
    }
};


const login = async (credentials) => {
    const bodyObject = {
        username: credentials.username,
        password: credentials.password
    }
    const response = await fetch(SERVER_URL + `/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyObject)
    })
    if (response.ok) {
        const user = await response.json();
        return user;

    } else {
        throw err;
    }
}


const logout = async () => {
    const response = await fetch(SERVER_URL + `/logout`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (response.ok)
        return null;
}


const getCurrentUser = async () => {
  const res = await fetch(SERVER_URL + '/session/current', {
    credentials: 'include'
  });

  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}




function mapJsonToCard(json) {
  return new Card(json.id, json.title, json.image, json.bad_index, json.card_status);
}

function mapJsonToGame(json) {
  const cards = json.cards.map(c => new Card(c.id, c.title, c.image, c.bad_index, c.card_status, c.round));
  return new Game(json.id, json.user_id, json.result, cards, json.completion_time);
}

function mapJsonToInitialGame(json) {
  const cards = json.cards.map(c => new Card(c.id, c.title, c.image, c.bad_index, c.card_status, c.round));
  const card_to_guess = new Card(json.card_to_guess.id, json.card_to_guess.title, json.card_to_guess.image, json.card_to_guess.bad_index, json.card_to_guess.card_status, json.card_to_guess.round);
  return {game:new Game(json.id, json.user_id, json.result, cards, json.completion_time), card_to_guess: card_to_guess};
}

function mapJsonToGames(jsonArray) {
  return jsonArray.map(gameJson => {
    const cards = gameJson.cards.map(c => new Card(c.id, c.title, c.image, c.bad_index, c.card_status, c.round));
    return new Game(gameJson.id, gameJson.user_id, gameJson.result, cards, gameJson.completion_time);
  });
}


const API = {startGame, addCard, getGame, getGames, getTempGame, login, logout, getCurrentUser, getCardById, getRandomCardForGame};
export default API;