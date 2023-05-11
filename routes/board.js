const router = require("express").Router();

function isLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

router.use("/sub", isLogin);

router.get("/sports", (req, res) => {
  res.send("This is sports page");
});

router.get("/sub", (req, res) => {
  res.send("This is sub page.");
});

module.exports = router;
