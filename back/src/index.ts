import express from "express";
import expert from "./routes/experts";

const app = express();

app.use(express.json());
app.use("/api/experts", expert);

const PORT = 3000;

app.get("/ping", (_req, res) => {
  console.log("GET PING");
  res.send("run server on 3000...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
