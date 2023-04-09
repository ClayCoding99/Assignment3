import React, { useState } from 'react'
import axios from 'axios'
import "./login.css"
import { Link, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Page from './page.js';
import Pagination from './pagination.js';
import Search from './search.js';
import { useEffect } from 'react';
import Signup from './Signup.js';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Report from './report.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState({});

  const [selectedTypeArray, setSelectedTypeArray] = useState([]);
  const [page, setPage] = useState(1);
  const [pokemon, setPokemon] = useState([]);

  async function handleLogout() {
    try {
        await axios.get(`http://localhost:5000/logout?appid=${refreshToken}`);
        setAccessToken('');
        setRefreshToken('');
        setUser({});

        localStorage.removeItem('auth-token-refresh');
        localStorage.removeItem('user');
    } catch (err) {
        console.log(err);
    }
  }

  function handleSwitchPage(page) {
    setPage(page);
  }

  async function fetchPokemon() {
      const currentPokemon = await axios.get("https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json");
      console.log(currentPokemon.data);
      setPokemon(currentPokemon.data);
  }

  useEffect(() => {
    fetchPokemon();

    const storedRefreshToken = localStorage.getItem('auth-token-refresh');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedRefreshToken) {
        async function fetchAuthToken() {
            // fetch auth token
            const response = await axios.post('http://localhost:5000/requestNewAccessToken', {}, {
                headers: {
                    'auth-token-refresh': storedRefreshToken,
                },
            })
            console.log(response.headers);
            setAccessToken(response.headers['auth-token-access']);
        }
        fetchAuthToken();
    }

    setUser(storedUser);
    setRefreshToken(storedRefreshToken);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", { 
        email, 
        password });
        setAccessToken(res.headers['auth-token-access']);
        setRefreshToken(res.headers['auth-token-refresh']);
        console.log(res.headers['auth-token-access']);
        console.log(res.headers['auth-token-refresh']);
        setUser(res.data);

        localStorage.setItem('auth-token-refresh', res.headers['auth-token-refresh']);
        localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      alert("user does not exist!");
      console.log(err);
    }
  }

  return (
    <>        
    {user && <h1>Welcome {user.username}</h1>}
    {accessToken && user?.role === "admin" ?
    <>
        <Dashboard setAccessToken={setAccessToken} accessToken={accessToken} refreshToken={refreshToken}/>
    </> : user?.role === "user" ?
    <>
        <Search setSelectedTypeArray={setSelectedTypeArray} selectedTypeArray={selectedTypeArray} pokemon={pokemon} setPokemon={setPokemon}/>
        <Page pokemon={pokemon} page={page} selectedTypeArray={selectedTypeArray}/>
        <Pagination handleSwitchPage={handleSwitchPage} selectedTypeArray={selectedTypeArray} pokemon={pokemon} page={page}/>
    </> :
    !accessToken &&
    <div className="loginContainer">
        <form onSubmit={handleSubmit}>
          <span>Login</span>
          <br />
          <input
            type="email"
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button type="submit">
            Login
          </button>
          
            <p>Dont have an account? Click <Link to="/signup">here</Link> to signup</p>
        </form>
    </div>
    }
    {
    <>
    <Routes>
        <Route path="/signup" element={<Signup/>}></Route>
        <Route path="/report/:id?" element={<Report accessToken={accessToken} setAccessToken={setAccessToken} refreshToken={refreshToken} />}></Route>
    </Routes>
    <br/>
    {accessToken &&
    <button onClick={handleLogout}>Logout</button>}
    </> 
    }
    </>
  )
}