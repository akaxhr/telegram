import { saveMessage } from "./messages.js";

export async function sendTelegram(chatId, text, replyTo = null) {
  const body = {
    chat_id: chatId,
    text,
  };

  if (replyTo) {
    body.reply_to_message_id = replyTo;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const result = await res.json();

  await saveMessage({
    chat_id: String(chatId),
    chat_title: "Bot Reply",
    user_id: "bot",
    username: "Akash",
    message_text: text,
    telegram_message_id: result.result?.message_id || null,
    reply_to_message_id: replyTo || null,
    is_bot: true,
  });

  return result;
}
