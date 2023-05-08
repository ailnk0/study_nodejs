const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://ailnk0:p52OD5ZpiEJdq412@cluster0.86dc03b.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const dbName = "todoapp";

const colNames = {
  post: "post",
  counter: "counter",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

async function insertPost(obj) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.post);
    if (obj != null) {
      await col.insertOne(obj);
      console.log("Data saved to MongoDB!");
    } else {
      console.log("There is no data to save to MongoDB!");
    }
  } finally {
    await client.close();
  }
}

async function findPosts() {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.post);
    const documents = await col.find({}).toArray();
    return documents;
  } finally {
    await client.close();
  }
}

async function findPost(id) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.post);
    const documents = await col.findOne({ _id: id });
    return documents;
  } finally {
    await client.close();
  }
}

async function findCounter() {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.counter);
    const documents = await col.find({}).toArray();
    return documents;
  } finally {
    await client.close();
  }
}

async function updateCounter() {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.counter);
    await col.updateOne({ name: "total_post" }, { $inc: { total_post: 1 } });
  } finally {
    await client.close();
  }
}

async function deletePost(id) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.post);
    const result = await col.deleteOne({ _id: id });
    return result;
  } finally {
    await client.close();
  }
}

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

// if someone visit to /pet,
// then popup dialog related to pet
app.get("/pet", (req, res) => {
  res.send("This is pet page");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.post("/add", (req, res) => {
  updateCounter()
    .catch((err) => console.log(err))
    .then(() => {
      findCounter()
        .catch((err) => console.log(err))
        .then((doc) => {
          let index = doc[0].total_post;
          const obj = {
            _id: index,
            todoForToday: req.body.todoForToday,
            todoDetail: req.body.todoDetail,
            date: new Date(),
          };
          insertPost(obj)
            .catch((err) => console.log(err))
            .then(() => {
              res.redirect("/list");
            });
        });
    });
});

app.get("/list", (req, res) => {
  findPosts()
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("list.ejs", { posts: doc });
    });
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  deletePost(req.body._id)
    .catch((err) => console.log(err))
    .then((result) => {
      if (result.deletedCount === 0) {
        res.status(404).send("No document found to delete");
      } else {
        res.status(200).send(`${result.deletedCount} document(s) deleted`);
      }
    });
});

app.get("/detail/:id", (req, res) => {
  const id = parseInt(req.params.id);
  findPost(id)
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("detail.ejs", { post: doc });
    });
});
