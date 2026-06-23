"use client";

import { useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZIM } from "zego-zim-web";

interface VideoCallProps {
  roomID: string;
  userID: string;
  userName: string;
  role?: string;
  doctorId?: string;
  doctorName?: string | null;
  appointmentId?: string;
}

export default function ZegoVideoCall({ roomID, userID, userName, role, doctorId, doctorName, appointmentId }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const zpRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (joinedRef.current) return;
    joinedRef.current = true;

    // These MUST be filled in .env for this to work
    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;

    if (!appID || !serverSecret) {
      console.error("ZegoCloud keys are missing in .env!");
      containerRef.current.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: red;">
          <h2>Video Call System Not Configured</h2>
          <p>The NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET environment variables are missing.</p>
          <p>Please add them to your .env file to enable video calling.</p>
        </div>
      `;
      return;
    }

    const initMeeting = async () => {
      // Generate the token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      // Create Zego instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // Store zp instance in a ref so we can destroy it on unmount
      zpRef.current = zp;

      // Add ZIM plugin for call invitations
      zp.addPlugins({ ZIM });

      // Start the call
      zp.joinRoom({
        container: containerRef.current,
        sharedLinks: [
          {
            name: "Copy Meeting Link",
            url: window.location.href,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference, // Using VideoConference to allow inviting while in the room
        },
        showScreenSharingButton: true,
        showPreJoinView: role === "DOCTOR" ? false : true,
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        onJoinRoom: () => {
          // If patient joins, notify the doctor using raw ZIM message
          if (role === "PATIENT" && doctorId && appointmentId) {
            const zim = ZIM.getInstance();
            if (zim) {
              const messageObj = { type: 1, message: JSON.stringify({ type: "ring", appointmentId, timestamp: Date.now() }) };
              zim.sendMessage(messageObj, doctorId, 0, { priority: 1 }).then((res: any) => {
                console.log("Ringing message sent to doctor", res);
              }).catch((err: any) => {
                console.error("Failed to send ringing message to doctor", err);
              });
            } else {
              console.error("ZIM instance not found");
            }
          }
        }
      });
    };

    initMeeting();

    return () => {
      // Cleanup if component unmounts
      joinedRef.current = false;
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, [roomID, userID, userName]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc" }}
    />
  );
}
