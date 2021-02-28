const Discord = require('discord.js');
const bot = new Discord.Client();
require('dotenv').config();

var users = new Discord.Collection();
var server;
var voiceChannels = [];
var botChannel;
var today = new Date();
var botMessage = "React on this message if you want to count your online time on this discord server";

function getStringDate(inDate){
    let day = ("0" + inDate.getDate()).slice(-2);
    let month = ("0" + (inDate.getMonth() + 1)).slice(-2);
    let year = inDate.getFullYear();
    let date = [day, month, year].join('-');
    return date;
}

function updateTimer(){
    voiceChannels.forEach(vChannel => {
        vChannel.members.forEach(member => {
            if(!users.has(member.id) && !member.user.bot){
                users.set(member.id, {user: member, workTime: 0, isOnServer: true, joinTime: today.getHours() + ":" + today.getMinutes()});
                console.log(`${member.user.username} joined for the first time today`)
            } else if(users.has(member.id) && !users.get(member.id).isOnServer) {
                console.log(`${member.user.username} returned to the server`);
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
            //let date = getStringDate(today)

            //let hours = Math.floor(member.workTime / 60);
            //let minutes = member.workTime - hours * 60;

            // If left, send him today's work time
            console.log(`${member.user.displayName} left the server`);
            //member.user.send(`You have started working today at: ${member.joinTime}\n[${date}] Work time: ${hours} h ${minutes} min`);
            member.isOnServer = false;
        } else{
            // Increment work time
            member.workTime += 1;
        }
    });
}

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(`Bot started on ${getStringDate(today)}`)

    server = bot.guilds.cache.find((guild) => {
        if(guild.name === 'BotTest'){
            return guild;
        }
    });

    if(!server) return;

    server.channels.cache.forEach(channel => {
        if(channel.type === 'voice'){
            voiceChannels.push(channel);
        }
    });

    server.channels.cache.each(channel => {
        if(channel.name === 'timer-bot' && channel.isText()){
            botChannel = channel;
        }
    });

    if(!botChannel) { console.log("Can't find timer-bot text channel on server!"); return; }
    botChannel.messages.fetch()
            .then( messages => {
                let isThereAMessage = false;

                messages.each( message => {
                    if(message.content === botMessage && message.author.id === bot.user.id){
                        isThereAMessage = true;
                    }
                });

                if(!isThereAMessage || messages.size < 1){
                    botChannel.send(botMessage)
                        .then(message => { message.react("👍"); })
                        .catch(console.error);
                }
            })
            .catch(console.error);

    // Initial user count
    updateTimer();
});

bot.on('messageReactionAdd', ( reaction, user ) => {
    if(user.bot) return;
    if(!botChannel) return;
    if(reaction.message.channel === botChannel){
        console.log(user.id);
    }
});

// Handle messages
bot.on('message', msg => {
    if(msg.channel.name === 'timer-bot'){
        if(msg.content === "!time"){
            let member = users.get(msg.author.id);
            let date = getStringDate(today)

            let hours = Math.floor(member.workTime / 60);
            let minutes = member.workTime - hours * 60;

            msg.author.send(`You have started working today at: ${member.joinTime}\n[${date}] Work time: ${hours} h ${minutes} min`);
            msg.delete()
                .catch(console.error);
        }
    }
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

    if(getStringDate(today) !== getStringDate(new Date())){
        today = new Date();
        console.log("NEW DAY!")

        users.each(member => {
            let date = getStringDate(today)

            let hours = Math.floor(member.workTime / 60);
            let minutes = member.workTime - hours * 60;

            member.user.send(`Day has ended! GJ!\nYou have started working today at: ${member.joinTime}\n[${date}] Work time: ${hours} h ${minutes} min`);
        });

        users.clear();
    }

    updateTimer();
    console.log("Updating timers!");
}, 60000)

bot.login(process.env.BOT_SECRET);