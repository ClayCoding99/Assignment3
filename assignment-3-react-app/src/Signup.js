import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios';

export default function Signup() {

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit() {
        async function get() {
            try {
                const response = await axios.post("http://localhost:5000/register", {
                    username,
                    password,
                    email,
                });
                if (response.status === 400) {
                    alert("user already exists!");
                    return;
                }
                console.log(response.data);
                
                //navigate("/");
            } catch(err) {
                console.log(err);
            }
        }
        get();
    }

  return (
    <div className="loginContainer">
        <form onSubmit={handleSubmit}>
        <span>Signup</span>
        <br />
        <input
            type="text"
            placeholder="username"
            onChange={(e) => setUsername(e.target.value)}
        />

        <br/>
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
            Create Account
        </button>
        
        <p>Already have an account? Click <Link to="/">here</Link> to login</p>
        </form>
    </div>
  )
}
