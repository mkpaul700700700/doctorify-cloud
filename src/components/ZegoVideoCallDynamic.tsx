"use client";

import dynamic from "next/dynamic";

export const ZegoVideoCallDynamic = dynamic(
  () => import("./ZegoVideoCall"),
  { ssr: false }
);
