import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  try {
    const password = req.headers["x-admin-password"];

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";

    const data = req.body || {};

    const { error } = await supabase.from("panel_visits").insert({
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

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
