const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// The messed up part is inside CustomCalendar's handleDelete
const badPattern = `  const handleDelete = () => {
  
  const renderModals = () => (`;

if (code.includes(badPattern)) {
    // Find where renderModals() ends
    const modalsStart = code.indexOf('  const renderModals = () => (');
    const endStr = '      </div>\n    </div>\n  );';
    // wait, where is the end of renderModals? it's `</>\n  );`
    const modalsEndPattern = '        )}\n    </>\n  );';
    const modalsEnd = code.indexOf(modalsEndPattern, modalsStart) + modalsEndPattern.length;
    
    // We need to restore handleDelete
    const restoredHandleDelete = `  const handleDelete = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowModal(false);
    }
  };`;
    
    // The actual extracted modalities code can be retrieved
    const modalitiesCodeRaw = code.substring(modalsStart, modalsEnd);
    
    code = code.substring(0, code.indexOf('  const handleDelete = () => {')) + restoredHandleDelete + code.substring(modalsEnd);
    
    // Now we must inject `renderModals` into `EventsView`
    // First, find EventsView
    let eventsViewPattern = 'function EventsView({';
    let eventsViewIndex = code.indexOf(eventsViewPattern);
    
    // Let's inject renderModals right before the first `return (` of EventsView OR right before the `if (selectedEvent)` inside EventsView
    let eventsIfSelectedEventPattern = '  if (selectedEvent) {\n    return (\n      <>\n        {renderEventDetail()}\n        {renderModals()}\n      </>\n    );\n  }';
    let eventsIfIndex = code.indexOf(eventsIfSelectedEventPattern);
    if(eventsIfIndex === -1) {
        // It might be different because I changed it
        eventsIfSelectedEventPattern = '  if (selectedEvent) {\n    return (\n      <>\n        {renderEventDetail()}\n        {renderModals()}\n      </>\n    );\n  }';
    }
    
    code = code.substring(0, eventsIfIndex) + modalitiesCodeRaw + '\n\n' + code.substring(eventsIfIndex);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Fixed ERP.tsx!");
} else {
    console.log("Could not find bad pattern.");
}
