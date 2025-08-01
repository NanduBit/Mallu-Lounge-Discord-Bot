const fs = require("fs");
const path = require("path");

module.exports = {
  execute(client) {
    const foldersPath = path.join(__dirname, "../commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
          if (client.commands.has(command.data.name)) {
             console.log(
                `❓ Duplicate command name "${command.data.name}" found at ${filePath}`
              );
            continue;
          }
          client.commands.set(command.data.name, command);
        } else {
          console.log(
            `❓ The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      }
    }
  },
};
