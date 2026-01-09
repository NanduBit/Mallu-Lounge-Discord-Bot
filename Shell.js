const { Client, GatewayIntentBits } = require("discord.js");
const { token, shellChannelID } = require("./src/config.js");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

// ⚠️ SECURITY WARNING: This module executes arbitrary shell commands.
// Only use in channels accessible to trusted administrators.
// Consider implementing additional security measures such as:
// - User ID whitelisting
// - Role-based access control
// - Command whitelisting
// - Input sanitization

// Create independent Discord client for shell console
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

let shellChannel = null;

// Helper function to split long messages
function splitMessage(text, maxLength = 2000) {
  const messages = [];
  let currentMessage = "";
  const lines = text.split("\n");

  for (const line of lines) {
    if (currentMessage.length + line.length + 1 > maxLength) {
      if (currentMessage) {
        messages.push(currentMessage);
        currentMessage = "";
      }
      // If a single line is too long, split it
      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          messages.push(line.substring(i, i + maxLength));
        }
      } else {
        currentMessage = line;
      }
    } else {
      currentMessage += (currentMessage ? "\n" : "") + line;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages.length > 0 ? messages : [""];
}

// Helper function to send output to shell channel
async function sendToShellChannel(content, prefix = "") {
  if (!shellChannel) return;

  try {
    const messages = splitMessage(prefix + content);
    for (const msg of messages) {
      await shellChannel.send("```\n" + msg + "\n```");
    }
  } catch (error) {
    originalConsoleError("❌ Error sending to shell channel:", error.message);
  }
}

// Override console methods to redirect to Discord
function setupConsoleRedirect(channel) {
  shellChannel = channel;

  console.log = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
    originalConsoleLog(...args);
    sendToShellChannel(message, "[LOG] ");
  };

  console.error = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
    originalConsoleError(...args);
    sendToShellChannel(message, "[ERROR] ");
  };

  console.warn = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
    originalConsoleWarn(...args);
    sendToShellChannel(message, "[WARN] ");
  };

  console.info = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
    originalConsoleInfo(...args);
    sendToShellChannel(message, "[INFO] ");
  };
}

// Client ready event
client.once("ready", async () => {
  originalConsoleLog(`✅ Shell Console Bot logged in as ${client.user.tag}`);

  // Check if shellChannelID is configured
  if (!shellChannelID || shellChannelID === "") {
    originalConsoleError("❌ shellChannelID is not configured in src/config.js");
    originalConsoleError("Please set a valid channel ID and restart the bot.");
    return;
  }

  try {
    // Fetch the shell channel
    const channel = await client.channels.fetch(shellChannelID);
    if (!channel) {
      originalConsoleError(`❌ Could not find channel with ID: ${shellChannelID}`);
      return;
    }

    // Setup console redirect
    setupConsoleRedirect(channel);
    
    await channel.send("```\n🟢 Shell console initialized. Console output will be redirected to this channel.\n⚠️  WARNING: This channel can execute arbitrary commands. Ensure only trusted users have access.\n```");
    originalConsoleLog("✅ Shell console initialized successfully");
  } catch (error) {
    originalConsoleError("❌ Error initializing shell console:", error);
  }
});

// Message handler for command execution
client.on("messageCreate", async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only listen to the shell channel
  if (!shellChannelID || message.channel.id !== shellChannelID) return;

  const command = message.content.trim();

  // Skip empty commands
  if (!command) return;

  try {
    // Send acknowledgment
    try {
      await message.react("⏳");
    } catch (reactionError) {
      // Continue even if reaction fails
      originalConsoleError("⚠️  Could not add reaction:", reactionError.message);
    }

    // Execute the command
    const { stdout, stderr } = await execPromise(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    // Send stdout if present
    if (stdout) {
      const messages = splitMessage(stdout);
      for (const msg of messages) {
        await message.channel.send("```\n" + msg + "\n```");
      }
    }

    // Send stderr if present
    if (stderr) {
      const messages = splitMessage(stderr);
      for (const msg of messages) {
        await message.channel.send("```\n[STDERR] " + msg + "\n```");
      }
    }

    // If no output, send a success message
    if (!stdout && !stderr) {
      await message.channel.send("```\n✅ Command executed successfully (no output)\n```");
    }

    // Replace loading reaction with success
    try {
      await message.reactions.removeAll();
      await message.react("✅");
    } catch (reactionError) {
      // Ignore reaction errors (missing permissions)
      originalConsoleError("⚠️  Could not update reactions:", reactionError.message);
    }
  } catch (error) {
    // Remove loading reaction
    try {
      await message.reactions.removeAll();
      await message.react("❌");
    } catch (reactionError) {
      // Ignore reaction errors (missing permissions)
      originalConsoleError("⚠️  Could not update reactions:", reactionError.message);
    }

    // Send error message
    const errorMessage = error.message || String(error);
    const messages = splitMessage(errorMessage);
    for (const msg of messages) {
      await message.channel.send("```\n❌ Error: " + msg + "\n```");
    }

    // Also send stderr if available
    if (error.stderr) {
      const stderrMessages = splitMessage(error.stderr);
      for (const msg of stderrMessages) {
        await message.channel.send("```\n[STDERR] " + msg + "\n```");
      }
    }
  }
});

// Error handlers
process.on("unhandledRejection", (error) => {
  originalConsoleError("❌ Unhandled Rejection in Shell.js:", error);
});

process.on("uncaughtException", (error) => {
  originalConsoleError("❌ Uncaught Exception in Shell.js:", error);
});

// Login
if (!token || token === "") {
  originalConsoleError("❌ Bot token is not configured in src/config.js");
  originalConsoleError("Please set a valid token and restart the bot.");
  process.exit(1);
}

client.login(token).catch((error) => {
  originalConsoleError("❌ Failed to login Shell Console Bot:", error);
  process.exit(1);
});
