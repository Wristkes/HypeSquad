import {
    Client,
  GatewayIntentBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  Message,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,

} from 'discord.js';
import axios from 'axios';

// Config

const BOT_TOKEN = 'SEU_BOT_TOKEN';
const PREFIX = '!';
const BANNER_URL = "https://i.imgur.com/gT4ZPto.png" // Substitui por usa imagem se quiser

const userTokens = new Map<string, string>();

// HypeSquad

interface DiscordUser {
    username: string;
    public_flags: number;
}

type HypeSquadHouse = 1 | 2 | 3;

const HOUSES: Record<HypeSquadHouse, { name: string; emoji: string }> = {
  1: { name: 'Bravery',    emoji: '🦁' },
  2: { name: 'Brilliance', emoji: '🧠' },
  3: { name: 'Balance',    emoji: '⚖️' },

};

// Discord API

async function getUser(token: string): Promise<DiscordUser>
{
     const res = await axios.get<DiscordUser>('https://discord.com/api/v9/users/@me', {
    headers: { Authorization: token },
  });
  return res.data;

}

async function getCurrentHouse(token: string): Promise<HypeSquadHouse | null> {
    const user = await getUser(token);
    const f = user.public_flags;
    if (f & 64)  return 1;
    if (f & 128) return 2;
    if (f & 256) return 3;
    return null;
}

async function setHypeSquad(token: string, houseId: HypeSquadHouse): Promise<void> {

     await axios.post(
    'https://discord.com/api/v9/hypesquad/online',
    { house_id: houseId },
    { headers: { Authorization: token } },
  );
}    

async function removeHypeSquad(token: string): Promise<void>
{
    await axios.delete('https://discord.com/api/v9/hypesquad/online', {
        headers: { Authorization: token },
    });
}

// Painel

  async function buildPanel(userId: string): Promise<ContainerBuilder> {
  const token      = userTokens.get(userId);
  const configured = !!token;
 
  let statusLine   = '🔴 Conta não configurada';
  let currentHouse: HypeSquadHouse | null = null;
 
  if (configured && token) {
    try {
      const user = await getUser(token);
      currentHouse = await getCurrentHouse(token);
      const houseLabel = currentHouse
        ? `${HOUSES[currentHouse].emoji} ${HOUSES[currentHouse].name}`
        : 'Nenhuma';
      statusLine = `🟢 **${user.username}** — Casa atual: ${houseLabel}`;
    } catch {
      userTokens.delete(userId);
      statusLine = '🔴 Token inválido — reconfigure';
    }
  }
 
  // Opções do select menu
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel('⚙️ Configurar conta')
      .setDescription('Insira seu token pessoal')
      .setValue('config'),
  ];
 
  if (configured) {
    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel('🦁 Bravery')
        .setDescription('HypeSquad Bravery')
        .setValue('house_1')
        .setDefault(currentHouse === 1),
      new StringSelectMenuOptionBuilder()
        .setLabel('🧠 Brilliance')
        .setDescription('HypeSquad Brilliance')
        .setValue('house_2')
        .setDefault(currentHouse === 2),
      new StringSelectMenuOptionBuilder()
        .setLabel('⚖️ Balance')
        .setDescription('HypeSquad Balance')
        .setValue('house_3')
        .setDefault(currentHouse === 3),
      new StringSelectMenuOptionBuilder()
        .setLabel('❌ Remover HypeSquad')
        .setDescription('Remove a insígnia do perfil')
        .setValue('house_remove'),
    );
  }
 
  const container = new ContainerBuilder()
    // Imagem no topo
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(BANNER_URL),
      ),
    )
    // Título
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# ⚙️  HypeSquad Manager'),
    )
    // Separator
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
    )
    // Descrição / status
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${statusLine}\n\n${
          configured
            ? '-# Selecione abaixo para trocar sua insígnia de HypeSquad.'
            : '-# Configure sua conta primeiro para liberar as opções.'
        }`,
      ),
    )
    // Select menu
    .addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('panel_select')
          .setPlaceholder(configured ? 'Selecione uma opção...' : '⚙️ Configure sua conta primeiro')
          .addOptions(options),
      ),
    );
 
  return container;
}

// Client

const client = new Client ({
    intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('✅ Online como ${client.user?.tag}');
});

// Comando 
    client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
 
  const command = message.content.slice(PREFIX.length).trim().toLowerCase();
 
  if (command === 'hype') {
    const panel = await buildPanel(message.author.id);
    await message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });
  }
});
 
// UI 
client.on('interactionCreate', async (interaction) => {
 
  // Select menu
  if (interaction.isStringSelectMenu() && interaction.customId === 'panel_select') {
    const select = interaction as StringSelectMenuInteraction;
    const value  = select.values[0];
 
    // Abrir modal de token
    if (value === 'config') {
      const modal = new ModalBuilder()
        .setCustomId('token_modal')
        .setTitle('Configurar conta')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('token_input')
              .setLabel('Seu token pessoal do Discord')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Cole aqui seu token...')
              .setRequired(true),
          ),
        );
 
      await select.showModal(modal);
      return;
    }
 
    // Ações de HypeSquad
    const token = userTokens.get(select.user.id);
    if (!token) {
      await select.reply({
        content: '❌ Configure sua conta primeiro!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
 
    await select.deferUpdate();
 
    try {
      if (value === 'house_remove') {
        await removeHypeSquad(token);
      } else {
        const houseId = parseInt(value.replace('house_', '')) as HypeSquadHouse;
        await setHypeSquad(token, houseId);
      }
    } catch {
      await select.followUp({
        content: '❌ Erro ao atualizar insígnia. Verifique seu token.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
 
    const panel = await buildPanel(select.user.id);
    await select.editReply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }
 
  // Modal 
  if (interaction.isModalSubmit() && interaction.customId === 'token_modal') {
    const modal = interaction as ModalSubmitInteraction;
    await modal.deferUpdate();
 
    const token = modal.fields.getTextInputValue('token_input').trim();
 
    try {
      await getUser(token);
      userTokens.set(modal.user.id, token);
    } catch {
      await modal.followUp({
        content: '❌ Token inválido! Tente novamente.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
 
    const panel = await buildPanel(modal.user.id);
    await modal.editReply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });
  }
});

// Login
client.login(BOT_TOKEN);