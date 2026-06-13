import { supabase } from "./supabase.js";

export async function saveMessage(data) {
  const { error } = await supabase.from("bot_messages").insert(data);

  if (error) {
    console.error("Save message error:", error.message);
    return;
  }

  await trimOldMessages(String(data.chat_id));
}

async function trimOldMessages(chatId) {
  const { data, error } = await supabase
    .from("bot_messages")
    .select("id")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .range(3000, 10000);

  if (error) {
    console.error("Trim fetch error:", error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const ids = data.map((m) => m.id);

  const { error: deleteError } = await supabase
    .from("bot_messages")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("Trim delete error:", deleteError.message);
  }
}
