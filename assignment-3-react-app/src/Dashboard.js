import React from 'react'
import { Link, Route, Routes, BrowserRouter as Router, Switch, BrowserRouter } from 'react-router-dom'
import Report from './report.js'
import "./dashboard.css"
import Login from './Login.js'
import Signup from './Signup.js'


export default function Dashboard({accessToken, setAccessToken, refreshToken}) {

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <ul className="dashboard-menu">
        <li>
          <Link to="/report/1">Unique API users over a period of time</Link>
        </li>
        <li>
          <Link to="/report/2">Top API users over a period of time</Link>
        </li>
        <li>
          <Link to="/report/3">Top users for each Endpoint</Link>
        </li>
        <li>
          <Link to="/report/4">4xx Errors By Endpoint</Link>
        </li>
        <li>
          <Link to="/report/5">Recent 4xx/5xx Errors</Link>
        </li>
      </ul>

    </div>
  )
}