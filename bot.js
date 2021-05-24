require('dotenv').config();
const token = process.env.token;
const prefix = process.env.prefix;
const address = process.env.address;
const account = process.env.account;
const password = process.env.password;
const database = process.env.database;
const author = parseInt(process.env.author);

const Discord = require('discord.js');
const gcat = new Discord.Client();
const fs = require('fs');
const mysql = require('mysql');

const testdb = mysql.createConnection({
    host: address,
    user: account,
    password: password,
    database: database,
});
testdb.connect((err) => {
    if (err) throw err;
    console.log('正在測試資料庫連線...\n資料庫已成功連線!');
    testdb.end();
    console.log('測試完畢!\n已將資料庫斷線');
});

gcat.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./Extensions');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./Extensions/${folder}`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./Extensions/${folder}/${file}`);
        gcat.commands.set(command.name, command);
    }
}

gcat.on('ready', () => {
    gcat.user.setPresence({
        activity: {
            name: `Powered by GoldOrange261 | Using ${prefix}help`,
            type: 'STREAMING', // PLAYING, STREAMING, LISTENING, WATCHING, CUSTOM_STATUS, COMPETING
        },
        status: 'dnd', // online, idle, dnd, invisible
    });
    console.log(`已登入使用者：${gcat.user.tag}!\n作者：結城あやの`);
});

gcat.on('message', (msg) => {
    const args = msg.content.slice(prefix.length).trim().toLowerCase().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = gcat.commands.get(commandName) || gcat.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
    if (msg.author.bot) return;
    else {
        if (!msg.content.startsWith(prefix)) {
            return;
        } else if (!command) return;
        else {
            if (command.guildOnly && msg.channel.type === 'dm') {
                return msg.reply('這條指令無法在DM執行!');
            }

            if (command.permissions) {
                const authorPerms = msg.channel.permissionsFor(msg.author);
                if (!authorPerms || !authorPerms.has(command.permissions)) {
                    return msg.reply(`您**無法**這麼做\n原因：缺少權限 **${command.permissions}**`);
                }
            }

            if (command.args && !args.length) {
                let reply = `您未提供任何參數!`;

                if (command.usage) {
                    reply += `\n這條指令的用法應該要像這樣： \`${prefix}${command.name} ${command.usage}\``;
                }

                return msg.reply(reply);
            }
            if (command.OwnerOnly) {
                const uid = msg.author.id;
                if (uid === author) command.execute(msg, args, prefix, command);
                else return msg.reply(`您**無法**這麼做\n原因：不是作者`);
            }
            if (command.needSQL) {
                try {
                    // const connection = mysql.createConnection({
                    // host: address,
                    // user: account,
                    // password: password,
                    // database: database,
                    // });
                    // connection.connect(async(err) => {
                    // if (err) throw err;
                    // console.log('資料庫已成功連線!');
                    // await command.execute(msg, args, prefix, command);
                    // connection.end();
                    // console.log('查詢完畢！\n已將資料庫斷線');
                    // });
                    return msg.reply('由於SQL Server尚未上線\n無法使用此功能');
                } catch (error) {
                    msg.channel.send(`<@${author}>Bot炸啦\n\`\`\`${error}\`\`\``);
                }
            } else {
                try {
                    command.execute(msg, args, prefix, command);
                } catch (error) {
                    msg.channel.send(`<@${author}>Bot炸啦\n\`\`\`${error}\`\`\``);
                }
            }
        }
    }
});

gcat.login(token);