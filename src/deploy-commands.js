import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('Configure DISCORD_TOKEN e CLIENT_ID no arquivo .env.');

const commands = [
  new SlashCommandBuilder().setName('play').setDescription('Toca uma música ou playlist do YouTube').addStringOption((option) => option.setName('busca').setDescription('Nome da música ou URL do YouTube').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Pula a música atual'),
  new SlashCommandBuilder().setName('volume').setDescription('Ajusta o volume (0 a 100)').addIntegerOption((option) => option.setName('nivel').setDescription('Volume em porcentagem').setRequired(true).setMinValue(0).setMaxValue(100)),
  new SlashCommandBuilder().setName('pause').setDescription('Pausa ou continua a música atual'),
  new SlashCommandBuilder().setName('queue').setDescription('Mostra o painel e a fila de músicas'),
  new SlashCommandBuilder().setName('stop').setDescription('Encerra a reprodução e limpa a fila'),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const route = process.env.GUILD_ID ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) : Routes.applicationCommands(process.env.CLIENT_ID);
await rest.put(route, { body: commands });
console.log(`Registrados ${commands.length} comandos ${process.env.GUILD_ID ? `no servidor ${process.env.GUILD_ID}` : 'globalmente'}.`);
