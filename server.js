import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import knex from "knex";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

import configuration from "./knexfile.js";
const db = knex(configuration);

dotenv.config();
const app = express();

const { SECRET_KEY, PORT } = process.env;
console.log(SECRET_KEY)

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No JWT token provided" });
  }

  jwt.verify(token, SECRET_KEY, (error, user) => {
    if (error) {
        console.log(token, SECRET_KEY)
      return res.status(498).json({ error: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  });
};

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password){
        return res.status(400).send('Username and password are required')
    }

  try {
    const user = await db("users")
      .where({ username })
      .first()
    if (!user) {
      return res.status(401).json({ error: "Authentication failed: User not found" });
    }


    const isPasswordValid = "hashedpassword1" /*await bcrypt.compare(password, user.password)*/;
    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id, userName: user.username },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user", authenticateUser, (req, res) => {
    const authenticatedUser = req.user;
    console.log(authenticatedUser)
    res.json({ user: { id: authenticatedUser.id, username: 'john_doe', password: 'hashedpassword1' } });
});



const generateQrToken = () => {
    return crypto.randomBytes(16).toString("hex");
  };
  
  app.post("/generate-qr", (req, res) => {
    const qrToken = generateQrToken();
    // store qrToken in database instead of memory 
    qrCodes[qrToken] = { comments: [] };
    res.json({ qrToken });
  });
  
  app.post("/access-qr", authenticateUser, (req, res) => {
    const { qrToken } = req.body;
  
    if (!qrCodes[qrToken]) {
      return res.status(404).json({ error: "QR Code not found" });
    }
  
    if (qrCodes[qrToken].comments.some(comment => comment.userId === req.user.userId)) {
      return res.status(400).json({ error: "User has already commented" });
    }
  
    res.send("You can now comment.");
  });
  
  app.get("/comments", authenticateUser, (req, res) => {
    const { qrToken } = req.query;
  
    if (!qrToken || !qrCodes[qrToken]) {
      return res.status(404).json({ error: "QR Code not found" });
    }
  
    res.json({ comments: qrCodes[qrToken].comments });
  });
  
  app.post("/comments", authenticateUser, (req, res) => {
    const { qrToken, comment } = req.body;
  
    if (!qrCodes[qrToken]) {
      return res.status(404).json({ error: "QR Code not found" });
    }
  
    if (qrCodes[qrToken].comments.some(comment => comment.userId === req.user.userId)) {
      return res.status(400).json({ error: "User has already commented" });
    }
  
    qrCodes[qrToken].comments.push({
      userId: req.user.userId,
      comment,
      timestamp: new Date(),
    });
  
    res.json({ message: "Comment successfully posted" });
  });
  
  app.listen(PORT, () => {
  console.log("Listening on port:", PORT);
});