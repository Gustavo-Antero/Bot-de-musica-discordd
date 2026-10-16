import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { addTrack, getQueue, setVolume, skip, stop, togglePause } from './music.js';
import { musicPanel } from './ui.js';

if (!process.env.DISCORD_TOKEN) throw new Error('Configure DISCORD_TOKEN no arquivo .env.');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once(Events.ClientReady, (readyClient) => console.log(`Bot online como ${readyClient.user.tag}.`));
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      if (commandName === 'play') {
        const voice = interaction.member.voice?.channel;
        if (!voice) return interaction.reply({ content: 'Entre em um canal de voz primeiro.', ephemeral: true });
        await interaction.deferReply();
        const { queue, count, started } = await addTrack(interaction.guildId, voice, interaction.channel, interaction.options.getString('busca', true), interaction.user.toString());
        const response = musicPanel(queue);
        response.content = count > 1 ? `Adicionei **${count} faixas** à fila.` : started ? 'Adicionado à fila e começando agora.' : 'Adicionado à fila.';
        queue.panelMessage = await interaction.editReply(response);
        return;
      }
      if (commandName === 'skip') return interaction.reply(skip(interaction.guildId) ? '⏭️ Música pulada.' : 'Não há música tocando.');
      if (commandName === 'volume') {
        const level = interaction.options.getInteger('nivel', true);
        return interaction.reply(setVolume(interaction.guildId, level) ? `🔊 Volume ajustado para **${level}%**.` : 'Adicione uma música antes de ajustar o volume.');
      }
      if (commandName === 'pause') {
        const state = togglePause(interaction.guildId);
        return interaction.reply(state === 'paused' ? '⏸️ Música pausada.' : state === 'playing' ? '▶️ Música retomada.' : 'Não há música tocando.');
      }
      if (commandName === 'stop') {
        stop(interaction.guildId);
        return interaction.reply('⏹️ Reprodução encerrada e fila limpa.');
      }
      if (commandName === 'queue') {
        const queue = getQueue(interaction.guildId);
        return interaction.reply(queue ? musicPanel(queue) : 'A fila está vazia. Use **/play** para começar.');
      }
    }

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const queue = getQueue(interaction.guildId);
      if (!queue) return interaction.reply({ content: 'A fila já foi encerrada.', ephemeral: true });
      if (interaction.customId === 'music:skip') { skip(interaction.guildId); await interaction.deferUpdate(); return; }
      if (interaction.customId === 'music:pause') {
        const state = togglePause(interaction.guildId);
        return interaction.reply({ content: state === 'paused' ? '⏸️ Música pausada.' : state === 'playing' ? '▶️ Música retomada.' : 'Não há música tocando.', ephemeral: true });
      }
      if (interaction.customId === 'music:stop') {
        stop(interaction.guildId);
        return interaction.update({ content: '⏹️ Reprodução encerrada.', embeds: [], components: [] });
      }
      if (interaction.customId === 'music:volume') {
        const level = Number(interaction.values[0]);
        setVolume(interaction.guildId, level);
        return interaction.reply({ content: `🔊 Volume: **${level}%**.`, ephemeral: true });
      }
    }
  } catch (error) {
    console.error(error);
    const content = error.message || 'Ocorreu um erro ao processar o comando.';
    if (interaction.deferred || interaction.replied) await interaction.followUp({ content, ephemeral: true }).catch(() => {});
    else await interaction.reply({ content, ephemeral: true }).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
