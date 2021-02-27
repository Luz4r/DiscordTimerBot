const Discord = require('discord.js');
const bot = new Discord.Client();
require('dotenv').config();

var users = new Discord.Collection();
var server;
var voiceChannels = [];

function updateTimer(){
    voiceChannels.forEach(vChannel => {
        vChannel.members.forEach(member => {
            if(!users.has(member.id) && !member.user.bot){
                users.set(member.id, {user: member, workTime: 0, isOnServer: true});
                console.log(`${member.user.username} joined for the first time`)
            } else if(users.has(member.id) && !users.get(member.id).isOnServer) {
                console.log(`${member.user.username} returned to the server :)`);
                users.get(member.id).isOnServer = true;
            }
        });
    });

    users.filter(member => {
        return member.isOnServer;
    }).each((member, memberID) => {
        let hasLeft = true;
        voiceChannels.forEach(vChannel => {
            if(vChannel.members.size !== 0){
                if(vChannel.members.has(memberID)){
                    hasLeft = false;
                }
            }
        });

        if(hasLeft){
            let today = new Date();
            let day = today.getDate()
            let month = today.getMonth() + 1;
            let year = today.getFullYear();
            let date = [day, month, year].join('-');

            // If left, send him today's work time
            console.log(`${member.user.displayName} left the server :(`);
            member.user.send(`[${date}] Work time: ${member.workTime} min`);
            member.isOnServer = false;
        } else{
            // Increment work time
            member.workTime += 1;
        }
    });
}

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);

    server = bot.guilds.cache.find((guild) => {
        if(guild.name === 'BotTest'){
            return guild;
        }
    });

    server.channels.cache.forEach(channel => {
        if(channel.type === 'voice'){
            voiceChannels.push(channel);
        }
    });

    // Initial user count
    updateTimer();
});

// Handle messages
bot.on('message', msg => {
    if (msg.content === 'users'){
        msg.delete();
        voiceChannels.forEach(vChannel => {
            vChannel.members.forEach(member => {
                console.log(member.displayName);
            });
        });
    }
});

// Check if user left or new joined
bot.setInterval(() => {
    if(!server) return;
    updateTimer();
}, 10000)

bot.login(process.env.BOT_SECRET);