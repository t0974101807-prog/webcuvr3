"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const toReplace = `  };

  if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowModal(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm`;
const replacement = `  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm`;
code = code.replace(toReplace, replacement);
fs.writeFileSync("src/components/ERP.tsx", code);
console.log("Fixed duplicated if-block in ERP!");
