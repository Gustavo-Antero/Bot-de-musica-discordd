import { createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnectionStatus, AudioPlayerStatus } from '@discordjs/voice';
import play from 'play-dl';
import ytdlp from 'youtube-dl-exec';

const queues = new Map();
const MAX_QUEUE = 100;

function queueFor(guildId) {
  if (!queues.has(guildId)) {
    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    const queue = { guildId, voiceChannel: null, textChannel: null, player, connection: null, tracks: [], current: null, volume: 0.5, panelMessage: null };
    player.on(AudioPlayerStatus.Idle, () => { queue.current = null; void playNext(queue); });
    player.on('error', (error) => {
      console.error(`[${guildId}] Erro ao reproduzir:`, error.message);
      queue.textChannel?.send('Não consegui reproduzir essa faixa. Vou tentar a próxima.').catch(() => {});
      queue.current = null;
      void playNext(queue);
    });
    queues.set(guildId, queue);
  }
  return queues.get(guildId);
}

export function getQueue(guildId) { return queues.get(guildId) ?? null; }

export async function addTrack(guildId, voiceChannel, textChannel, query, requestedBy) {
  const queue = queueFor(guildId);
  queue.voiceChannel = voiceChannel;
  queue.textChannel = textChannel;
  let tracks;
  if (play.yt_validate(query) === 'playlist') {
    const playlist = await play.playlist_info(query, { incomplete: true });
    const videos = await playlist.all_videos();
    tracks = videos.slice(0, MAX_QUEUE).map((video) => ({ title: video.title, url: video.url, duration: video.durationRaw ?? '—', requestedBy }));
  } else {
    const result = play.yt_validate(query) === 'video' ? await play.video_info(query) : await play.search(query, { limit: 1, source: { youtube: 'video' } }).then((items) => items[0] && ({ video_details: items[0] }));
    const video = result?.video_details;
    if (!video?.url) throw new Error('Não encontrei essa música. Tente um link ou outro termo de busca.');
    tracks = [{ title: video.title, url: video.url, duration: video.durationRaw ?? '—', requestedBy }];
  }
  if (!tracks.length) throw new Error('Essa playlist não tem faixas disponíveis.');
  if (queue.tracks.length + tracks.length > MAX_QUEUE) throw new Error(`A fila comporta até ${MAX_QUEUE} faixas.`);
  queue.tracks.push(...tracks);
  await connect(queue);
  const started = !queue.current && queue.player.state.status !== AudioPlayerStatus.Playing;
  if (started) await playNext(queue);
  return { queue, count: tracks.length, started };
}

async function connect(queue) {
  if (queue.connection?.state.status === VoiceConnectionStatus.Ready) return;
  queue.connection = joinVoiceChannel({ channelId: queue.voiceChannel.id, guildId: queue.guildId, adapterCreator: queue.voiceChannel.guild.voiceAdapterCreator, selfDeaf: true });
  queue.connection.subscribe(queue.player);
  try { await entersState(queue.connection, VoiceConnectionStatus.Ready, 20_000); }
  catch (error) { queue.connection.destroy(); queue.connection = null; throw new Error('Não consegui entrar no canal de voz. Confira minhas permissões.'); }
}

async function playNext(queue) {
  const next = queue.tracks.shift();
  if (!next) { queue.current = null; return; }
  queue.current = next;
  let extractor;
  try {
    extractor = ytdlp.exec(next.url, {
      format: 'bestaudio[acodec=opus]/bestaudio',
      output: '-',
      noPlaylist: true,
      quiet: true,
      noWarnings: true,
    });
    // The child process is a thenable; attach a handler while the voice player consumes stdout.
    const extractorResult = extractor.then(() => null, (error) => {
      console.error(`[${queue.guildId}] yt-dlp falhou em ${next.url}:`, error.stderr || error.message);
      return null;
    });
    const source = await demuxProbe(extractor.stdout);
    const resource = createAudioResource(source.stream, { inputType: source.type ?? StreamType.Arbitrary, inlineVolume: true, metadata: next });
    resource.volume.setVolume(queue.volume);
    queue.player.play(resource);
    void extractorResult;
  } catch (error) {
    if (extractor && !extractor.killed) extractor.kill();
    console.error(`[${queue.guildId}] Falha ao abrir ${next.url}:`, error.stderr || error.message);
    queue.current = null;
    queue.textChannel?.send(`Não consegui abrir **${next.title}** no YouTube; pulei para a próxima faixa.`).catch(() => {});
    await playNext(queue);
  }
}

export function skip(guildId) {
  const queue = getQueue(guildId);
  if (!queue?.current) return false;
  queue.player.stop(true);
  return true;
}

export function setVolume(guildId, volume) {
  const queue = getQueue(guildId);
  if (!queue) return false;
  queue.volume = Math.max(0, Math.min(1, volume / 100));
  const resource = queue.player.state.resource;
  if (resource?.volume) resource.volume.setVolume(queue.volume);
  return true;
}

export function togglePause(guildId) {
  const queue = getQueue(guildId);
  if (!queue) return null;
  if (queue.player.state.status === AudioPlayerStatus.Paused) { queue.player.unpause(); return 'playing'; }
  if (queue.player.state.status === AudioPlayerStatus.Playing) { queue.player.pause(); return 'paused'; }
  return null;
}

export function stop(guildId) {
  const queue = getQueue(guildId);
  if (!queue) return false;
  queue.tracks = [];
  queue.player.stop(true);
  queue.connection?.destroy();
  queue.connection = null;
  queues.delete(guildId);
  return true;
}
