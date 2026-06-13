import { supabase } from "./supabase.js";

export async function saveUserHistory(userId, userName, role, text) {
  await supabase.from("user_chat_history").insert({
    user_id: userId,
    username: userName,
    role,
    message_text: text,
  });

  await trimUserHistory(userId);
}

export async function getUserHistory(userId) {
  const { data } = await supabase
    .from("user_chat_history")
    .select("username, role, message_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    data
      ?.reverse()
      .map((m) => `${m.role === "bot" ? "Akash" : m.username}: ${m.message_text}`)
      .join("\n") || "No previous conversation."
  );
}

async function trimUserHistory(userId) {
  const { data } = await supabase
    .from("user_chat_history")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(500, 10000);

  if (!data?.length) return;

  await supabase
    .from("user_chat_history")
    .delete()
    .in("id", data.map((m) => m.id));
}
