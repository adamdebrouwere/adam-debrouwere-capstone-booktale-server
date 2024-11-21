import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knex from 'knex';
import configuration from './knexfile.js';
const db = knex(configuration);

dotenv.config();
const app = express();

const  PORT = process.env.PORT || 8080;

// const corsOptions = {
//     origin: CORS_ORIGIN,
//     credentials: true,
// };

app.use(cors())
// app.use(cors(corsOptions))
// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send("<h1>Booktale backend connected</h1>")
// })

app.get("/", async (req, res) => {
    try {
        const data = await db("books").select('*');

        res.json({ message: 'db connection connection success', data});
    } catch (error){
        console.error("error connecting to db", error)
        res.status(500).send("ERROR CONNECTING TO DB");
    }
})

app.listen(PORT, () => {
    console.log("Listening on port:", PORT);
  });