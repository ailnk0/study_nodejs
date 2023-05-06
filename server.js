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
async function run(obj) {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    if (obj != null) {
      await client.db("todoapp").collection("post").insertOne(obj);
      console.log("Data saved to MongoDB!");
    } else {
      console.log("There is no data to save to MongoDB!");
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

// if someone visit to /pet,
// then popup dialog related to pet
app.get("/pet", (req, res) => {
  res.send("This is pet page");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

app.post("/add", (req, res) => {
  const obj = {
    todoForToday: req.body.todoForToday,
    todoDetail: req.body.todoDetail,
  };
  run(obj).catch(console.dir);
});
