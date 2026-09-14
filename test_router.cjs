const express = require("express");
const app = express();
app.get('*all', (req, res) => {
  res.send("matched *all");
});
app.get('/something', (req, res) => {
  res.send("this shouldn't match *all if literal");
});

app.listen(3005, () => {
  console.log("running");
  fetch("http://localhost:3005/test")
    .then(r => r.text())
    .then(t => { console.log("/test response: " + t); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
});
