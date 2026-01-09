<img align="right" src="https://cdn.discordapp.com/avatars/1397603937455964272/1b57a0080cb20b7f6d1487defd0f2b98.webp?size=160" height="200" width="200">

# Mallu Lounge Discord Bot

[![Node.js](https://img.shields.io/badge/Node.js-21.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Invite](https://img.shields.io/badge/Invite-Bot-green?style=for-the-badge&logo=discord)](https://discord.com/oauth2/authorize?client_id=1397603937455964272&permissions=8&integration_type=0&scope=bot)

A simple discord bot which sends welcome message on welcomechannel and send short welcome message on generalchannel

## Features

### Shell Console (`Shell.js`)
The bot includes a powerful shell console feature that runs as an **independent Discord bot instance**, allowing administrators to execute commands and view console output directly in Discord.

**Architecture:**
- `Shell.js` is a standalone bot located at the root level (outside `src/`)
- Runs independently from the main bot code
- Uses the same bot token from `src/config.js`
- Creates its own Discord client instance

**How it works:**
- The shell bot listens for messages in a designated shell channel (configured via `shellChannelID` in `src/config.js`)
- Commands sent in this channel are executed on the server
- Command output (stdout/stderr) is sent back to the Discord channel
- Console logs from the bot are automatically redirected to the shell channel

**Setup:**
1. Set the `shellChannelID` in `src/config.js` to your desired Discord channel ID
2. Run the shell console bot: `node Shell.js`
3. (Optional) Run the main bot separately: `node src/index.js` or `npm start`
4. Send commands in the designated shell channel

**Security Note:** ⚠️ The shell console feature executes commands with the same permissions as the bot process. Only give access to this channel to trusted administrators. Consider restricting this feature to specific users or roles for production use.
