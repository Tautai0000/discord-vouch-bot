const { Client, GatewayIntentBits, SlashCommandBuilder, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const commands = [
    new SlashCommandBuilder().setName('vouch').setDescription('Vouch for someone.'),
    new SlashCommandBuilder().setName('backup').setDescription('Backup all vouches (owner only).'),
    new SlashCommandBuilder().setName('push').setDescription('Push saved vouches (owner only).')
].map(command => command.toJSON());

client.once('ready', async () => {
    const CLIENT_ID = client.user.id;
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, guild } = interaction;

    if (commandName === 'vouch') {
        const vouch = {
            user: user.tag,
            avatar: user.displayAvatarURL(),
            timestamp: new Date().toISOString()
        };

        const backup = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));
        backup.vouches.push(vouch);
        fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Vouch for ${user.username}`)
            .setDescription(`✅ ${user} has been vouched for!`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) || null })
            .setFooter({ text: 'Thanks for the vouch!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    if ((commandName === 'backup' || commandName === 'push') && user.id !== process.env.OWNER_ID) {
        return await interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
    }

    if (commandName === 'backup') {
        await interaction.reply({ content: '✅ Vouches backed up successfully.' });
    }

    if (commandName === 'push') {
        const backup = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));
        for (const vouch of backup.vouches) {
            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle(`Vouch for ${vouch.user}`)
                .setDescription(`💬 Vouched earlier`)
                .setThumbnail(vouch.avatar)
                .setTimestamp(new Date(vouch.timestamp));
            await interaction.channel.send({ embeds: [embed] });
        }
        await interaction.reply({ content: '📤 All saved vouches pushed.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
