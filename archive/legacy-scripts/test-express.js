const express = require('express');
const app = express();
try {
  app.get('*all', (req, res) => res.send('ok'));
  console.log("No error on *all");
} catch(e) {
  console.log("Error on *all:", e.message);
}
try {
  app.get('(.*)', (req, res) => res.send('ok'));
  console.log("No error on (.*)");
} catch(e) {
  console.log("Error on (.*):", e.message);
}
