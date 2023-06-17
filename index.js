const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//  middle ware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vdrifst.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.scgvwg0.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("sportsClassDB").collection("users");
    const sportClassClaCollection = client
      .db("sportsClassDB")
      .collection("class");
    const slectedClassCollection = client
      .db("sportsClassDB")
      .collection("slectedClass");

    //  here is JWT

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    app.get("/class", async (req, res) => {
      const result = await sportClassClaCollection.find().toArray();
      res.send(result);
    });

    app.get("/class", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      } else {
        const query = { email: email };
        const result = await sportClassClaCollection.find(query).toArray();
        res.send(result);
      }
    });
    app.post("/class", async (req, res) => {
      const newItem = req.body;
      try {
        const result = await sportClassClaCollection.insertOne(newItem);
        res.send({ insertedCount: result.insertedCount });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to add class" });
      }
    });

    //  here is post methdor select class
    app.get("/slectedClass", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      } else {
        const query = { email: email };
        const result = await slectedClassCollection.find(query).toArray();
        res.send(result);
      }
    });

    app.post("/slectedClass", async (req, res) => {
      const slectsClass = req.body;
      const result = await slectedClassCollection.insertOne(slectsClass);
      res.send(result);
    });
    app.delete("/slectedClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await slectedClassCollection.deleteOne(query);
      res.send(result);
    });

    // here is User relatate APi

    app.get("/users", async (req, res) => {
      const user = await usersCollection.find().toArray();
      res.send(user);
    });
    app.post("/users", async (req, res) => {
      const users = req.body;

      const queary = { email: users.email };
      const existingEmail = await usersCollection.findOne(queary);
      console.log("existing User", existingEmail);
      if (existingEmail) {
        return res.send({ message: "user allready added" });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    // Admin APi
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ----------------

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!4535"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
