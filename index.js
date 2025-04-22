const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const dotenv = require('dotenv').config();
const fs = require('fs');

// Initialize the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    const CLIENT_ID = client.user.id;
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    // Register slash commands with Discord
    const commands = [
        new SlashCommandBuilder().setName('vouch').setDescription('Vouch for someone'),
        new SlashCommandBuilder().setName('backup').setDescription('Backup all vouches (owner only)'),
        new SlashCommandBuilder().setName('push').setDescription('Push saved vouches (owner only)')
    ].map(command => command.toJSON());

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'vouch') {
        await interaction.reply('Vouch received!'); // Quick response to avoid timeout
    } else if (commandName === 'backup') {
        await interaction.reply('Backup initiated!'); // Quick response
    } else if (commandName === 'push') {
        await interaction.reply('Pushing vouches...'); // Quick response
    }
});

client.login(process.env.TOKEN);
