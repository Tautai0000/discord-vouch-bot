const { Client, GatewayIntentBits, Partials, Events, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const VOUCH_FILE = 'vouches.json';
let vouches = [];

// Load saved vouches on startup
if (fs.existsSync(VOUCH_FILE)) {
  vouches = JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8'));
}

// Register commands
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName('vouch').setDescription('Leave a vouch for someone.'),
    new SlashCommandBuilder().setName('backup').setDescription('Save vouches to file (Owner only).'),
    new SlashCommandBuilder().setName('push').setDescription('Post all vouches (Owner only).')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'vouch') {
      const modal = new ModalBuilder()
        .setCustomId('vouchModal')
        .setTitle('Leave a Vouch');

      const ratingInput = new TextInputBuilder()
        .setCustomId('rating')
        .setLabel('Rating (1-5)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reviewInput = new TextInputBuilder()
        .setCustomId('review')
        .setLabel('Describe your review')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(ratingInput);
      const row2 = new ActionRowBuilder().addComponents(reviewInput);

      modal.addComponents(row1, row2);
      await interaction.showModal(modal);
    }

    if (commandName === 'backup') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ Only the bot owner can use this.', ephemeral: true });
      }

      fs.writeFileSync('backup.json', JSON.stringify(vouches, null, 2));
      await interaction.reply({ content: '✅ Backup saved to `backup.json`.', ephemeral: true });
    }

    if (commandName === 'push') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ Only the bot owner can use this.', ephemeral: true });
      }

      if (vouches.length === 0) {
        return interaction.reply({ content: '📭 No vouches to push.', ephemeral: true });
      }

      await interaction.reply({ content: '📤 Pushing vouches...', ephemeral: true });
      for (const vouch of vouches) {
        await interaction.channel.send(`⭐ **Rating:** ${vouch.rating}\n📝 **Review:** ${vouch.review}\n👤 **By:** <@${vouch.userId}>`);
      }
    }
  }

  // Handle modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'vouchModal') {
    const rating = interaction.fields.getTextInputValue('rating');
    const review = interaction.fields.getTextInputValue('review');

    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return interaction.reply({ content: '❌ Please enter a valid number between 1 and 5 for the rating.', ephemeral: true });
    }

    const vouch = {
      userId: interaction.user.id,
      rating: numericRating,
      review: review.trim(),
      timestamp: new Date().toISOString()
    };

    vouches.push(vouch);
    fs.writeFileSync(VOUCH_FILE, JSON.stringify(vouches, null, 2));

    await interaction.reply({ content: '✅ Vouch submitted and posted!', ephemeral: true });

    // Post the vouch in the channel
    await interaction.channel.send(
      `⭐ **Rating:** ${vouch.rating}\n📝 **Review:** ${vouch.review}\n👤 **By:** <@${vouch.userId}>`
    );

  }
});

client.login(process.env.TOKEN);
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('🌐 Express server running');
});
