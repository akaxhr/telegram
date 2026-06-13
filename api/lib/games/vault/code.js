export function generateVaultCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

export function revealCode(secret, positions = []) {
  return secret
    .split("")
    .map((digit, index) => (positions.includes(index) ? digit : "_"))
    .join(" ");
}

export function unlockRandomPosition(secret, revealed = []) {
  const hidden = secret
    .split("")
    .map((_, index) => index)
    .filter((index) => !revealed.includes(index));

  if (!hidden.length) return revealed;

  const randomIndex = hidden[Math.floor(Math.random() * hidden.length)];
  return [...revealed, randomIndex];
}
