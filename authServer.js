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

const requestModel = require("./requestModel.js");
const errorModel = require("./errorModel.js");

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
  exposedHeaders: ['auth-token-access', 'auth-token-refresh'],
}))

async function logRequest(req, res, next) {
  // get the user from the request access token
  const accessToken = req.header('auth-token-access');
  if (!accessToken) {
    next();
    return;
  }
  let username = null;
  let email = null;
  try {
    console.log("THE ACCESS TOKEN", accessToken);
    const decoded = jwt.decode(accessToken);
    username = decoded.user.username;
    email = decoded.user.email;
    console.log("username: " + username + ", email: " + email);
  } catch (error) {
    next();
    return;
  }

  // if the request wont have a user, skip it
  const url = req.url;
  if (username === null || email === null) {
    next();
    return;
  }

  try {
    // check if the request made by the user already exists, if so, increment the count
    let request = await requestModel.findOne({ "user.username": username, "user.email": email, "route": url });
    if (request) {
      request.count += 1;
      await request.save();
      next();
      return;
    }

    // add a new user request
    request = await requestModel.create({
      user: {
        username: username,
        email: email,
      },
      route: url,
      date: Date.now(),
      count: 1
    });
    await request.save();
  } catch (error) {
    console.log(error);
  }
  next();
}

async function logError(error, req, res, next) {
  const {name, message, code} = error;
  const route = req.url;
  const errorDoc = await errorModel.create({
    name: name,
    message: message,
    code: code,
    route: route,
    date: Date.now()
  });
  await errorDoc.save();
}

app.use(logRequest);
app.use(logError);

app.post('/register', asyncWrapper(async (req, res) => {
  try {
    const { username, password, email } = req.body
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const userWithHashedPassword = { ...req.body, password: hashedPassword }

    const userExists = await userModel.findOne({ username, email });
    if (userExists) {
      res.status(400).send("User already exists");
    }
  
    const user = await userModel.create(userWithHashedPassword);
    
    res.status(201).send(user);
  } catch (error) {
    next(error);
    res.status(500).send("Failed to create user due to invalid payload type");
  }
}))

const jwt = require("jsonwebtoken")

app.post('/requestNewAccessToken', asyncWrapper(async (req, res) => {
  console.log("pinged new access token");
  console.log(req.header('auth-token-refresh'));

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
    next(error);
    //throw new PokemonAuthError("Invalid Token: Please provide a valid token.")
  }
}))


app.post('/login', asyncWrapper(async (req, res) => {
  const { email, password } = req.body
  let user = null;
  try {
      user = await userModel.findOne({ email })
  } catch(error) {
    next(error);
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
    next(error);
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

app.get(`/report`, (req, res) => {
  const id = req.query.id;

  console.log(id);

  switch (id) {
    case "1":
      getUniqueUsers().then((result) => {
        console.log(result);
        res.status(200).send("Table 1");
      });
      break;
    case "2":
      res.status(200).send("Table 2");
      break;
    case "3":
      GetTopUsers().then((result) => {
        console.log(result);
        res.status(200).send("Table 3");
      });
      break;
    case "4":
      res.status(200).send("Table 4");
      break;
    case "5":
      res.status(200).send("Table 5");
      break;
  }
});

async function GetTopUsers() {
  const startDate = new Date('2023-01-01');
  const endDate = Date.now();

  return await requestModel.aggregate([
    {
      $group: {
        _id: '$user.email',
        count: { $sum: '$count' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10 // limit to the top 10 users
    }
  ]);
}

async function getUniqueUsers() {
  const startDate = new Date('2023-01-01');
  const endDate = Date.now();

  const x = await requestModel.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$user.email',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        uniqueUsers: { $sum: 1 }
      }
    }
  ]);
  return x;
}


module.exports = app;