import React from "react";
import LiveChatModal from "../LiveChatModal";
import InternalChatModal from "../InternalChatModal";

interface ERPChatModalsProps {
  showChatModal: boolean;
  showInternalChatModal: boolean;
  selectedRecord?: any;
  viewingRecord?: any;
  users?: any[];
  user?: any;
  language: "vi" | "en";
  onCloseChat: () => void;
  onCloseInternalChat: () => void;
}

export default function ERPChatModals({
  showChatModal,
  showInternalChatModal,
  selectedRecord,
  viewingRecord,
  users,
  user,
  language,
  onCloseChat,
  onCloseInternalChat,
}: ERPChatModalsProps) {
  const record = selectedRecord || viewingRecord;

  return (
    <>
      {showChatModal && record && (
        <LiveChatModal
          record={record}
          users={users || []}
          onClose={onCloseChat}
          language={language}
        />
      )}
      {showInternalChatModal && record && (
        <InternalChatModal
          record={record}
          user={user}
          onClose={onCloseInternalChat}
          language={language}
        />
      )}
    </>
  );
}
