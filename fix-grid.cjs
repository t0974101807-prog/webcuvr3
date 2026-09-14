"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const targetOld = `<div className="grid grid-cols-2 gap-6">`;
const targetNew = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">`;
const lines = code.split("\n");
let modifiedCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(targetOld)) {
    lines[i] = lines[i].replace(targetOld, targetNew);
    modifiedCount++;
  }
}
const target2Old = `<div className="grid grid-cols-2 gap-4">`;
const target2New = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(target2Old)) {
    lines[i] = lines[i].replace(target2Old, target2New);
    modifiedCount++;
  }
}
if (modifiedCount > 0) {
  fs.writeFileSync("src/components/ERP.tsx", lines.join("\n"));
  console.log(`Updated ${modifiedCount} grid occurrences`);
} else {
  console.log("No occurrences found.");
}
