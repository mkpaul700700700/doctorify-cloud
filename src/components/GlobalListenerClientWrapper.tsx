"use client";

import dynamic from "next/dynamic";

const ZegoGlobalListener = dynamic(() => import("./ZegoGlobalListener"), { ssr: false });

interface Props {
  userID: string;
  userName: string;
}

export default function GlobalListenerClientWrapper({ userID, userName }: Props) {
  return <ZegoGlobalListener userID={userID} userName={userName} />;
}
