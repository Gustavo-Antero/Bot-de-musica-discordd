# Bot de música para Discord

Bot em Node.js com comandos slash, fila por servidor e painel minimalista com botões e seletor de volume. A busca usa `play-dl`; a extração do áudio usa `yt-dlp` por meio do pacote `youtube-dl-exec`, que baixa o executável durante a instalação.

## Requisitos

- Node.js 20.11 ou mais recente e pnpm (ou npm). O pacote `youtube-dl-exec` pode precisar de Python 3.9+ para executar o `yt-dlp`, conforme a plataforma.
- Uma aplicação e um bot criados no [Discord Developer Portal](https://discord.com/developers/applications).
- Para áudio em voz, o servidor precisa permitir conexões de voz e o processo precisa ter acesso à internet.

## Configuração

1. No Developer Portal, crie uma aplicação e adicione um bot. Copie o token do bot e o Application ID.
2. Em **OAuth2 → URL Generator**, selecione `bot` e `applications.commands`; dê ao bot permissões **View Channels**, **Send Messages**, **Embed Links**, **Connect** e **Speak**. Abra o link gerado para convidá-lo ao servidor.
3. Copie `.env.example` para `.env` e preencha `DISCORD_TOKEN` e `CLIENT_ID`. Opcionalmente defina `GUILD_ID` para registrar comandos apenas no servidor de teste.
4. Instale dependências e registre comandos:

   ```powershell
   pnpm install
   pnpm run register
   pnpm start
   ```

   Com npm, use `npm install`, `npm run register` e `npm start`.

## Comandos

- `/play busca:<nome ou URL>` — reproduz uma música ou adiciona uma playlist do YouTube à fila.
- `/skip` — pula a faixa atual.
- `/volume nivel:<0–100>` — ajusta o volume.
- `/pause` — pausa ou retoma.
- `/queue` — mostra a fila e os controles.
- `/stop` — encerra e limpa a fila.

O painel do Discord inclui botões para pausar, pular e encerrar, além de um seletor de volume. A fila e o volume são mantidos em memória e recomeçam vazios quando o bot reinicia.
