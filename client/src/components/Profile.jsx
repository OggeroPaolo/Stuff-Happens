import { Col, Container, Row, Card } from "react-bootstrap/";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import API from "../API"

const IMMAGE_REPO = 'http://localhost:3001/';

function Profile(props) {

  const [games, setGames] = useState([]);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const loadedGames = await API.getGames(props.user.id);
        setGames(loadedGames);
      } catch (error) {
        setMessage({ msg: "Failed to load games", type: 'danger-subtle' });
      }
    }
    loadGames();
  }, []);

  return <main>
    <Container fluid className="mt-3">
      <Row>
        <Col className=" text-center">
          <h2>Go back to homepage:</h2>
          <Link to="/" className="btn btn-primary">Home</Link>
        </Col>
      </Row>
      <Row>
        { !props.user? <Col className="d-flex flex-column align-items-center"><h2 className="mt-10em text-danger">You must login to see your profile page</h2></Col> :
          <Col className="d-flex flex-column align-items-center">
            {games.length === 0? <h2 className="mt-10em">You have not completed any game yet, fix that as soon as possible!</h2>  : <h2>Here is a list of all your completed games:</h2>}
          {games && (
            games.map((game) => {
              if (game.result !== 'Did Not Finish') {
                return <Row key={game.id} className="border_profile mb-3 py-3 mx-3 justify-content-start pb-0">
                <Col>
                <Row className="align-items-center">
                  <Col>
                    {game.result == 'Lost'? <h2 className="text-danger">You {game.result} the game!</h2> : game.result == 'Won'? <h2 className="text-success">You {game.result} the game!</h2> : <h2>You {game.result} the game!</h2>}
                  </Col>
                  <Col className="text-end">
                    <p>Completed at: {game.completion_time}</p>
                  </Col>
                </Row>
                <Row className="justify-content-start">
                {game.cards.map((card) => {
                  return (
                    <Col key={"card_id"+card.id+"game_id"+game.id} className="custom_max_width_recap mb-3">
                      <Card className={`h-100 ${ card.card_status === 'Won' ? 'border-success' : card.card_status === 'Lost' ? 'border-danger' : 'border-info'}`}>
                        <div className="meme_immage_container">
                          <Card.Img variant="top" className="meme_immage" src={`${IMMAGE_REPO}${card.image}`} />
                        </div>
                        <Card.Body>
                          {card.round !==-1? <Card.Text>Round: {card.round}</Card.Text> : <Card.Text>Initial</Card.Text>}
                          <Card.Title>{card.title}</Card.Title>
                        </Card.Body>
                        <Card.Footer className={`text-light ${card.card_status === 'Won'? "text-bg-success" : card.card_status === 'Lost'? "text-bg-danger" : "text-bg-info"}`}>
                          <Card.Title>{card.card_status}</Card.Title>
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                })}
                </Row>
                </Col>
              </Row>
              }
            })
          )}
        </Col>}
      </Row>
    </Container>
    
  </main>
}

export default Profile;