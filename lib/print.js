import { WAMessageStubType } from 'baileys';
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';

const terminalImage = global.opts['img'] ? require('terminal-image') : '';
const urlRegex = (await import('url-regex-safe')).default({ strict: false });

export default async function (m, conn = { user: {} }) {
  try {
    const _name = await conn.getName(m.sender);
    const sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + _name : '');
    const chat = await conn.getName(m.chat);

    let img;
    if (global.opts['img']) {
      img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false;
    }

    const filesize = calculateFileSize(m);
    const user = global.db.data.users[m.sender];
    const me = PhoneNumber('+' + (conn.user?.jid).replace('@s.whatsapp.net', '')).getNumber('international');
    logMessage(me, conn.user.name, m, chat, filesize, sender, user);

    if (img) console.log(img.trimEnd());
    await handleTextFormatting(m, conn);
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

function calculateFileSize(m) {
  return (m.msg?.vcard?.length || m.msg?.fileLength?.low || m.msg?.text?.length || 0) || 0;
}

function logMessage(me, name, m, chat, filesize, sender, user) {
  console.log(`
  ▣ ${chalk.redBright('%s')}
  │⏰ ${chalk.black(chalk.bgYellow('%s'))}
  │📑 ${chalk.black(chalk.bgGreen('%s'))}
  │📊 ${chalk.magenta('%s [%s %sB]')}
  │📤 ${chalk.green('%s')}
  │📪 ${chalk.yellow('%s%s')}
  │📥 ${chalk.green('%s')}
  │💬 ${chalk.black(chalk.bgYellow('%s'))}
  │📜 ${chalk.cyan('%s')}
  ▣──────···
  `.trim(),
    `${me} ~ ${name}`,
    (m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date()).toTimeString(),
    m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
    filesize,
    filesize === 0 ? 0 : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
    ['', ...'KMGTP'][Math.floor(Math.log(filesize) / Math.log(1000))] || '',
    sender,
    m?.exp || '?',
    user ? `|${user.exp}| |${user.limit}` : `|${user.level}`,
    m.chat + (chat ? ' ~' + chat : ''),
    m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : '',
    m.text || ''
  );
}

async function handleTextFormatting(m, conn) {
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '');
  }
}
