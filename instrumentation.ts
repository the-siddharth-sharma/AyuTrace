/**
 * Next.js Server Boot Lifecycle Hook.
 * 1. Prioritizes IPv4 DNS resolution to avoid NAT64/IPv6 handshake timeouts.
 * 2. Pre-warms database connection handles asynchronously during serverless container start
 *    so initial user requests never pay the cold TCP/TLS handshake latency penalty.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const dns = await import("dns");
      dns.setDefaultResultOrder?.("ipv4first");
    } catch {}

    try {
      const { prisma } = await import("@/lib/db/prisma");
      // Asynchronously initiate connection handshake during server cold boot
      prisma.$queryRaw`SELECT 1`.catch(() => {});
    } catch {
      // Suppress connection warmup errors on offline builds
    }
  }
}
