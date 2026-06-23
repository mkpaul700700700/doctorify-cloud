"use client";

import { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZIM } from "zego-zim-web";
import { useRouter } from "next/navigation";

interface GlobalListenerProps {
  userID: string;
  userName: string;
}

export default function ZegoGlobalListener({ userID, userName }: GlobalListenerProps) {
  const router = useRouter();
  const initRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{appointmentId: string} | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;

    if (!appID || !serverSecret) return;

    // Generate a token for the global listener
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      "global-listener-room",
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.addPlugins({ ZIM });

    // Provide a dummy config to prevent ZegoUIKitPrebuilt from throwing createSpan DOM errors 
    // when it internally receives offline messages.
    zp.setCallInvitationConfig({
      enableCustomCallInvitationWaitingPage: true,
      enableCustomCallInvitationDialog: true,
    });

    // Listen to custom raw messages
    const zim = ZIM.getInstance();
    if (zim) {
      zim.on('receivePeerMessage', (zim: any, { messageList }: any) => {
        messageList.forEach((msg: any) => {
          if (msg.type === 1) { // 1 = text message
            try {
              const data = JSON.parse(msg.message);
              if (data.type === "ring" && data.appointmentId) {
                // Ignore messages older than 60 seconds or without a timestamp (old messages)
                if (!data.timestamp || Date.now() - data.timestamp > 60000) {
                  return;
                }
                setIncomingCall({ appointmentId: data.appointmentId });
                // Play ringing sound
                if (!audioRef.current) {
                  audioRef.current = new Audio("https://zegocloud.github.io/zego_uikit_prebuilt_web/assets/ringtone1.mp4");
                  audioRef.current.loop = true;
                }
                audioRef.current.play().catch(e => console.log("Audio autoplay prevented"));
              }
            } catch(e) {}
          }
        });
      });
    }

  }, [userID, userName]);

  const acceptCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (incomingCall?.appointmentId) {
      router.push(`/call/${incomingCall.appointmentId}`);
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column",
      color: "white"
    }}>
      <h2 style={{ marginBottom: 20 }}>Incoming Video Call</h2>
      <p style={{ marginBottom: 40 }}>The patient has joined the consultation room.</p>
      <div style={{ display: "flex", gap: "20px" }}>
        <button 
          onClick={declineCall}
          style={{ backgroundColor: "#ef4444", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
        >
          Decline
        </button>
        <button 
          onClick={acceptCall}
          style={{ backgroundColor: "#10b981", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
