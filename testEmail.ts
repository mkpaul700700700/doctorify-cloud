import { sendNotificationEmail } from "./src/lib/email";

async function test() {
  console.log("Testing email...");
  const res = await sendNotificationEmail("Test", "mkpaul700@gmail.com", "Test", "<p>Test</p>");
  console.log(res);
}

test();
