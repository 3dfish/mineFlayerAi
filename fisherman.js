const mineflayer = require('mineflayer')

if (process.argv.length < 4 || process.argv.length > 4) {
	console.log('Usage : node <...>.js <host> <name>');
	process.exit(1);
}

const bot = mineflayer.createBot({
	host: process.argv[2],
	username: process.argv[3]
})

// To fish we have to give bot the fishing rod and teleport bot to the water
// /give fisherman fishing_rod 1
// /teleport fisherman ~ ~ ~

// To eat we have to apply hunger first
// /effect fisherman minecraft:hunger 1 255

var fish = false;
var stopFish = false;
bot.on('spawn',()=>{
	fish = true;
	startFishing();
});

bot.on('message', (cm) => {
	if (cm.toString().includes('start')) {
		if(!fish){
			fish = true;
			startFishing();
		}
	}

	if (cm.toString().includes('stop')) {
		stopFishing()
	}
})
	
async function startFishing () {
	bot.chat('Fishing')

	try {
		await bot.fish()
	} catch (err) {
		bot.chat(err.message)
	}
	if(!stopFish){
		return startFishing();
	}else{
		fish = false;
		stopFish = false;
		return;
	}
}

function stopFishing () {
	bot.chat('Stop Fishing')
	bot.activateItem();
	stopFish = true;
}