const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// Modals are currently at the bottom of EventsView.
const startIdx = code.indexOf('{/* Add Event Modal */}');
const endIdx = code.indexOf('          </div>\n        )}', startIdx);
if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find modals block.");
    process.exit(1);
}

// Extract modals block
let modalsCode = code.substring(startIdx + '{/* Add Event Modal */}\n'.length, endIdx + '          </div>\n        )}'.length);

// Also remove it from the bottom
code = code.substring(0, startIdx) + code.substring(endIdx + '          </div>\n        )}'.length);

// Now, search for where we want to define `renderModals`
const renderModalsCode = `
  const renderModals = () => (
    <>
      ${modalsCode.split('\n').join('\n      ')}
    </>
  );
`;

// Insert `renderModalsCode` before `if (selectedEvent)`
const selectedEventIfIdx = code.indexOf('  if (selectedEvent) {');
code = code.substring(0, selectedEventIfIdx) + renderModalsCode + '\n' + code.substring(selectedEventIfIdx);

// Now, update both `return` branches to include `{renderModals()}`
// 1. Inside `if (selectedEvent)`
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

// 2. The main return already has `{renderModals()}`? No, I need to add it at the bottom.
// In the current main return, I removed it. Now add `{renderModals()}` at the end of the main return.
const endOfMainReturn = `      </div>
    </div>
  );`;
code = code.replace(endOfMainReturn, `        {renderModals()}
      </div>
    </div>
  );`);

fs.writeFileSync('src/components/ERP.tsx', code);
console.log("Successfully extracted and injected modals.");
