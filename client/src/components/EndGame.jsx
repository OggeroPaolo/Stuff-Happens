import { useState, useEffect } from "react";
import { Col, Container, Row, Card } from "react-bootstrap/";
import { Link } from "react-router";
import API from "../API"
import { useLocation } from 'react-router-dom';

const IMMAGE_REPO = 'http://localhost:3001/';

function EndGame() {

  const location = useLocation();

  const { game } = location.state || {game: undefined};


  return <main>
    <Container fluid className="mt-3">
      <Row>
        <Col className="d-flex flex-column align-items-center">
          { !game? <h2>You need to play a game for the recap</h2>:
          ( <>
            {game.result == 'Lost'? <h2 className="text-danger mt-5">😭You {game.result} the game!😭</h2> : game.result == 'Won'? <h2 className="text-success mt-5">😄You {game.result} the game!😄</h2> : <h2 className="mt-5">You {game.result} the game!</h2>}
            <Row>
              <Col className="d-flex flex-column align-items-center">
                <Link to="/game" className="btn btn-success mt-3">New game</Link>
              </Col>
            </Row>
            {game.cards.filter(card => card.card_status === 'Won').length > 0? <h3 className="mt-5">Here are the cards you won during the game:</h3> :
            <h3 className="mt-5">You didn't win any card. What a shame!</h3>}
            <Row>
              {game.cards.map((card) => {
                if (card.card_status ==='Won') {
                  return (
                    <Col key={"card_id"+card.id+"game_id"+game.id} className="custom_max_width_recap mb-3">
                      <Card className={`h-100 ${ card.card_status === 'Won' ? 'border-success' : card.card_status === 'Lost' ? 'border-danger' : 'border-info'}`}>
                        <div className="meme_immage_container">
                          <Card.Img variant="top" className="meme_immage" src={`${IMMAGE_REPO}${card.image}`} />
                        </div>
                        <Card.Body>
                          {card.round !==-1? <Card.Text>Round: {card.round}</Card.Text> : <Card.Text>Initial</Card.Text>}
                          <Card.Title>{card.title}</Card.Title>
                          <Card.Text className="text-size">Bad index: {card.bad_index}</Card.Text>
                        </Card.Body>
                        <Card.Footer className={`text-light ${card.card_status === 'Won'? "text-bg-success" : card.card_status === 'Lost'? "text-bg-danger" : "text-bg-info"}`}>
                          <Card.Title>{card.card_status}</Card.Title>
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                }
              })}
            </Row>
            </>
          )
          }
          <Link to="/" className="btn btn-primary mt-5">Home</Link>
        </Col>
      </Row>
    </Container>
    
  </main>
}

export default EndGame;