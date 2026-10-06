import { useActionState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router";



function LoginForm(props) {
    const [state, formAction] = useActionState(submitCredentials, { email: '', password: '' })

    async function submitCredentials(prevData, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        }
        try {
            await props.handleLogin(credentials);
            return { success: true }
        }
        catch (error) {
            return { error: 'Invalid credentials' };
        }
    }

    return <Container fluid>
        <Form action={formAction}>
            <Row className="justify-content-center mt-3">
                <Form.Group as={Col} className="col-4" controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type='username' name="username" required />
                </Form.Group>
            </Row>
            <Row className="justify-content-center mt-2">
                <Form.Group className="col-4" controlId='password'>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' name='password' required></Form.Control>
                </Form.Group>
            </Row>
            <Row className="justify-content-center mb-3">
                {state.error && <p className="text-danger">{state.error}</p>}
            </Row>
            <Row className="justify-content-center">
                <Col className="col-4">
                    <Link className="btn btn-secondary w-auto me-3" to={'/'}>Cancel</Link>
                    <Button className="w-auto" type='submit'>Login</Button>
                </Col>
            </Row>
        </Form>


    </Container>
}

export default LoginForm;