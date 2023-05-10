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

async function findUser(email_id) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.users);
    const documents = await col.findOne({ email: email_id });
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

async function updatePost(id, obj) {
  try {
    await client.connect();
    const col = client.db(dbName).collection(colNames.post);
    const result = await col.updateOne(
      { _id: id },
      {
        $set: {
          todoDetail: obj.todoDetail,
          todoForToday: obj.todoForToday,
          date: obj.date,
        },
      }
    );
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

app.get("/write", isLogin, (req, res) => {
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

app.delete("/delete", isLogin, (req, res) => {
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

app.get("/edit/:id", isLogin, (req, res) => {
  const id = parseInt(req.params.id);
  findPost(id)
    .catch((err) => console.log(err))
    .then((doc) => {
      res.render("edit.ejs", { post: doc });
    });
});

app.put("/edit", (req, res) => {
  req.body._id = parseInt(req.body._id);
  req.body.date = new Date();
  updatePost(req.body._id, req.body)
    .catch((err) => console.log(err))
    .then((result) => {
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

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (email, pw, done) {
      findUser(email)
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
  findUser(email)
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
