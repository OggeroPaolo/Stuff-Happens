import { Navbar, Container, Button, Toast } from "react-bootstrap/";
import { Outlet, Link } from "react-router";

function TopNav(props) {
  return <>
  <header className="">
    <Navbar className="bg-secondary" data-bs-theme="dark">
      <Container fluid>
        <Link to="/" className="justify-content-end me-0 navbar-brand">
          <Navbar.Brand className="d-flex align-items-end">
            <div className="d-flex align-items-center">
              <i className="bi bi-collection-fill mx-3"></i>
              <h1>Stuff Happens</h1>
            </div>
            <p className="m-0">Traveling Version</p>
          </Navbar.Brand>
        </Link>
        <div className="d-flex align-items-center">
          {props.loggedIn && <Link to="/profile" className="justify-content-end me-0 navbar-brand"><i className="bi bi-person mx-3"></i></Link>}
        {!props.loggedIn &&
        <Link to={'/login'}>
        <Button variant="light">Login</Button>
        </Link>}
        {props.loggedIn && 
        <Button variant="outline-light" onClick={()=>props.handleLogout()}>
          Logout
        </Button>
        }
        </div>
      </Container>
    </Navbar>
  </header>
      <Toast
      show={props.message?.msg !== undefined}
      autohide
      onClose={() => props.setMessage({})}
      delay={4000}
      position="top-end"
      className="position-fixed end-0 m-3"
      bg={props.message.type}
      >
        <Toast.Body>
            {props.message.msg}
        </Toast.Body>
      </Toast>
  <Outlet/>
  </>;
}

export default TopNav;