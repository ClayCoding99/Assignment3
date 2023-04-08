const express = require("express")
const { handleErr } = require("./errorHandler.js")
const { asyncWrapper } = require("./asyncWrapper.js")
const dotenv = require("dotenv")
dotenv.config();
const userModel = require("./userModel.js")
const { connectDB } = require("./connectDB.js")
const cors = require("cors")
const bcrypt = require("bcrypt")
const http = require('http');

const {
  PokemonBadRequest,
  PokemonDbError,
  PokemonAuthError
} = require("./errors.js")

const app = express()
const server = http.createServer({ maxHeaderSize: 1024 * 1024 }); // 1MB limit

const start = asyncWrapper(async () => {
  await connectDB({ "drop": false });

  app.listen(process.env.authServerPORT, async (err) => {
    if (err)
      throw new PokemonDbError(err)
    else
      console.log(`Phew! Server is running on port: ${process.env.authServerPORT}`);
    const doc = await userModel.findOne({ "username": "admin" })
    if (!doc)
      userModel.create({ username: "admin", password: bcrypt.hashSync("admin", 10), role: "admin", email: "admin@admin.ca" })
  })
})
start()

app.use(express.json())
app.use(cors({
  exposedHeaders: ['auth-token-access', 'auth-token-refresh', 'authorization'],
}))

app.post('/register', asyncWrapper(async (req, res) => {
  try {
    const { username, password, email } = req.body
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const userWithHashedPassword = { ...req.body, password: hashedPassword }
  
    const user = await userModel.create(userWithHashedPassword);
    
    res.status(201).send(user);
  } catch (error) {
    res.status(500).send("Failed to create user due to invalid payload type");
  }
}))

const jwt = require("jsonwebtoken")

app.post('/requestNewAccessToken', asyncWrapper(async (req, res) => {
  // console.log(req.headers);
  const refreshToken = req.header('auth-token-refresh');
  if (!refreshToken) {
    throw new PokemonAuthError("No Token: Please provide a token.")
  }

  // obtain the refresh token from the db 
  const dbRefreshToken = await userModel.findOne({token: refreshToken});
  if (!dbRefreshToken || dbRefreshToken.token_invalid) {
    console.log("token: ", refreshToken);
    throw new PokemonAuthError("Invalid Token: Please provide a valid token.")
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const accessToken = jwt.sign({ user: payload.user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })
    res.header("auth-token-access", accessToken)
    res.status(200).send("All good!")
  } catch (error) {
    throw new PokemonAuthError("Invalid Token: Please provide a valid token.")
  }
}))

app.post('/login', asyncWrapper(async (req, res) => {
  const { username, password } = req.body
  let user = null;
  try {
      user = await userModel.findOne({ username })
  } catch(error) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send("Failed to find user due to invalid payload type");
  }

  if (!user) {
    res.status(404).send({msg: "User not found", user: null});
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)
  if (!isPasswordCorrect)
    throw new PokemonAuthError("Password is incorrect")


  user.token = null;
  const accessToken = jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })
  const refreshToken = jwt.sign({ user: user }, process.env.REFRESH_TOKEN_SECRET)

  try {
    await userModel.updateOne({ email: user.email, password: user.password}, { token_invalid: false, token: refreshToken})
    user.token = refreshToken;
    user.token_invalid = false;
  } catch (error) {
    res.status(500).send({error: "Failed to update user token"});
  }

  res.header('auth-token-access', accessToken)
  res.header('auth-token-refresh', refreshToken)

  res.status(200).send(user)
}))


app.get('/logout', asyncWrapper(async (req, res) => {
  const user = await userModel.findOne({ token: req.query.appid })
  if (!user) {
    throw new PokemonAuthError("User not found")
  }
  await userModel.updateOne({token: user.token}, { token: null, token_invalid: true })
  res.send("Logged out")
}))

module.exports = app;