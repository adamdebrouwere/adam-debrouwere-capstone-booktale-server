import express from 'express';
// import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const  PORT = process.env.PORT || 8080;

// const corsOptions = {
//     origin: CORS_ORIGIN,
//     credentials: true,
// };

// app.use(cors())
// app.use(cors(corsOptions))
// app.use(express.json());

app.get('/', (req, res) => {
    res.send("<h1>Booktale backend connected</h1>")
})

app.listen(PORT, () => {
    console.log("Listening on port:", PORT);
  });