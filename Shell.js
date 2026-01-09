const { Client, GatewayIntentBits } = require("discord.js");
const { token, shellChannelID } = require("./src/config.js");
const { spawn } = require("child_process");
const os = require("os");

// ⚠️ SECURITY WARNING: This module executes arbitrary shell commands.
// Only use in channels accessible to trusted administrators.
// Consider implementing additional security measures such as:
// - User ID whitelisting
// - Role-based access control
// - Command whitelisting
// - Input sanitization

// Configuration constants
const FLUSH_TIMEOUT_MS = 500; // Time to wait before flushing output buffer
const BUFFER_FLUSH_THRESHOLD = 1500; // Buffer size threshold for immediate flush
const SHELL_RESTART_DELAY_MS = 1000; // Delay before restarting crashed shell
const REACTION_UPDATE_DELAY_MS = 500; // Delay before updating message reactions

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
let shellProcess = null; // Persistent shell process
let outputBuffer = ""; // Buffer for collecting output
let isProcessing = false; // Flag to prevent concurrent message sends
let flushTimer = null; // Timer for flushing output buffer

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

// Helper function to send output to shell channel with buffering
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

// Helper function to flush output buffer
async function flushOutputBuffer() {
  if (!outputBuffer || isProcessing) return;
  
  isProcessing = true;
  try {
    await sendToShellChannel(outputBuffer);
    outputBuffer = "";
  } catch (error) {
    originalConsoleError("❌ Error flushing output buffer:", error.message);
  } finally {
    isProcessing = false;
  }
}

// Schedule output flush
function scheduleFlush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    flushOutputBuffer();
    flushTimer = null;
  }, FLUSH_TIMEOUT_MS);
}

// Initialize persistent shell process
function startShellProcess() {
  if (shellProcess) {
    originalConsoleLog("⚠️  Shell process already running");
    return;
  }

  // Determine shell based on platform
  const shell = os.platform() === "win32" ? "cmd.exe" : "/bin/bash";

  originalConsoleLog(`🔧 Starting persistent shell: ${shell}`);
  
  shellProcess = spawn(shell, [], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
  });

  // Handle stdout - stream continuously to Discord
  shellProcess.stdout.on("data", (data) => {
    const output = data.toString();
    originalConsoleLog("[SHELL STDOUT]", output);
    
    outputBuffer += output;
    
    // If buffer is getting large, flush immediately
    if (outputBuffer.length > BUFFER_FLUSH_THRESHOLD) {
      if (flushTimer) clearTimeout(flushTimer);
      flushOutputBuffer();
    } else {
      // Otherwise, schedule a flush
      scheduleFlush();
    }
  });

  // Handle stderr
  shellProcess.stderr.on("data", (data) => {
    const output = data.toString();
    originalConsoleError("[SHELL STDERR]", output);
    
    sendToShellChannel(output, "[STDERR] ");
  });

  // Handle process exit
  shellProcess.on("close", (code) => {
    originalConsoleLog(`Shell process exited with code ${code}`);
    
    if (shellChannel) {
      shellChannel.send(`\`\`\`\n⚠️  Shell process exited with code ${code}\n\`\`\``).catch(() => {});
    }
    
    shellProcess = null;
    
    // Restart shell automatically
    setTimeout(() => {
      originalConsoleLog("🔄 Restarting shell process...");
      startShellProcess();
      if (shellChannel) {
        shellChannel.send("```\n🔄 Shell process restarted\n```").catch(() => {});
      }
    }, SHELL_RESTART_DELAY_MS);
  });

  // Handle process errors
  shellProcess.on("error", (error) => {
    originalConsoleError("❌ Shell process error:", error);
    if (shellChannel) {
      shellChannel.send(`\`\`\`\n❌ Shell error: ${error.message}\n\`\`\``).catch(() => {});
    }
  });

  originalConsoleLog("✅ Shell process started successfully");
}

// Stop shell process
function stopShellProcess() {
  if (!shellProcess) {
    return false;
  }

  originalConsoleLog("🛑 Stopping shell process...");
  shellProcess.kill();
  shellProcess = null;
  return true;
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
    process.exit(1);
  }

  try {
    // Fetch the shell channel
    const channel = await client.channels.fetch(shellChannelID);
    if (!channel) {
      originalConsoleError(`❌ Could not find channel with ID: ${shellChannelID}`);
      process.exit(1);
    }

    // Setup console redirect
    setupConsoleRedirect(channel);
    
    // Start persistent shell process
    startShellProcess();
    
    await channel.send("```\n🟢 Shell console initialized with persistent shell session.\n📝 Send commands to execute them in the shell.\n🔄 Shell state persists between commands.\n⚠️  WARNING: This channel can execute arbitrary commands. Ensure only trusted users have access.\n\nSpecial commands:\n  !restart - Restart the shell process\n  !stop - Stop the shell process\n  !status - Check shell process status\n```");
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
    // Handle special commands
    if (command === "!restart") {
      await message.react("🔄");
      const stopped = stopShellProcess();
      if (stopped) {
        await message.channel.send("```\n🔄 Restarting shell process...\n```");
        setTimeout(() => {
          startShellProcess();
          message.channel.send("```\n✅ Shell process restarted\n```").catch(() => {});
        }, SHELL_RESTART_DELAY_MS);
      } else {
        await message.channel.send("```\n⚠️  No shell process to restart. Starting new one...\n```");
        startShellProcess();
      }
      return;
    }

    if (command === "!stop") {
      await message.react("🛑");
      const stopped = stopShellProcess();
      if (stopped) {
        await message.channel.send("```\n🛑 Shell process stopped\n```");
      } else {
        await message.channel.send("```\n⚠️  No shell process running\n```");
      }
      return;
    }

    if (command === "!status") {
      const status = shellProcess ? "🟢 Running" : "🔴 Stopped";
      const pid = shellProcess ? shellProcess.pid : "N/A";
      await message.channel.send(`\`\`\`\nShell Status: ${status}\nPID: ${pid}\n\`\`\``);
      return;
    }

    // Check if shell process is running
    if (!shellProcess) {
      await message.channel.send("```\n❌ Shell process not running. Use !restart to start it.\n```");
      return;
    }

    // Send acknowledgment
    try {
      await message.react("⏳");
    } catch (reactionError) {
      originalConsoleError("⚠️  Could not add reaction:", reactionError.message);
    }

    // Send command to shell with newline
    shellProcess.stdin.write(command + "\n");
    originalConsoleLog(`[SHELL COMMAND] ${command}`);

    // Update reaction to success
    setTimeout(async () => {
      try {
        await message.reactions.removeAll();
        await message.react("✅");
      } catch (reactionError) {
        originalConsoleError("⚠️  Could not update reactions:", reactionError.message);
      }
    }, REACTION_UPDATE_DELAY_MS);

  } catch (error) {
    // Remove loading reaction
    try {
      await message.reactions.removeAll();
      await message.react("❌");
    } catch (reactionError) {
      originalConsoleError("⚠️  Could not update reactions:", reactionError.message);
    }

    // Send error message
    const errorMessage = error.message || String(error);
    const messages = splitMessage(errorMessage);
    for (const msg of messages) {
      await message.channel.send("```\n❌ Error: " + msg + "\n```");
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

// Cleanup on exit
process.on("SIGINT", () => {
  originalConsoleLog("🛑 Received SIGINT, cleaning up...");
  stopShellProcess();
  process.exit(0);
});

process.on("SIGTERM", () => {
  originalConsoleLog("🛑 Received SIGTERM, cleaning up...");
  stopShellProcess();
  process.exit(0);
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
