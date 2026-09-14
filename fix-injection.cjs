"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const searchStr = `        </div>{" "}
        
        
      </div>
    </div>
  );
}
function RecordsView({`;
if (code.includes(searchStr)) {
  const replaceStr = `        </div>{" "}
        {renderModals()}
      </div>
    </div>
  );
}
function RecordsView({`;
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync("src/components/ERP.tsx", code);
  console.log("Injected renderModals() in EventsView.");
} else {
  console.log("Could not find the exact closing pattern of EventsView.");
  const idx = code.indexOf("function RecordsView({");
  if (idx !== -1) {
    console.log(code.substring(idx - 100, idx + 20));
  }
}
