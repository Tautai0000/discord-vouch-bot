const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv').config();

// Add process error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception: ', error);
    process.exit(1);  // Exiting the process with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at: ', promise, 'reason: ', reason);
});

// Check if .env variables are loaded correctly
if (!process.env.TOKEN || !process.env.VOUCH_CHANNEL_ID || !process.env.VOUCH_LOG_CHANNEL_ID || !process.env.OWNER_ID) {
    console.error('Missing required environment variables!');
    process.exit(1);  // Exit the bot if necessary environment variables are missing
} else {
    console.log('Environment variables loaded successfully!');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Define the owner ID (from the .env file)
const OWNER_ID = process.env.OWNER_ID;

// Command to trigger the Vouch interaction
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Handle incoming interactions
client.on('interactionCreate', async (interaction) => {
    console.log('Interaction received:', interaction); // Log the interaction for debugging
    if (interaction.isCommand()) {
        const { commandName, user } = interaction;

        // Only allow owner to execute certain commands
        if (user.id !== OWNER_ID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Handle the vouch command
        if (commandName === 'vouch') {
            // Create a dropdown for stars (1-5)
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
    }

    // Handle when the user selects a star rating
    if (interaction.isSelectMenu()) {
        console.log('Star rating selected:', interaction.values[0]); // Debugging the selected star rating
        if (interaction.customId === 'star-rating') {
            const starRating = interaction.values[0]; // Get the star rating selected

            // Ask for the user's explanation (send a prompt in a follow-up message)
            await interaction.reply({
                content: 'Please provide a short explanation for your vouch.',
                ephemeral: true
            });

            // Wait for the user to reply with the explanation
            const filter = (response) => response.author.id === interaction.user.id;
            const collectedMessages = await interaction.channel.awaitMessages({
                filter,
                time: 60000, // Time limit for response (1 minute)
                max: 1,
            });

            const explanation = collectedMessages.first() ? collectedMessages.first().content : 'No explanation provided.';

            // Send to the Vouch channel
            const vouchChannel = interaction.guild.channels.cache.get(process.env.VOUCH_CHANNEL_ID);
            const vouchEmbed = new EmbedBuilder()
                .setColor('#00AE86')
                .setTitle(`Vouch from ${interaction.user.tag}`)
                .addFields(
                    { name: 'Rating:', value: `⭐ ${starRating}` },
                    { name: 'Explanation:', value: explanation }
                )
                .setFooter({ text: `Vouched by ${interaction.user.tag}` })
                .setTimestamp();

            await vouchChannel.send({ embeds: [vouchEmbed] });

            // Send to the Vouch Log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.VOUCH_LOG_CHANNEL_ID);
            const logEmbed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('Vouch Log Entry')
                .addFields(
                    { name: 'User:', value: interaction.user.tag },
                    { name: 'Rating:', value: `⭐ ${starRating}` },
                    { name: 'Explanation:', value: explanation }
                )
                .setFooter({ text: `Logged by ${interaction.user.tag}` })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });

            await interaction.followUp({ content: '✅ Your vouch has been submitted!', ephemeral: true });
        }
    }

    // Handle button click for vouch submission
    if (interaction.isButton()) {
        if (interaction.customId === 'vouch-submit') {
            // The vouch submission action is handled after explanation is collected, so this part is just for cleanup
            await interaction.reply({ content: 'You have successfully submitted your vouch!', ephemeral: true });
        }
    }
});

// Login to the bot
client.login(process.env.TOKEN).catch(console.error);  // Catch login errors
