import express from "express";
import routes from "./routes/index";
import 'dotenv/config'
const cors = require('cors')

import connect from './db/connect';

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);




const PORT = process.env.PORT;
connect()
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
/* app.use((err, _req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
}); */
