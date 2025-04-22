const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!vouch') {
        const user = message.author;
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`Vouch for ${user.username}`)
            .setDescription('This is a vouch message.')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setAuthor({
                name: guild.name,
                iconURL: guild.iconURL({ dynamic: true })
            })
            .setFooter({ text: 'Thanks for the vouch!' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
