const { Vec3 } = require('vec3')
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

if (process.argv.length < 4 || process.argv.length > 4) {
	console.log('Usage : node <...>.js <host> <name>');
	process.exit(1);
}

const bot = mineflayer.createBot({
	host: process.argv[2],
	username: process.argv[3]
})

bot.loadPlugin(pathfinder);

bot.on("playerCollect",(collector,collected)=>{
	if(collector === bot.entity){
		console.log(collected.getDroppedItem());
	}
});

bot.on('message', (cm) => {
	if (cm.toString().includes('show')) {
		console.log(bot.inventory.items());
	}
});