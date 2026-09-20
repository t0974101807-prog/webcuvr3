"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const showAddEventStart = code.indexOf("{showAddEvent && (");
const showAddEventEndStr = "            </div>\n          </div>\n        )}";
const showAddEventEnd = code.indexOf(showAddEventEndStr, showAddEventStart) + showAddEventEndStr.length;
if (showAddEventStart !== -1 && showAddEventEnd !== -1) {
  const showAddEventCode = code.substring(showAddEventStart, showAddEventEnd);
  code = code.substring(0, showAddEventStart) + code.substring(showAddEventEnd);
  const renderModalsEndStr = "}    </>\n  );";
  const insertPoint = code.indexOf("    </>\n  );\n\n  if (selectedEvent) {");
  if (insertPoint !== -1) {
    code = code.substring(0, insertPoint) + "      " + showAddEventCode + "\n" + code.substring(insertPoint);
    fs.writeFileSync("src/components/ERP.tsx", code);
    console.log("Successfully moved showAddEvent into renderModals!");
  } else {
    console.log("Could not find insert point!");
  }
} else {
  console.log("Could not find showAddEvent block!");
}
