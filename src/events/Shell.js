const { Events } = require("discord.js");
const { shellChannelID } = require("../config");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

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

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Skip if shellChannelID is not configured
    if (!shellChannelID || shellChannelID === "") return;

    // Only listen to the shell channel
    if (message.channel.id !== shellChannelID) return;

    // Setup console redirect if not already done
    if (!shellChannel) {
      setupConsoleRedirect(message.channel);
      await message.channel.send("```\n🟢 Shell console initialized. Console output will be redirected to this channel.\n```");
    }

    const command = message.content.trim();

    // Skip empty commands
    if (!command) return;

    try {
      // Send acknowledgment
      await message.react("⏳");

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
      await message.reactions.removeAll();
      await message.react("✅");
    } catch (error) {
      // Remove loading reaction
      try {
        await message.reactions.removeAll();
        await message.react("❌");
      } catch (e) {
        // Ignore reaction errors
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
  },
};
