const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    //get. Get all movie
    app.get("/movie", async (req, res) => {
      const query = {};
      const result = await movieCollection.find().toArray();
      res.send(result);
    });

    // Get single movie by ID
    app.get("/movie/:id", async (req, res) => {
      const { id } = req.params;

      const movie = await movieCollection.findOne({ _id: new ObjectId(id) });
      res.send(movie);
    });

    //Get all Movie by email
    app.get("/movie-user", async (req, res) => {
      const email = req.query.email;
      const query = {};

      if (email) {
        query.addedBy = email;
      }

      const result = await movieCollection.find(query).toArray();
      res.send(result);
    });

    //post
    app.post("/movie", async (req, res) => {
      const movie = req.body;

      const result = await movieCollection.insertOne(movie);
      res.send(result);
    });

    //Update movie
    app.patch("/movie/:id", async (req, res) => {
      const movie = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          title: movie.title,
          director: movie.director,
          cast: movie.cast,
          genre: movie.genre,
          language: movie.language,
          country: movie.country,
          plotSummary: movie.plotSummary,
          releaseYear: movie.releaseYear,
          duration: movie.duration,
          rating: movie.rating,
          posterUrl: movie.posterUrl,
        },
      };

      const result = await movieCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //Delete movie
    app.delete("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await movieCollection.deleteOne(query);
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
