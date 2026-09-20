const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const importStr = 'import QRCode from "qrcode";\nimport LiveChatModal from "./LiveChatModal";';
if (!code.includes('import LiveChatModal')) {
    code = code.replace('import QRCode from "qrcode";', importStr);
}

const chatModalStart = '{/* Chat Modal */}';
const startIdx = code.indexOf(chatModalStart);

if (startIdx !== -1) {
    const afterStart = code.substring(startIdx);
    const endMatchStr = `        </div>\n      )}`;
    const findEnd = afterStart.indexOf(endMatchStr);
    
    if (findEnd !== -1) {
        const liveChatComponent = `{/* Chat Modal */}
      {showChatModal && (selectedRecord || viewingRecord) && (
        <LiveChatModal
          record={selectedRecord || viewingRecord}
          users={users}
          onClose={() => setShowChatModal(false)}
          language={language}
        />
      )}`;
      
        code = code.substring(0, startIdx) + liveChatComponent + code.substring(startIdx + findEnd + endMatchStr.length);
        fs.writeFileSync('src/components/ERP.tsx', code);
        console.log("Successfully patched ERP.tsx");
    } else {
        console.log("Failed to find end of Chat Modal");
    }
} else {
    console.log("Failed to find Chat Modal block.");
}
