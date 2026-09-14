const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// 1. Extract showAddEvent block
const showAddEventStart = code.indexOf('{showAddEvent && (');
const showAddEventEndStr = '            </div>\n          </div>\n        )}';
const showAddEventEnd = code.indexOf(showAddEventEndStr, showAddEventStart) + showAddEventEndStr.length;

if (showAddEventStart !== -1 && showAddEventEnd !== -1) {
    const showAddEventCode = code.substring(showAddEventStart, showAddEventEnd);
    // Remove it from current location
    code = code.substring(0, showAddEventStart) + code.substring(showAddEventEnd);
    
    // 2. Insert it into renderModals()
    const renderModalsEndStr = '}    </>\n  );'; 
    // Let's just find `</>\n  );\n\n  if (selectedEvent) {`
    const insertPoint = code.indexOf('    </>\n  );\n\n  if (selectedEvent) {');
    
    if (insertPoint !== -1) {
        code = code.substring(0, insertPoint) + '      ' + showAddEventCode + '\n' + code.substring(insertPoint);
        fs.writeFileSync('src/components/ERP.tsx', code);
        console.log('Successfully moved showAddEvent into renderModals!');
    } else {
        console.log('Could not find insert point!');
    }
} else {
    console.log('Could not find showAddEvent block!');
}
