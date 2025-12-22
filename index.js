const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.POST || 3000;

//Middleware
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://movie-vault-52.netlify.app"],
    credentials: true,
  })
);

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
    // await client.connect();

    const db = client.db("Movie_Vault_DB");
    const movieCollection = db.collection("movie");
    const userCollection = db.collection("users");
    const featuredCollection = db.collection("featured");
    const watchedCollection = db.collection("watched");

    // ========== User Related API ========== //
    //Get User
    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    //Post API create user
    app.post("/user", async (req, res) => {
      const user = req.body;
      user.createdAt = new Date();

      //check user already exit or not
      const email = user.email;
      const userExits = await userCollection.findOne({ email });

      if (userExits) {
        return res.send({ message: "User already exits" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //========== Movie Related API ==========//
    //get. Get all movie
    app.get("/movie", async (req, res) => {
      const {
        limit = 0,
        sort = "createdAt",
        order,
        genres,
        minRating,
        maxRating,
      } = req.query;

      const query = {};

      // Filter by multiple genres
      if (genres) {
        query.genre = {
          $in: genres.split(","),
        };
      }

      // Filter by rating range
      if (minRating || maxRating) {
        query.rating = {};
        if (minRating) query.rating.$gte = Number(minRating);
        if (maxRating) query.rating.$lte = Number(maxRating);
      }

      //   Sort
      const sortOption = {};
      sortOption[sort] = order === "asc" ? 1 : -1;

      const result = await movieCollection
        .find(query)
        .sort(sortOption)
        .limit(Number(limit))
        .toArray();
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

    // ========== Featured Movie Related API ========== //
    //Get Featured Movie
    app.get("/featured-movie", async (req, res) => {
      const result = await featuredCollection.find().toArray();
      res.send(result);
    });

    // ===== ===== Watch list Related Api ===== =====//
    // Get API. pipeline / aggregate
    app.get("/watched", async (req, res) => {
      const email = req.query.email;

      const result = await watchedCollection
        .aggregate([
          {
            $match: { userEmail: email },
          },
          // lessonId is a String, we need to make it ObjectId
          {
            $addFields: {
              lessonObjectId: { $toObjectId: "$movieId" },
            },
          },
          {
            $lookup: {
              from: "movie",
              localField: "lessonObjectId",
              foreignField: "_id",
              as: "movie",
            },
          },
          {
            $unwind: "$movie",
          },
        ])
        .toArray();

      res.send(result);
    });

    //Check Watched Exits or not
    app.get("/watched/check", async (req, res) => {
      const { movieId, userEmail } = req.query;

      const watched = await watchedCollection.findOne({
        movieId,
        userEmail,
      });

      res.send({ isWatched: !!watched });
    });

    //Post API.
    app.post("/watched", async (req, res) => {
      const watched = req.body;
      const { movieId, userEmail } = req.body;
      watched.createdAt = new Date();

      // Check already watched
      const exists = await watchedCollection.findOne({
        movieId,
        userEmail,
      });
      if (exists) {
        return res.send({ message: "Already have" });
      }

      // Added new report
      const result = await watchedCollection.insertOne(watched);
      res.send(result);
    });

    //Delete API
    app.delete("/watched", async (req, res) => {
      const { movieId, userEmail } = req.body;

      const result = await watchedCollection.deleteOne({
        movieId,
        userEmail,
      });
      res.send(result);
    });

    //
    //
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
