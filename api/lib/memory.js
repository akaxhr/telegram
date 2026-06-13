import { supabase } from "./supabase.js";

export async function saveMemory(userId, userName, memory) {
  return supabase.from("memories").insert({
    user_id: userId,
    username: userName,
    memory,
  });
}

export async function getMemories(userId) {
  const { data } = await supabase
    .from("memories")
    .select("memory")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  return data?.map((m) => `- ${m.memory}`).join("\n") || "No memory yet.";
}
