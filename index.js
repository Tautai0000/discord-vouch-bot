const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const app = express();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Make sure the bot is logged in
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Set up the bot commands and their behavior
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!vouch') {
        const user = message.author;
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Vouch for ${user.username}`)
            .setDescription(`✅ ${user} has been vouched for!`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) || null })
            .setFooter({ text: 'Thanks for the vouch!' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Login to Discord bot
client.login(process.env.TOKEN);
