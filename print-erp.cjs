"use strict";
const fs = require("fs");
const lines = fs.readFileSync("src/components/ERP.tsx", "utf8").split("\n");
console.log(lines.slice(1260, 1320).join("\n"));
