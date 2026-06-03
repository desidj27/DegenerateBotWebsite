export function toClientMongoError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("EBADNAME") ||
    message.includes("<cluster>") ||
    message.includes("<user>") ||
    message.includes("<password>")
  ) {
    return "Invalid MONGODB_URI — use your real Atlas connection string (not the .env.example placeholders).";
  }

  if (message.includes("MONGODB_URI is not set")) {
    return "MONGODB_URI is not set. Add it in .env.local or Vercel Environment Variables, then restart or redeploy.";
  }

  if (message.includes("bad auth") || message.includes("Authentication failed")) {
    return "MongoDB authentication failed — check username and password in MONGODB_URI.";
  }

  return "Could not connect to MongoDB. Verify MONGODB_URI and Atlas network access.";
}
