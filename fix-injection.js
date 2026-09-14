const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// I want to inject {renderModals()} right before the last closing tags of EventsView's main return.
const searchStr = `        </div>{" "}\n        \n        \n      </div>\n    </div>\n  );\n}\nfunction RecordsView({`;

if (code.includes(searchStr)) {
    const replaceStr = `        </div>{" "}\n        {renderModals()}\n      </div>\n    </div>\n  );\n}\nfunction RecordsView({`;
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Injected renderModals() in EventsView.");
} else {
    console.log("Could not find the exact closing pattern of EventsView.");
    
    // Maybe try an alternative search
    const idx = code.indexOf("function RecordsView({");
    if (idx !== -1) {
        console.log(code.substring(idx - 100, idx + 20));
    }
}
