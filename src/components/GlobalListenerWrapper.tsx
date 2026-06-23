import { auth } from "@/auth";
import GlobalListenerClientWrapper from "./GlobalListenerClientWrapper";

export default async function GlobalListenerWrapper() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  return (
    <GlobalListenerClientWrapper 
      userID={session.user.id} 
      userName={session.user.name || "User"} 
    />
  );
}
