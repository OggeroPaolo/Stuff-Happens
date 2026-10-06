import { useState, useEffect } from 'react'
import { Route, Routes, Navigate } from "react-router"
import { Toast, ToastBody } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';
import API from "./API"
import './App.css'

import TopNav from "./components/TopNav"
import Homepage from "./components/Homepage"
import CardGame from "./components/CardGame"
import EndGame from "./components/EndGame"
import Profile from "./components/Profile"
import LoginForm from "./components/LoginForm"


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate();

  //check if a user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await API.getCurrentUser();
        setLoggedIn(true);
        setUser(user);
      } catch (e) {
        if (loggedIn) 
          setMessage({ msg: `${e}`, type: 'info-subtle' });
        setLoggedIn(false);
        setUser(null);
      }
    };

    checkUser();
  }, []);

  //login the user when requested
  const handleLogin = async (credentials) => {
    try {
      const loginUser = await API.login(credentials);
      setLoggedIn(true);
      setMessage({ msg: `Welcome, ${loginUser.username}!`, type: 'success-subtle' });
      setUser(loginUser);
    } catch (err) {
      setMessage({ msg: "Username or password not correct", type: 'danger-subtle' });
    }

  }
  //logout the user when requested
  const handleLogout = async () => {
    try {
      await API.logout();
      setLoggedIn(false);
      setUser(undefined);
      setMessage({});
      navigate('/');
    } catch (e) {
      setMessage({ msg: "Logout failed", type: 'danger-subtle' });
    }
  }
  //set error messages and welcome messages
  useEffect(() => {
    if (message && message.msg) {
      const timer = setTimeout(() => {
        setMessage({});
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);


  return (
    <>
      <Routes>
        <Route element={<TopNav handleLogout={handleLogout} loggedIn={loggedIn} message={message} setMessage={setMessage}/>} > 
          <Route path='/' element={<Homepage loggedIn={loggedIn}/>}/>
          <Route path="/login" element={loggedIn ? <Navigate replace to='/' /> : <LoginForm handleLogin={handleLogin} />} />
          <Route path='/game' element={<CardGame loggedIn={loggedIn} setMessage={setMessage}/>}/>
          <Route path='/end-game' element={<EndGame/>}/>
          <Route path='/profile' element={<Profile user={user}/>}/>
          <Route path="*" element={<h1 className='ms-3'>404 Page Not Found</h1>} />
        </Route>
      </Routes>
    </>
  )
}

export default App
