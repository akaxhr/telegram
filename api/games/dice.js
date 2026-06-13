export async function handleDice(chatId, messageId, sendTelegram) {
  const roll = Math.floor(Math.random() * 6) + 1;

  await sendTelegram(
    chatId,
    "🎲 You rolled: " + roll,
    messageId
  );
}
