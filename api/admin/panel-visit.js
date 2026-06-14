import { supabase } from "../../lib/supabase.js";
import { sendTelegram } from "../../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const adminPassword = req.headers["x-admin-password"];

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown";

  const data = req.body;

  await supabase.from("panel_visits").insert({
    visitor_id: data.visitor_id,
    ip,
    page: data.page,
    hostname: data.hostname,
    language: data.language,
    platform: data.platform,
    user_agent: data.user_agent,
    timezone: data.timezone,
    screen_width: data.screen_width,
    screen_height: data.screen_height,
    window_width: data.window_width,
    window_height: data.window_height,
    device_pixel_ratio: data.device_pixel_ratio,
    dark_mode: data.dark_mode,
    touch_support: data.touch_support
  });

  await sendTelegram(
    process.env.OWNER_CHAT_ID,
    `🚨 Panel opened

IP: ${ip}
Page: ${data.page}
Device: ${data.platform}
Language: ${data.language}
Timezone: ${data.timezone}
Screen: ${data.screen_width}x${data.screen_height}
Visitor: ${data.visitor_id}`
  );

  return res.status(200).json({ ok: true });
}
