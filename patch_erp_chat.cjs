const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const importStr = 'import LiveChatModal from "./LiveChatModal";\n';
if (!code.includes('import LiveChatModal')) {
    code = code.replace('import QRCode', importStr + 'import QRCode');
}

const chatModalStart = '{/* Chat Modal */}';
const chatModalEnd = '                  <Send size={18} />\n                </button>\n              </form>\n            </div>\n          </div>\n        </div>\n      )}';

const startIdx = code.indexOf(chatModalStart);
const endIdx = code.indexOf(chatModalEnd);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const liveChatComponent = `{/* Chat Modal */}
      {showChatModal && (selectedRecord || viewingRecord) && (
        <LiveChatModal
          record={selectedRecord || viewingRecord}
          users={users}
          onClose={() => setShowChatModal(false)}
          language={language}
        />
      )}`;
    code = code.substring(0, startIdx) + liveChatComponent + code.substring(endIdx + chatModalEnd.length);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Successfully patched ERP.tsx");
} else {
    console.log("Failed to find Chat Modal block. startIdx:", startIdx, "endIdx:", endIdx);
}
