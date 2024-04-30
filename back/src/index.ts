import express from "express";
import routes from "./routes/index";
import 'dotenv/config'

import connect from './db/connect';

const app = express();

app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT;
connect()
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
