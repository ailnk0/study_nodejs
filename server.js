require("dotenv").config();
const port = process.env.PORT || 8080;

const express = require("express");
const app = express();
app.use("/public", express.static("public"));
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(
  session({ secret: "keyboard cat", resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.DB_URL || "mongodb://localhost:27017";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});
const dbName = "todoapp";
const colNames = {
  post: "post",
  counter: "counter",
  users: "users",
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

async function insertOne(colName, query) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    if (query != null) {
      await col.insertOne(query);
    } else {
      console.log("There is no data to save to MongoDB!");
    }
  } finally {
    await client.close();
  }
}

async function find(colName, query) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    const documents = await col.find(query).toArray();
    return documents;
  } finally {
    await client.close();
  }
}

async function findOne(colName, query) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    const documents = await col.findOne(query);
    return documents;
  } finally {
    await client.close();
  }
}

async function updateOne(colName, query, updateQuery) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    await col.updateOne(query, updateQuery);
  } finally {
    await client.close();
  }
}

async function deleteOne(colName, query) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    const result = await col.deleteOne(query);
    return result;
  } finally {
    await client.close();
  }
}

async function aggregate(colName, pipeline) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colName);
    const result = await col.aggregate(pipeline).toArray();
    return result;
  } finally {
    await client.close();
  }
}

app.listen(port, () => {
  console.log("Server running on port " + port);
});

// if someone visit to /pet,
// then popup dialog related to pet
app.get("/pet", (req, res) => {
  res.send("This is pet page");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", isLogin, (req, res) => {
  res.render("write.ejs");
});

app.post("/add", (req, res) => {
  updateOne(
    colNames.counter,
    { name: "total_post" },
    { $inc: { total_post: 1 } }
  )
    .catch((err) => console.log(err))
    .then(() => {
      find(colNames.counter, { name: "total_post" })
        .catch((err) => console.log(err))
        .then((doc) => {
          let index = doc[0].total_post;
          const query = {
            _id: index,
            todoForToday: req.body.todoForToday,
            todoDetail: req.body.todoDetail,
            date: new Date(),
          };
          insertOne(colNames.post, query)
            .catch((err) => console.log(err))
            .then(() => {
              res.redirect("/list");
            });
        });
    });
});

app.get("/list", (req, res) => {
  find(colNames.post)
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("list.ejs", { posts: doc });
    });
});

app.delete("/delete", isLogin, (req, res) => {
  req.body._id = parseInt(req.body._id);
  deleteOne(colNames.post, { _id: req.body._id })
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
  findOne(colNames.post, { _id: id })
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("detail.ejs", { post: doc });
    });
});

app.get("/edit/:id", isLogin, (req, res) => {
  const id = parseInt(req.params.id);
  findOne(colNames.post, { _id: id })
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("edit.ejs", { post: doc });
    });
});

app.put("/edit", (req, res) => {
  req.body._id = parseInt(req.body._id);
  req.body.date = new Date();
  updateOne(colNames.post, { _id: req.body._id }, req.body)
    .catch((err) => console.log(err))
    .then(() => {
      res.redirect("/detail/" + req.body._id);
    });
});

app.get("/login-fail", (req, res) => {
  res.send("Failed to login");
});

app.get("/is-login", (req, res) => {
  res.status(200).send({ result: req.user });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    console.log(err);
    res.redirect("/");
  });
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login-fail" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/search", (req, res) => {
  const pipeline = [
    {
      $search: {
        index: "todoForToday",
        text: {
          query: req.query.value,
          path: ["todoForToday", "todoDetail"],
        },
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        todoForToday: 1,
        todoDetail: 1,
        date: 1,
      },
    },
  ];
  aggregate(colNames.post, pipeline)
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("search-list.ejs", { posts: doc });
    });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (email, pw, done) {
      findOne(colNames.users, { email: email })
        .catch((err) => {
          console.log(err);
          return done(err);
        })
        .then((doc) => {
          if (!doc)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (pw == doc.password) {
            return done(null, doc);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.email);
});

passport.deserializeUser(function (email, done) {
  findOne(colNames.users, { email: email })
    .catch((err) => {
      console.log(err);
      return done(err);
    })
    .then((doc) => {
      done(null, doc);
    });
});

function isLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}
