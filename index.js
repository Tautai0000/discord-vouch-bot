const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv').config();
const fs = require('fs');

// Create the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Command to trigger the Vouch interaction
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Slash command registration
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (commandName === 'vouch') {
        // Create a dropdown for stars (1-5) and a text input field for the explanation
        const starSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('star-rating')
            .setPlaceholder('Select a rating (1 to 5 stars)')
            .addOptions(
                { label: '1 Star', value: '1' },
                { label: '2 Stars', value: '2' },
                { label: '3 Stars', value: '3' },
                { label: '4 Stars', value: '4' },
                { label: '5 Stars', value: '5' }
            );

        const vouchButton = new ButtonBuilder()
            .setCustomId('vouch-submit')
            .setLabel('Submit Vouch')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(starSelectMenu, vouchButton);

        await interaction.reply({
            content: 'Please select a star rating and then submit your vouch explanation.',
            components: [row]
        });
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'vouch-submit') {
            // We need to get the selected star rating and explanation from the user
            const starRating = interaction.message.components[0].components[0].getValue();
            if (!starRating) {
                return await interaction.reply({ content: '❌ Please select a star rating first!', ephemeral: true });
            }

            const explanation = interaction.message.content; // Assume explanation was in the initial message
            
            // Send to the Vouch channel
            const vouchChannel = interaction.guild.channels.cache.get(process.env.VOUCH_CHANNEL_ID);
            const vouchEmbed = new EmbedBuilder()
                .setColor('#00AE86')
                .setTitle(`Vouch from ${user.tag}`)
                .addFields(
                    { name: 'Rating:', value: `⭐ ${starRating}` },
                    { name: 'Explanation:', value: explanation }
                )
                .setFooter({ text: `Vouched by ${user.tag}` })
                .setTimestamp();

            await vouchChannel.send({ embeds: [vouchEmbed] });

            // Send to the Vouch Log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.VOUCH_LOG_CHANNEL_ID);
            const logEmbed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('Vouch Log Entry')
                .addFields(
                    { name: 'User:', value: user.tag },
                    { name: 'Rating:', value: `⭐ ${starRating}` },
                    { name: 'Explanation:', value: explanation }
                )
                .setFooter({ text: `Logged by ${user.tag}` })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });

            await interaction.reply({ content: '✅ Your vouch has been submitted!', ephemeral: true });
        }
    }
});

// Login to the bot
client.login(process.env.TOKEN);
