import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import knex from "knex";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import configuration from "./knexfile.js";
const db = knex(configuration);

dotenv.config();
const app = express();

const { SECRET_KEY, PORT } = process.env;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const authenticateUser = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No JWT token provided" });
  }

  jwt.verify(token, SECRET_KEY, (error, user) => {
    if (error) {
      console.log(token, SECRET_KEY);
      return res.status(498).json({ error: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  });
};

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "All fields (username, email, password) are required." });
  }

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [newUser] = await db("users")
      .insert({ username, email, password: hashedPassword })
      .returning(["id", "username", "email"]);
    res.status(201).json({
      message: "User created successfully!",
      user: {
        id: uuidv4(),
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    const user = await db("users").where({ username }).first();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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
    res.status(500).json({ error: "Internal server error when creating user" });
  }
});

app.get("/user", authenticateUser, (req, res) => {
  const authenticatedUser = req.user;

  res.json({
    user: {
      id: authenticatedUser.userId,
      username: authenticatedUser.userName,
    },
  });
});

app.post("/booktale", authenticateUser, async (req, res) => {
  const { title, author, qrCodeUrl, coverUrl, qrCodeId } = req.body;

  if (!title || !qrCodeUrl || !qrCodeId) {
    return res.status(400).json({ error: "Missing title or qr code" });
  }
  // console.log(title, author, qrCodeUrl, coverUrl, qrCodeId)

  try {
    const userId = req.user.userId;
    console.log("trigge1")

    const [bookQrCode] = await db("book_qr_codes").insert(
      {
        qr_code_id: qrCodeId,
        qr_code_url: qrCodeUrl,
        title: title,
        author: author[0],
        cover_url: coverUrl || null,
      }
    ).returning("id");
    console.log("trigge2")
    

    await db("user_books").insert({
      user_id: userId,
      book_qr_code_id: bookQrCode.id,
    });

    res.status(201).json({ message: "Booktale created!" });
  } catch (error) {
    console.error("Error creating booktale:", error);
    res.status(500).json({ error: "Server error when creating booktale" });
  }
});

app.post("/access-qr", authenticateUser, (req, res) => {
  const { qrToken, userId } = req.body;

  if (!qrCodes[qrToken]) {
    return res.status(404).json({ error: "QR Code not found" });
  }

  if (
    qrCodes[qrToken].comments.some(
      (comment) => comment.userId === req.user.userId
    )
  ) {
    return res.status(400).json({ error: "User has already commented" });
  }

  res.send("You can now comment.");
});


app.post("/comments/:bookId", authenticateUser, async (req, res) => {
  const { bookId } = req.params;
  const { comment } = req.body;
  const { userId } = req.user;

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ error: "empty comment" });
  }

  try {
    const book = await knex("book_qr_codes").where({ id: bookId }).first();

    if (!book) {
      return res.status(404).json({ error: "no book found" });
    }
    const commented = await knex("comments")
      .where({ book_qr_code_id: bookId, user_id: userId })
      .first();

    if (commented) {
      return res.status(400).json({ error: "User has already commented" });
    }

    const newComment = await knex("comments")
      .insert({
        book_qr_code_id: bookId,
        user_id: userId,
        comment,
      })
      .returning("*");


    res
      .status(201)
      .json({ message: "Comment successfully posted", comment: newComment });
  } catch (error) {
    console.error("error posting comment:", error);
    res.status(500).json({ error: "no comment posted. Try again." });
  }
});

app.listen(PORT, () => {
  console.log("Listening on port:", PORT);
});
