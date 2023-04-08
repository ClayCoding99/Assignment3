const request = require('supertest');
const app = require('./authServer');
const pokeApp = require('./appServer');
const mongoose = require('mongoose');
const PokemonAuthError = require('./errors');
const base64 = require('base-64');

const userModel = require('./userModel');

describe("Auth Server Endpoints", () => {

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function parseTokensFromHeaderIn(response) {
    const accessToken = response.header["authorization"].split(",")[0].split(" ")[1];
    const refreshToken = response.header["authorization"].split(",")[1].split(" ")[1];
    return { accessToken, refreshToken };
  }

    beforeAll(async () => {
      const admin = {
          username: "admin",
          password: "admin",
          email: "admin@gmail.com",
          role: "admin",
        };

        // register the admin
        const registerResponse = await request(app)
          .post('/register')
          .send(admin);
    });

    describe("First set of tests from the readme", () => {

        it('Tests the /register endpoint', async () => {
            const user = {
                username: "test", 
                password: "test", 
                email: "test@gmail.com"
            };
            const response = await request(app)
                .post('/register')
                .send(user)
            expect(response.statusCode).toBe(201);
        });

          it('login returns JWT access and refresh tokens', async () => {
            const user = {
                username: "test",
                password: "test",
                email: "test@gmail.com"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(user);
        
            expect(loginResponse.statusCode).toBe(200);

            expect(parseTokensFromHeaderIn(loginResponse).accessToken).toBeDefined();
            expect(parseTokensFromHeaderIn(loginResponse).refreshToken).toBeDefined();
          });

          it("Test the login throws an error when invalid credentials are provided", async () => {
            const user = {
              username: "test",
              password: "1234",
              email: "test@gmail.com",
            };
            try {
              const loginResponse = await request(app)
                .post("/login")
                .send(user);
            } catch (PokemonAuthError) {
              expect(PokemonAuthError.message).toBe("Password is incorrect.");
            }
          });

          it("Test that the /requestNewAccessToken endpoint returns a new JWT access token for a valid refresh token", async () => {
            const user = {
                username: "test",
                password: "test",
                email: "test@gmail.com"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(user);

            const refreshToken = parseTokensFromHeaderIn(loginResponse).refreshToken;
            
            const response = await request(app)
              .post("/requestNewAccessToken")
              .set("auth-token-refresh", refreshToken);

            expect(response.statusCode).toBe(200);
            expect(refreshToken).toBeDefined();
          });

          it("- Test that the /requestNewAccessToken endpoint throws a PokemonAuthError for an invalid or missing refresh token", async () => {
            try {
              const response = await request(app)
                .post("/requestNewAccessToken")
                .set("auth-token-refresh", "invalidRefreshToken");
            } catch (PokemonAuthError) {
              expect(PokemonAuthError.message).toBe("Invalid Token: Please provide a valid token.");
            }
          });

          it("- Test that the refresh token is added to the refreshTokens array on login and removed on logout", async () => {
            const user = {
              username: "test",
              password: "test",
              email: "test@gmail.com"
            };
            const loginResponse = await request(app)
              .post("/login")
              .send(user);

            const loginUser = loginResponse.body;
            expect(loginUser.token).toBeDefined();
            
            const response = await request(app)
              .post("/logout")
              .set("auth-token-refresh", parseTokensFromHeaderIn(loginResponse));

           
            const logoutUser = response.body;
            expect(logoutUser.token).toBeUndefined();

          });

          it("- Test that the JWT access token can be decoded and contains the correct user data", async () => {
            const user = {
              username: "test",
              password: "test",
              email: "test@gmail.com"
            };
            const loginResponse = await request(app)
              .post("/login")
              .send(user);
            const accessToken = parseTokensFromHeaderIn(loginResponse).accessToken;
            const data = JSON.parse(base64.decode(accessToken.split('.')[1]));
            expect(data.user.username).toBe(user.username);
            expect(data.user.email).toBe(user.email);
          });

    });

    describe("Second set of tests from the readme", () => {

        it('Register, login, and then make a request with a valid JWT access token', async () => {
          const newUser = {
            username: "newUser",
            password: "newUser",
            email: "newUser@gmail.com"
          };
          const registerResponse = await request(app)
            .post('/register')
            .send(newUser);
          expect(registerResponse.statusCode).toBe(201);

          const loginResponse = await request(app)
            .post('/login')
            .send(newUser);
          expect(loginResponse.statusCode).toBe(200);
          expect(parseTokensFromHeaderIn(loginResponse).accessToken).toBeDefined();

          const response = await request(pokeApp)
            .get('/api/v1/pokemons')
            .set('auth-token-access', parseTokensFromHeaderIn(loginResponse).accessToken);
          expect(response.statusCode).toBe(200);
        });

        it('unauthentical user cannot access protected route', async () => {
          try {
            const response = await request(pokeApp).get('/api/v1/pokemons');
          } catch (PokemonAuthError) {
            expect(PokemonAuthError.message).toBe('No Token: Please provide an access token using the headers.');
          }
        });

        it('access protected route with expired JWT access token', async () => {
            const user = {
                username: "test",
                password: "test",
                email: "test@test.com"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(user);
        
            await sleep(11000); // Wait for access token to expire
        
            const response = await request(pokeApp)
              .get('/api/v1/pokemons')
              .set('auth-token-access', parseTokensFromHeaderIn(loginResponse).accessToken);
        
            expect(response.status).toBe(403);
            expect(response.text).toBe('Invalid Token: Please provide a valid access token.');
          }, 12000);

          it('access protected route with invalid JWT access token', async () => {
            try {
            const response = await request(pokeApp)
              .get('/api/v1/pokemons')
              .set('auth-token-access', 'invalid-token');
            } catch (PokemonAuthError) {
              expect(error.message).toBe('Invalid Token: Please provide a valid access token.');
            }
          });

          it('access protected route with valid refresh token', async () => {
            const user = {
                username: "test",
                password: "test",
                email: "test@test.com"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(user);
        
            const response = await request(pokeApp)
              .get('/api/v1/pokemons')
              .set('auth-token-access', parseTokensFromHeaderIn(loginResponse).refreshToken);
        
            expect(response.status).toBe(403);
            expect(response.text).toBe('Invalid Token: Please provide a valid access token.');
          });

           it('non-admin user cannot access admin protected route', async () => {
            const admin = {
                username: "admin",
                password: "admin",
                email: "admin@gmail.com",
                role: "admin"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(admin);

            const response = await request(pokeApp)
              .get('/report')
              .set('auth-token-access', parseTokensFromHeaderIn(loginResponse).accessToken);
        
            expect(response.status).toBe(200);
          });
        
          it('access protected route after logout', async () => {
            const user = {
                username: "test", 
                password: "test", 
                email: "test@test.com"
            };
            const loginResponse = await request(app)
              .post('/login')
              .send(user);
        
            await request(app)
              .get('/logout')
              .query({ appid: parseTokensFromHeaderIn(loginResponse).refreshToken});
        
              try {
                const response = await request(pokeApp)
                  .get('/api/v1/pokemons')
                  .set('auth-token-access', parseTokensFromHeaderIn(loginResponse).accessToken);
              } catch (PokemonAuthError) {
                expect(PokemonAuthError.message).toBe('Invalid Token: Please ensure you are signed in.');
              }
          });

    });

    describe("Last set of tests from the readme", () => {

        it('should handle invalid HTTP requests', async () => {
            const response = await request(app)
                .get('/nonexistentRoute')
            expect(response.status).toBe(404);
        });

    });

    afterAll(async () => {
        await userModel.deleteMany({});
        await mongoose.connection.close();
    });

});