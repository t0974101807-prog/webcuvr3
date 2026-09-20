const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// Add import
if (!code.includes('import InternalChatModal')) {
    code = code.replace('import LiveChatModal from "./LiveChatModal";', 'import LiveChatModal from "./LiveChatModal";\nimport InternalChatModal from "./InternalChatModal";');
}

// Add state
if (!code.includes('const [showInternalChatModal, setShowInternalChatModal] = useState(false);')) {
    code = code.replace('const [showChatModal, setShowChatModal] = useState(false);', 'const [showChatModal, setShowChatModal] = useState(false);\n  const [showInternalChatModal, setShowInternalChatModal] = useState(false);');
}

// Add button
const chatBtnStr = `              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowChatModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white font-medium transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 shadow-sm"
              >
                <MessageSquare size={18} />
                {t.chat}
              </button>`;
const newBtns = `              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowChatModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 active:scale-95 shadow-sm"
              >
                <MessageSquare size={18} />
                {language === "vi" ? "Khách hàng" : "Client Chat"}
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowInternalChatModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white font-medium transition-all duration-300 hover:bg-indigo-700 active:scale-95 shadow-sm"
              >
                <Users size={18} />
                {language === "vi" ? "Nội bộ" : "Internal Chat"}
              </button>`;

if (code.includes('className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white font-medium transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 shadow-sm"')) {
    code = code.replace(chatBtnStr, newBtns);
}

// Add InternalChatModal component
const chatModalBlock = `{/* Chat Modal */}
      {showChatModal && (selectedRecord || viewingRecord) && (
        <LiveChatModal
          record={selectedRecord || viewingRecord}
          users={users}
          onClose={() => setShowChatModal(false)}
          language={language}
        />
      )}`;
      
const internalChatModalBlock = `
      {/* Internal Chat Modal */}
      {showInternalChatModal && (selectedRecord || viewingRecord) && (
        <InternalChatModal
          record={selectedRecord || viewingRecord}
          user={user}
          onClose={() => setShowInternalChatModal(false)}
          language={language}
        />
      )}`;

if (!code.includes('<InternalChatModal')) {
    code = code.replace(chatModalBlock, chatModalBlock + internalChatModalBlock);
}

fs.writeFileSync('src/components/ERP.tsx', code);
