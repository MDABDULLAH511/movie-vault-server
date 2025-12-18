const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.POST || 3000;

//Middleware
app.use(express.json());
app.use(cors());

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("Movie_Vault_DB");
    const movieCollection = db.collection("movie");

    app.get("/movie", async (req, res) => {
      const query = {};
      const result = await movieCollection.find().toArray();
      res.send(result);
    });

    //post
    app.post("/movie", async (req, res) => {
      const movie = req.body;

      const result = await movieCollection.insertOne(movie);
      res.send(result);
    });

    //
    //
    //
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
