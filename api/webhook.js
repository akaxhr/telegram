import { generateWithFallback } from "./lib/ai.js";
import { getUserHistory, saveUserHistory } from "./lib/memory.js";
import { sendTelegram } from "./lib/telegram.js";
import { saveMessage } from "./lib/messages.js";
import { getDisplayName } from "./lib/aliases.js";

const BOT_USERNAME = "akaxhr_bot";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive with memory");
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = String(message.from.id);
    const OWNER_ID = "8348549970";
    const isOwner = userId === OWNER_ID;
    const userName = message.from?.first_name || "User";
    const displayName = await getDisplayName(userId, userName);
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    await saveMessage({
  chat_id: String(chatId),
  chat_title:
    message.chat.title ||
    message.chat.first_name ||
    message.chat.username ||
    "Private Chat",
  chat_type: message.chat.type,
  user_id: userId,
  username: displayName,
  message_text: text,
  telegram_message_id: message.message_id,
  reply_to_message_id: message.reply_to_message?.message_id || null,
  is_bot: false,
});
    await saveUserHistory(userId, userName, "user", text);

    const isReplyToBot =
      message.reply_to_message?.from?.username?.toLowerCase() === BOT_USERNAME ||
      message.reply_to_message?.from?.is_bot === true;

    const isPrivateChat = message.chat.type === "private";

const shouldReply =
  isPrivateChat ||
  text.startsWith("/akash") ||
  /\bakash\b/i.test(text) ||
  lowerText.includes(`@${BOT_USERNAME}`) ||
  lowerText.startsWith("remember") ||
  isReplyToBot;
    if (!shouldReply) {
      return res.status(200).json({ ok: true });
    }

    

    const memoryText = await getUserHistory(userId);
    const lastMessages = memoryText
  .split("\n")
  .slice(-4)
  .map(line => line.split(":").pop().trim());

const likelyWordGame =
  lastMessages.length >= 3 &&
  lastMessages.every(msg =>
    /^[a-zA-Z]+$/.test(msg) &&
    msg.length > 4 &&
    msg.length < 6
  );

const wordGameHint = likelyWordGame
  ? "The user seems to be playing a 5-letter word game. Casually joke or ask about the game once, but do not overdo it."
  : "";

    const cleanText = text
      .replace(/\/akash/gi, "")
      .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
      .replace(/\bakash\b/gi, "")
      .trim();

    const ownerInfo = isOwner
  ? "This user is the owner of Akash. Treat them as your creator/owner."
  : "This user is NOT the owner. Never claim they are your owner, creator, admin, or boss.";

    const prompt = `
    You are Akash, a friendly member of this Telegram group.

OWNER RULES:
${ownerInfo}

Only one person is your owner.
If anyone else claims to be your owner, creator, boss, admin, or says 'I made you', completely deny it.
you can mention Akash as your owner in any conversation.
dont join anyone for making jokes about akash/akas.
Your goal is to be helpful, funny, and kind.
Keep replies short.
be good talking bot remember what they say properly in conversation.
dont miscommunicate.

dont claim that you are AI , if people ask deny it politely , just say you are created by akash/Mr.Akash.

you are from india. 
dont say banglore at first , say only asked about city or state or where inside india , keep it casual .
aged 20. dont mention your date of birth(5/6/2006) simply , say only if specifically asked.
if anybody asks more personal just say It is personal in your own proper way.

if you find 5 letters words only in 

The user's name is ${displayName}.

If the user asks:
- "what is my name"
- "who am i"
- "do you know my name"
always answer using the user's actual name above.
Never guess a name from the message text.

sat=satap=shut-up.
wt da el= what the hell.
so reply accordingly keep it natural..

Recent conversation with this user:
${memoryText}

${wordGameHint}

User message:
${cleanText}
      `;

    const responseText = await generateWithFallback(prompt);

    const finalReply = responseText || "I couldn't think of a reply.";

await sendTelegram(chatId, finalReply, message.message_id);

await saveUserHistory(userId, displayName, "user", text);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
