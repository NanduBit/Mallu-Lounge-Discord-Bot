<img align="right" src="https://cdn.discordapp.com/avatars/1397603937455964272/1b57a0080cb20b7f6d1487defd0f2b98.webp?size=160" height="200" width="200">

# Mallu Lounge Discord Bot

[![Node.js](https://img.shields.io/badge/Node.js-21.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Invite](https://img.shields.io/badge/Invite-Bot-green?style=for-the-badge&logo=discord)](https://discord.com/oauth2/authorize?client_id=1397603937455964272&permissions=8&integration_type=0&scope=bot)

A simple discord bot which sends welcome message on welcomechannel and send short welcome message on generalchannel

## Features

### Shell Console (`Shell.js`)
The bot includes a powerful shell console feature that runs as an **independent Discord bot instance**, providing **persistent shell access** with continuous output streaming.

**Architecture:**
- `Shell.js` is a standalone bot located at the root level (outside `src/`)
- Runs independently from the main bot code
- Uses the same bot token from `src/config.js`
- Creates its own Discord client instance

**How it works:**
- The shell bot maintains a **persistent shell session** (bash on Linux/Mac, cmd on Windows)
- Commands sent in the designated channel are executed in the persistent shell
- Shell state persists between commands (environment variables, current directory, etc.)
- Command output is streamed continuously to Discord as it's generated
- Long-running processes (like `node src/index.js`) work perfectly with real-time output
- Console logs from any running processes are automatically redirected to the shell channel

**Setup:**
1. Set the `shellChannelID` in `src/config.js` to your desired Discord channel ID
2. Run the shell console bot: `node Shell.js`
3. Send commands in the designated shell channel
4. Use the persistent shell to start the main bot: `node src/index.js`

**Special Commands:**
- `!status` - Check shell process status and PID
- `!restart` - Restart the shell process (clears shell state)
- `!stop` - Stop the shell process

**Examples:**
```bash
# Navigate directories (state persists)
cd src
ls

# Set environment variables (persist in session)
export DEBUG=true

# Run the main bot from Discord
node index.js

# Run long-running processes
npm start

# Check running processes
ps aux | grep node
```

**Security Note:** ⚠️ The shell console feature executes arbitrary commands with the same permissions as the bot process. Only give access to this channel to trusted administrators. Consider implementing user ID whitelisting or role-based access control for production use.
