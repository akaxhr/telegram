export function formatVaultStart() {
  return `🔐 VAULT PROTOCOL INITIATED

A classified digital vault has appeared.

CODE FORMAT
● 6 Digits
● 000000 - 999999

VAULT REWARD
💰 300 Coins

BREACH LIMIT
❤️ 30 Attempts

BREACH COST
💸 -10 Coins per failed attempt

Current Code Status:
_ _ _ _ _ _

First operative to breach the vault claims the reward.

Enter a 6-digit code...`;
}

export function formatWrongGuess({ username, attemptsLeft, coins, status, clueUnlocked }) {
  return `❌ ACCESS DENIED

${username} dropped 💸 10 coins into the vault drain.

${clueUnlocked ? "📡 Intelligence Fragment Recovered\n\n" : ""}Code Status:
${status}

❤️ Attempts Left: ${attemptsLeft}
💼 ${username}'s Coins: ${coins}`;
}

export function formatVaultWin({
  username,
  code,
  baseReward,
  streakCoins,
  streakPercent,
  totalEarned,
  streak,
  coins,
  badges,
}) {
  return `🎉 VAULT BREACHED

${username} cracked the vault code: ${code}

💰 Winning Coins: +${baseReward}
${streakCoins > 0 ? `🔥 Streak Bonus: +${streakCoins} (${streakPercent}%)\n` : ""}🏦 Total Earned: +${totalEarned}

🔥 Current Streak: ${streak}
💼 Total Coins: ${coins}

🏅 Badges:
${badges.length ? badges.join(" ") : "🔓 Codebreaker"}`;
}

export function formatVaultLost(code) {
  return `💀 VAULT LOCKDOWN

All attempts have been exhausted.

The hidden code was: ${code}

The vault has vanished into the shadows.`;
}

export function formatLeaderboard(players) {
  if (!players?.length) return "🏆 No vault hunters yet.";

  return (
    "🏆 GLOBAL VAULT RANKINGS\n\n" +
    players
      .map((p, i) => {
        const richest = i === 0 ? "👑 Richest Operative" : "";
        const badges = p.badges?.filter(Boolean).join(" ") || "";

        return `#${i + 1} ${p.username || "Unknown"} ${richest}
${badges}
💰 ${p.coins} Coins | 🔓 ${p.wins} Breaches`;
      })
      .join("\n\n")
  );
}
