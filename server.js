const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const crypto = require("crypto");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

// SQLite Database setup
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  if (!exists) {
    db.run("CREATE TABLE Urls (id INTEGER PRIMARY KEY AUTOINCREMENT, original_url TEXT, short_url TEXT)");
    console.log("New table Urls created!");
  } else {
    console.log('Database "Urls" ready to go!');
  }
});

// Route for the main page
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// Endpoint to shorten a URL
const userCooldowns = {};
const COOLDOWN_PERIOD = 30000;

app.post("/shorten", (request, response) => {
  let ip = request.headers['x-forwarded-for'];
  ip = ip ? ip.split(',')[0] : request.connection.remoteAddress;
  console.log("Request recieved: " + ip);
  
  if (userCooldowns[ip] && Date.now() - userCooldowns[ip] < COOLDOWN_PERIOD) {
    const timeLeft = COOLDOWN_PERIOD - (Date.now() - userCooldowns[ip]);
    return response.send({ message: "error", error: `Please wait ${Math.ceil(timeLeft / 1000)} seconds before generating another URL.` });
  }

  let originalUrl = request.body.url;

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = 'http://' + originalUrl;
  }

  const shortUrl = crypto.randomBytes(4).toString("hex");

  db.run("INSERT INTO Urls (original_url, short_url) VALUES (?, ?)", [originalUrl, shortUrl], (err) => {
    if (err) {
      console.error("Error inserting into database:", err.message);
      return response.send({ message: "error", error: err.message });
    }

    // Set the cooldown
    userCooldowns[ip] = Date.now();
    response.send({ originalUrl, shortUrl });
  });
});


// Endpoint to redirect to the original URL
app.get("/:shortUrl", (request, response) => {
  const shortUrl = request.params.shortUrl;

  db.get("SELECT original_url FROM Urls WHERE short_url = ?", [shortUrl], (err, row) => {
    if (err) {
      return response.send({ message: "error", error: err.message });
    }
    if (row) {
      response.redirect(row.original_url);
    } else {
      response.send({ message: "URL not found" });
    }
  });
});

// Listen for requests
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
