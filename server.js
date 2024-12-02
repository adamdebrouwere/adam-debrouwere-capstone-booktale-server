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
      return res.status(498).json({ error: "Token is invalid or expired" });
    }

    req.user = user;
    next();
  });
};

app.get("/pastTales/:user_id", async (req, res) => {
  const user_id = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "No User ID" });
  }

  try {
    const user_books = await db("comments")
      .join("qr_codes", "comments.qr_id", "=", "qr_codes.id")
      .join("books", "qr_codes.book_id", "=", "books.id")
      .where("comments.user_id", "=", user_id.user_id)
      .select("books.*", "comments.comment", "qr_codes.qr_code_id")
      .orderBy("books.created_at");

    res.status(200).json({ user_books });
  } catch (error) {
    console.error("Error during comment retrieval:", error);
    res.status(500).json({ error: "comment retrieval" });
  }
});

app.get("/authenticated", authenticateUser, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ message: "User Authenticated", user: req.user });
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }

  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and contain a lowercase letter, an uppercase letter, a number, and a special character.",
    });
  }

  try {
    const existingUser = await db("users").where({ email }).first();
    
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }
    
    const user_id = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [newUser] = await db("users")
      .insert({ user_id, username, email, password: hashedPassword })
      .returning(["id", "username", "email"]);
    res.status(201).json({
      message: "User created successfully!",
      user: {
        user_id: user_id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res
      .status(500)
      .json({ error: "duplicate username, email, or password not vaild" });
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
  const { title, author, coverUrl, publishDate, qrCodeUrl, qrCodeId } =
    req.body;

  if (!title || !qrCodeUrl || !qrCodeId) {
    return res.status(400).json({ error: "Missing title or qr code" });
  }

  try {
    const userId = req.user.userId;

    const [bookInfo] = await db("books")
      .insert({
        title: title,
        author: author,
        publish_date: publishDate,
        cover_url: coverUrl || null,
      })
      .returning("id");

    const [qrCode] = await db("qr_codes")
      .insert({
        qr_code_id: qrCodeId,
        qr_code_url: qrCodeUrl,
        book_id: bookInfo.id,
      })
      .returning("id");

    await db("user_qrs").insert({
      user_id: userId,
      qr_id: qrCode.id,
    });

    res.status(201).json({ message: "Booktale created!" });
  } catch (error) {
    console.error("Error creating booktale:", error);
    res.status(500).json({ error: "Server error when creating booktale" });
  }
});

app.get("/booktale/:qr_code_id", async (req, res) => {
  const { qr_code_id } = req.params;

  if (!qr_code_id) {
    return res.status(400).json({ error: "no id" });
  }

  try {
    const getQrId = await db("qr_codes")
      .select("id")
      .where({ qr_code_id: qr_code_id })
      .first();
    if (!getQrId) {
      res.status(400).json({ error: "No Qr Code Present" });
    }

    const comments = await db("comments")
      .where({ qr_id: getQrId.id })
      .orderBy("created_at", "desc");
    res.status(200).json({ comments });
  } catch (error) {
    console.error("error getting comments", error);
    res
      .status(500)
      .json({ error: "no booktale created with this id. Try again." });
  }
});

app.get("/bookInfo/:qr_code_id", async (req, res) => {
  const { qr_code_id } = req.params;
  try {
    const getBookInfo = await db("qr_codes")
      .join("books", "qr_codes.book_id", "books.id")
      .where("qr_codes.qr_code_id", qr_code_id)
      .select("books.*")
      .first();
    res.status(200).json({ getBookInfo });
  } catch (error) {
    console.error("error getting qr data:");
  }
});
app.post("/booktale/:qr_code_id", authenticateUser, async (req, res) => {
  const { qr_code_id } = req.params;
  const { comment, location, username } = req.body;
  const { userId } = req.user;
  console.log(location);

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ error: "empty comment" });
  }

  try {
    const qrId = await db("qr_codes")
      .where({ qr_code_id: qr_code_id })
      .select("id")
      .first();
    if (!qrId) {
      return res.status(404).json({ error: "no booktale found" });
    }

    const commented = await db("comments")
      .where({ qr_id: qrId.id, user_id: userId })
      .first();

    if (commented) {
      return res.status(400).json({ error: "User has already commented" });
    }

    const newComment = await db("comments")
      .insert({
        qr_id: qrId.id,
        user_id: userId,
        username: username,
        comment: comment,
        longitude: location.longitude,
        latitude: location.latitude,
        heading: location.heading,
        city: location.city,
        state: location.state,
        country: location.country,
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
