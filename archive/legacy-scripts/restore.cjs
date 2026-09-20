"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const badPattern = `  const handleDelete = () => {
  
  const renderModals = () => (`;
if (code.includes(badPattern)) {
  const modalsStart = code.indexOf("  const renderModals = () => (");
  const endStr = "      </div>\n    </div>\n  );";
  const modalsEndPattern = "        )}\n    </>\n  );";
  const modalsEnd = code.indexOf(modalsEndPattern, modalsStart) + modalsEndPattern.length;
  const restoredHandleDelete = `  const handleDelete = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowModal(false);
    }
  };`;
  const modalitiesCodeRaw = code.substring(modalsStart, modalsEnd);
  code = code.substring(0, code.indexOf("  const handleDelete = () => {")) + restoredHandleDelete + code.substring(modalsEnd);
  let eventsViewPattern = "function EventsView({";
  let eventsViewIndex = code.indexOf(eventsViewPattern);
  let eventsIfSelectedEventPattern = "  if (selectedEvent) {\n    return (\n      <>\n        {renderEventDetail()}\n        {renderModals()}\n      </>\n    );\n  }";
  let eventsIfIndex = code.indexOf(eventsIfSelectedEventPattern);
  if (eventsIfIndex === -1) {
    eventsIfSelectedEventPattern = "  if (selectedEvent) {\n    return (\n      <>\n        {renderEventDetail()}\n        {renderModals()}\n      </>\n    );\n  }";
  }
  code = code.substring(0, eventsIfIndex) + modalitiesCodeRaw + "\n\n" + code.substring(eventsIfIndex);
  fs.writeFileSync("src/components/ERP.tsx", code);
  console.log("Fixed ERP.tsx!");
} else {
  console.log("Could not find bad pattern.");
}
