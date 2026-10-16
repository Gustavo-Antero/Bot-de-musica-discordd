import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';

const time = (value) => value ? `\`${value}\`` : '—';

export function musicPanel(queue) {
  const upcoming = queue.tracks.slice(0, 5);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('♫  Tocando agora')
    .setDescription(queue.current ? `**[${queue.current.title}](${queue.current.url})**\n${time(queue.current.duration)} · pedido por ${queue.current.requestedBy}` : 'Nada tocando no momento. Use **/play** para adicionar uma música.')
    .addFields(
      { name: 'Volume', value: `${Math.round(queue.volume * 100)}%`, inline: true },
      { name: 'Na fila', value: `${queue.tracks.length} faixa${queue.tracks.length === 1 ? '' : 's'}`, inline: true },
      { name: 'Próximas', value: upcoming.length ? upcoming.map((track, index) => `**${index + 1}.** ${track.title} · ${time(track.duration)}`).join('\n') : 'A fila está vazia.', inline: false },
    )
    .setFooter({ text: `Canal de voz: ${queue.voiceChannel?.name ?? 'desconectado'}` });

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music:pause').setLabel('Pausar / continuar').setEmoji('⏯️').setStyle(ButtonStyle.Secondary).setDisabled(!queue.current),
    new ButtonBuilder().setCustomId('music:skip').setLabel('Pular').setEmoji('⏭️').setStyle(ButtonStyle.Primary).setDisabled(!queue.current),
    new ButtonBuilder().setCustomId('music:stop').setLabel('Encerrar').setEmoji('⏹️').setStyle(ButtonStyle.Danger).setDisabled(!queue.current && !queue.tracks.length),
  );
  const volume = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('music:volume').setPlaceholder('Ajustar volume').addOptions(
    { label: '25%', value: '25', emoji: '🔈' }, { label: '50%', value: '50', emoji: '🔉' }, { label: '75%', value: '75', emoji: '🔊' }, { label: '100%', value: '100', emoji: '📢' },
  ));
  return { embeds: [embed], components: [controls, volume] };
}
