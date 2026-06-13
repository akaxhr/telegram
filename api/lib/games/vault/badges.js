export function getStreakPercent(streak) {
  if (streak >= 5) return 40;
  if (streak === 4) return 30;
  if (streak === 3) return 20;
  if (streak === 2) return 10;
  return 0;
}

export function getWinBadges(wins, attemptsUsed) {
  const badges = [];

  if (wins >= 1) badges.push("🔓 Codebreaker");
  if (attemptsUsed <= 5) badges.push("🍀 Lucky Hacker");
  if (attemptsUsed <= 3) badges.push("⚡ Phantom Cracker");

  if (wins >= 10) badges.push("🧠 Cipher Hunter");
  if (wins >= 25) badges.push("⚙️ Elite Decoder");
  if (wins >= 50) badges.push("🎯 Mastermind");
  if (wins >= 75) badges.push("👑 Vault Sovereign");
  if (wins >= 100) badges.push("🌌 Vault Legend");

  return badges;
}

export function getCoinBadge(coins) {
  if (coins >= 100000) return "🌟 Wealth Emperor";
  if (coins >= 50000) return "👑 Magnate";
  if (coins >= 25000) return "💎 Tycoon";
  if (coins >= 10000) return "🏦 Financier";
  if (coins >= 5000) return "💰 Collector";
  if (coins >= 1000) return "💵 Investor";
  return "";
}
