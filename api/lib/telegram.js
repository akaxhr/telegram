import { saveMessage } from "./messages.js";

export async function sendTelegram(chatId, text, replyTo) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_to_message_id: replyTo,
      }),
    }
  );

  await saveMessage({
    chat_id: String(chatId),
    chat_title: "Bot Reply",
    user_id: "bot",
    username: "Akash",
    message_text: text,
    is_bot: true,
  });
}
