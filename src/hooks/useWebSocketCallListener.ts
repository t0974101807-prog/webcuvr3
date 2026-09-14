import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface CallSession {
  id: string;
  phone: string;
  dossierId?: string | number;
  name: string;
  staffName: string;
  status: "DIALING" | "RINGING" | "CONNECTED" | "ENDED";
  start_time: string;
  answer_time?: string;
  end_time?: string;
  duration?: number;
  recordingUrl?: string;
}

interface UseWebSocketCallListenerProps {
  onDialing?: (call: CallSession) => void;
  onRinging?: (call: CallSession) => void;
  onConnected?: (call: CallSession) => void;
  onEnded?: (call: CallSession) => void;
}

export function useWebSocketCallListener({
  onDialing,
  onRinging,
  onConnected,
  onEnded
}: UseWebSocketCallListenerProps) {
  useEffect(() => {
    let socket: Socket;

    try {
      // Connect to the window origin socket.io server
      socket = io();

      socket.on("connect", () => {
        console.log("[useWebSocketCallListener] Telephony socket connected");
      });

      if (onDialing) {
        socket.on("telephony_dialing", onDialing);
      }
      if (onRinging) {
        socket.on("telephony_ringing", onRinging);
      }
      if (onConnected) {
        socket.on("telephony_connected", onConnected);
      }
      if (onEnded) {
        socket.on("telephony_ended", onEnded);
      }
    } catch (err) {
      console.error("[useWebSocketCallListener] Failed to initialize socket", err);
    }

    return () => {
      if (socket) {
        socket.off("connect");
        if (onDialing) socket.off("telephony_dialing");
        if (onRinging) socket.off("telephony_ringing");
        if (onConnected) socket.off("telephony_connected");
        if (onEnded) socket.off("telephony_ended");
        socket.disconnect();
      }
    };
  }, [onDialing, onRinging, onConnected, onEnded]);
}
