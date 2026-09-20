"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const targetEditBlock = `      if (selectedEvent && selectedEvent.id === eventFormData.id) {
        setSelectedEvent({
          ...selectedEvent,
          title: eventFormData.title,
          date,
          start: eventFormData.startTime,
          end: eventFormData.endTime,
          type: eventFormData.type,
          location: eventFormData.location,
          color,
          icon,
        });
      }`;
const replacementEditBlock = `      if (selectedEvent && selectedEvent.id === eventFormData.id) {
        const updatedEventInfo = {
          ...selectedEvent,
          title: eventFormData.title,
          date,
          start: eventFormData.startTime,
          end: eventFormData.endTime,
          type: eventFormData.type,
          location: eventFormData.location,
          color,
          icon,
        };
        setSelectedEvent(updatedEventInfo);
        
        // Also update the main events array
        setEvents(events.map(e => e.id === eventFormData.id ? updatedEventInfo : e));
      }`;
code = code.replace(targetEditBlock, replacementEditBlock);
fs.writeFileSync("src/components/ERP.tsx", code);
console.log("Fixed handleSaveEvent to properly update events array");
