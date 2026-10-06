import { Col, Container, Row } from "react-bootstrap/";
import { Link } from "react-router";

function Homepage(props) {
  return <main>
    <Container fluid className="homepage">
      <Row>
        <Col className="d-flex flex-column align-items-center">
          <h2>Welcome to Stuff Happens!</h2>
          {!props.loggedIn && (
            <>
            <h2>How the Game Works</h2>
          <p>You start with 3 visible cards. You can see: <br/>

- The name of the situation <br/>

- Its image<br/>

- Its Bad Luck Index<br/>

You’ll be shown one new card, but only its name and image – the index stays hidden.<br/>

Your task: guess where this new card fits in your lineup based on its level of misfortune.<br/>

You have 30 seconds to decide!<br/>

✅ If You're Right...<br/>
You win the round and the card is added to your hand.<br/>

You’ll see the full details, including the Bad Luck Index.<br/>

❌ If You're Wrong or Run Out of Time...<br/>
The card is discarded.<br/>

You won’t see its Bad Luck Index.<br/>

In this demo, the game ends after this single round.</p> </>)}
          <h2 className="my-3">To start a game just click below:</h2>
          <Link to="/game" className="btn btn-primary">Start</Link>
        </Col>
      </Row>
    </Container>
    
  </main>
}

export default Homepage;