const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// The block we want to extract is between `{showHistory && (` and the second closing `)}` (for showAddEvent)
const idx1 = code.indexOf('{showHistory && (');
const idx2 = code.indexOf('</>', idx1);

if (idx1 !== -1 && idx2 !== -1) {
    const modalsCode = code.substring(idx1, idx2);
    
    // Remove modals from inside if (selectedEvent)
    code = code.substring(0, idx1) + code.substring(idx2);
    
    // We actually need to insert it right before the last `</div>\n    </div>\n  );`
    // Let's use regex to find the end of EventsView
    const endPattern = '        {/* Add Event Modal */}\n      </div>\n    </div>\n  );';
    const replacePattern = '        {/* Add Event Modal */}\n' + modalsCode + '\n      </div>\n    </div>\n  );';
    
    code = code.replace(endPattern, replacePattern);
    
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Successfully moved modals in EventsView.");
} else {
    console.log("Could not find blocks.");
}
