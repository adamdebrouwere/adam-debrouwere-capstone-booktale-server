import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";


export const userAuthenticated = async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ message: "User Authenticated", user: req.user });
  };

export const signUpUser = async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
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
      user: { user_id, username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during sign-up." });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json( { error: "Username and password are required"} );
  }
  
  if (!username) {
    return res.status(400).json( { error: "Username required"} );
  }

  if (!password) {
    return res.status(400).json( { error: "Password are required"} );
  }


  try {
    const user = await db("users").where({ username }).first();
    if (!user) return res.status(401).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user.id, userName: user.username }, process.env.SECRET_KEY, { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};