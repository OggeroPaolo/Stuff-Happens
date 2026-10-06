import { useEffect, useState, Fragment, useRef } from "react";
import { Button, Card, Col, Container, Row, ProgressBar } from "react-bootstrap/";
import { Link } from "react-router";
import API from "../API"
import { useNavigate } from 'react-router-dom';

const IMMAGE_REPO = 'http://localhost:3001/';

function CardGame(props) {

  const [game, setGame] = useState({});
  const [card, setCard] = useState({});
  const [selectedIndex, setSelectedIndex] = useState();
  const [timeLimit, setTimeLimit] = useState(30);
  const [timerResetVersion, setTimerResetVersion] = useState(0);
  const timeRef = useRef(null);

  const navigate = useNavigate();

  //load the initial configuration of a game when the user loads in
  useEffect(() => {
    const loadGame = async () => {
      if (!game?.id && !game.cards) {
        try {
          const new_game = await API.getTempGame();
          setGame(new_game.game);
          setCard(new_game.card_to_guess);
        } catch (e) {
          props.setMessage({ msg: "Faild to get initial cards for the game", type: 'danger-subtle' });
        }
      }
    }
    loadGame();
  }, []);

  //update the time remaining for a round 
  //(timerResetVersion is needed because if a user goes to the next roud too fast timeLimit is still 30 and a re-render doesnt happen)
  useEffect(() => {
    if (timeLimit <= 0) {
      clearTimeout(timeRef.current);
      handleSelectedCard(-1);
    } else {
      timeRef.current = setTimeout(() => setTimeLimit(() => timeLimit-1), 1000);
    }
    return () => clearTimeout(timeRef.current);
  }, [timeLimit, timerResetVersion]);

  //two main cases user loggedIn user Not loggedIn
  //if user not logged in navigate to home page
  //if user logged in and first round save initial game
  // then add guessed card to db with associated round, get updated game info to no diverge from the db state,
  //reset the timeLimit and update the timeLimitVersion
  //check if the updated retrieved game was won or lost in that case navigate to the recap page otherwise get a new random card
  const newRound = async () => {
    if (!props.loggedIn) {
      try {
        navigate('/');
      } catch (error) {
        props.setMessage({ msg: "Failed to get card information", type: 'danger-subtle' });
      }
    } else {
      try {
        let gameId;
        if (!game?.id && game.cards) {
          try {
            gameId = await API.startGame(game);
            setGame(() => {return {...game, id:gameId}});
          } catch (error) {
            props.setMessage({ msg: "Failed to start the game", type: 'danger-subtle' });
            return;
          }
        }

        const card_with_round = {...card, round: game.cards.length-2};

        try {
          await API.addCard(game.id?game.id:gameId, card_with_round, selectedIndex);
        } catch (error) {
          props.setMessage({ msg: "Failed to add card to the game", type: 'danger-subtle' });
          return;
        }

        let updatedGame;
        try {
          updatedGame = await API.getGame(game.id?game.id:gameId);
        } catch (error) {
          props.setMessage({ msg: "Failed to get updated game information", type: 'danger-subtle' });
          return;
        }

        setSelectedIndex();
        setTimeLimit(30);
        setTimerResetVersion(prev => prev + 1);

        if(updatedGame.result==='Lost') {
            navigate('/end-game', { state: {game: {...updatedGame, result:'Lost'}}});
        } else {
          if (updatedGame.result==='Won')
            navigate('/end-game', { state: {game: {...updatedGame, result:'Won'}}});
          setGame(updatedGame);
        }

        try {
          const fetchedCard = await API.getRandomCardForGame(game.id?game.id:gameId);
          setCard(fetchedCard);
        } catch (error) {
          props.setMessage({ msg: "Failed to get next card for the game", type: 'danger-subtle' });
        }
      } catch (error) {
        props.setMessage({ msg: "An unexpected error occurred during the game", type: 'danger-subtle' });
      }
    }
  }

  //clear timeOut, set the selected index, compute the correct index with the retrieved information of the card and update the card information
  const handleSelectedCard = async (selected_index) => {
    if (!selectedIndex) {
      clearTimeout(timeRef.current);
      setSelectedIndex(selected_index);
      
      try {
        let updated_card = await API.getCardById(card.id);
      
        let correct_index = 0;
        game.cards.forEach((v, index) => {
          if (v.card_status != 'Lost' && updated_card.bad_index > v.bad_index)
            correct_index += 1;
        });

        if (correct_index != selected_index) {
          updated_card = {...updated_card, bad_index: undefined, card_status: 'Lost'};
        } else {
          updated_card = {...updated_card, card_status: 'Won'};
        }
      
        setCard(updated_card);
      } catch (error) {
        props.setMessage({ msg: "Failed to get card information", type: 'danger-subtle' });
      }
    }
  }

  return <main>
    <Container fluid className="mt-3">
    <ProgressBar animated now={(timeLimit/30)*100} className="mb-3" />
      {card.image && (
        <CardToGuess card={card} newRound={newRound} loggedIn={props.loggedIn}/>
      )}
      <CardsInPosses game={game} handleSelectedCard={handleSelectedCard}/>
    </Container>
  </main>
}

export default CardGame;




/* Displays the card to be guessed */
function CardToGuess(props) {
  return <>
    <Row className="justify-content-center mb-2">
      <Col className="text-end">
        <h3 className={props.card?.card_status? props.card.card_status === 'Won'? "text-end text-success" : "text-end text-danger" : ""}>{props.card?.card_status? props.card.card_status === 'Won'? "Correct!" : "Incorrect" : ""}</h3>
      </Col>
      <Col>
        {props.card?.card_status && ((!props.loggedIn)? <Link to="/" className="btn btn-primary">Home</Link> :<Button className="w-auto" onClick={props.newRound}>Next round</Button>)}
      </Col>
      
    </Row>
    <Row className="justify-content-evenly mb-5 game_x_spacing">
      <Col className="col-2">
        <Card className={props.card.card_status? props.card.card_status === 'Won'? "text-success border-success" : "text-danger border-danger" : "text-info border-info"}>
            <Card.Img variant="top" className="card_immage" src={`${IMMAGE_REPO}${props.card.image}`} />
          <Card.Body>
            <Card.Title>{props.card.title}</Card.Title>
            {props.card?.card_status === 'Won' && <Card.Text>Bad index of: {props.card.bad_index}</Card.Text>}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </>
}




/* Displays the cards in possession of the user */
function CardsInPosses(props) {
  return <Row className="justify-content-center">
    {props.game.cards && (
      props.game.cards.filter(card => card.card_status !== 'Lost').map((card, index) => {
        if (card.card_status !== 'Lost') {
          return <Fragment key={card.id}>
            <Col key={`btn-left-${card.id}`} className="d-flex justify-content-center col-1 mb-3">
              <Card className="w-100 addCard_y_spacing justify-content-center text-center border-2" onClick={() => props.handleSelectedCard(index)}>
                <h3 className="">+</h3>
              </Card>
            </Col>
            <Col key={card.id} className="col-1 mb-3">
              <Card className="h-100"> 
                  <Card.Img variant="top" className="card_immage" src={`${IMMAGE_REPO}${card.image}`} />
                <Card.Body>
                  <Card.Title className="title-size">{card.title}</Card.Title>
                  <Card.Text className="text-size">Bad index: {card.bad_index}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            {index===props.game.cards.filter(card => card.card_status !== 'Lost').length-1? 
            <Col key={`btn-right-${card.id}`} className="d-flex justify-content-center col-1 mb-3">
              <Card className="w-100 addCard_y_spacing justify-content-center text-center border-2" onClick={() => props.handleSelectedCard(index+1)}>
                <h3 className="">+</h3>
              </Card>
            </Col> : ''}
          </Fragment>
        }
      })
    )}
  </Row>
}