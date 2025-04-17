const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, InteractionType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const vouches = [];
const BOT_TOKEN = process.env.TOKEN;
const OWNER_ID = process.env.OWNER_ID;

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Register slash commands on startup
client.on('ready', async () => {
  const commands = [
    new SlashCommandBuilder().setName('vouch').setDescription('Leave a rating and review'),
    new SlashCommandBuilder().setName('backup').setDescription('Save all vouches'),
    new SlashCommandBuilder().setName('push').setDescription('Repost all saved vouches'),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  const appId = (await rest.get(Routes.user())).id;

  try {
    console.log('🔁 Refreshing slash commands...');
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error('Error registering commands:', err);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'vouch') {
      const modal = new ModalBuilder()
        .setCustomId('vouchModal')
        .setTitle('Leave a Vouch');

      const ratingInput = new TextInputBuilder()
        .setCustomId('rating')
        .setLabel('Rate 1–5')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reviewInput = new TextInputBuilder()
        .setCustomId('review')
        .setLabel('Describe your experience')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(ratingInput);
      const row2 = new ActionRowBuilder().addComponents(reviewInput);

      modal.addComponents(row1, row2);

      await interaction.showModal(modal);
    }

    if (interaction.commandName === 'backup') {
      if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '❌ You are not authorized.', ephemeral: true });
      // Here you could write to a file/db. Just replying for now.
      return interaction.reply({ content: `✅ ${vouches.length} vouches backed up.`, ephemeral: true });
    }

    if (interaction.commandName === 'push') {
      if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '❌ You are not authorized.', ephemeral: true });

      if (vouches.length === 0) return interaction.reply({ content: 'No vouches to push.', ephemeral: true });

      for (const vouch of vouches) {
        await interaction.channel.send(`⭐ **Rating:** ${vouch.rating}\n💬 **Review:** ${vouch.review}\n👤 From: <@${vouch.userId}>`);
      }

      return interaction.reply({ content: '✅ Vouches pushed to this channel.', ephemeral: true });
    }
  }

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'vouchModal') {
    const rating = interaction.fields.getTextInputValue('rating');
    const review = interaction.fields.getTextInputValue('review');

    const vouch = {
      userId: interaction.user.id,
      rating,
      review,
    };

    vouches.push(vouch);

    await interaction.reply({
      content: `✅ Thanks for your vouch!\n⭐ **Rating:** ${rating}\n💬 **Review:** ${review}`,
      ephemeral: true
    });

    const channel = interaction.channel;
    if (channel) {
      await channel.send(`📥 New vouch from <@${vouch.userId}>!\n⭐ **Rating:** ${rating}\n💬 **Review:** ${review}`);
    }
  }
});

// Start web server for Render & UptimeRobot
const app = express();
const PORT = process.env.PORT || 3000;  // Use the port provided by Render (or 3000 locally)

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// Login the bot
client.login(BOT_TOKEN);
