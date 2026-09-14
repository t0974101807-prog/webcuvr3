"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
code = code.replace("{t.addEventTitle}", "{eventFormData.id ? t.editEvent : t.addEventTitle}");
fs.writeFileSync("src/components/ERP.tsx", code);
console.log("Updated add/edit event modal title");
