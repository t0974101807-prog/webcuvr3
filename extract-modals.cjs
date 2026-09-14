"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const startIdx = code.indexOf("{/* Add Event Modal */}");
const endIdx = code.indexOf("          </div>\n        )}", startIdx);
if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find modals block.");
  process.exit(1);
}
let modalsCode = code.substring(startIdx + "{/* Add Event Modal */}\n".length, endIdx + "          </div>\n        )}".length);
code = code.substring(0, startIdx) + code.substring(endIdx + "          </div>\n        )}".length);
const renderModalsCode = `
  const renderModals = () => (
    <>
      ${modalsCode.split("\n").join("\n      ")}
    </>
  );
`;
const selectedEventIfIdx = code.indexOf("  if (selectedEvent) {");
code = code.substring(0, selectedEventIfIdx) + renderModalsCode + "\n" + code.substring(selectedEventIfIdx);
const selectedEventReturn = `  if (selectedEvent) {
    return <>{renderEventDetail()}</>;
  }`;
const newSelectedEventReturn = `  if (selectedEvent) {
    return (
      <>
        {renderEventDetail()}
        {renderModals()}
      </>
    );
  }`;
code = code.replace(selectedEventReturn, newSelectedEventReturn);
const endOfMainReturn = `      </div>
    </div>
  );`;
code = code.replace(endOfMainReturn, `        {renderModals()}
      </div>
    </div>
  );`);
fs.writeFileSync("src/components/ERP.tsx", code);
console.log("Successfully extracted and injected modals.");
