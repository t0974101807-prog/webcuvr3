"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const idx1 = code.indexOf("{showHistory && (");
const idx2 = code.indexOf("</>", idx1);
if (idx1 !== -1 && idx2 !== -1) {
  const modalsCode = code.substring(idx1, idx2);
  code = code.substring(0, idx1) + code.substring(idx2);
  const endPattern = "        {/* Add Event Modal */}\n      </div>\n    </div>\n  );";
  const replacePattern = "        {/* Add Event Modal */}\n" + modalsCode + "\n      </div>\n    </div>\n  );";
  code = code.replace(endPattern, replacePattern);
  fs.writeFileSync("src/components/ERP.tsx", code);
  console.log("Successfully moved modals in EventsView.");
} else {
  console.log("Could not find blocks.");
}
