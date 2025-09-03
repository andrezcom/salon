import mongoose from "mongoose";

async function connect() {
  if (!process.env.URLBD) {
    console.error('The env URL de BD is empty');
    return;
  }
  try {
    await mongoose.connect(process.env.URLBD)
    console.log('Connect to DB');
  }
  catch (err) {
    console.error('Error connecting to DB: ' + err);
  }
}

export default connect;