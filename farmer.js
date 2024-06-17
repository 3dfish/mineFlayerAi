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
bot.once('spawn',loop);

function sleep(time){
	return new Promise((res,rej)=>{
		setTimeout(res,time);
	});
}

async function loopPromise(p,time){
	while(1){
		try{
			return await p;
		}catch{
			await sleep(time);
			continue;
		}
	}
}

var pickResolve;
bot.on("playerCollect",(collector,collected)=>{
	if(collector === bot.entity){
		let item = collected.getDroppedItem();
		if(['carrot','wheat_seeds','potato','beetroot_seeds'].includes(item.name)){
			try{
				console.log(item.name);
				pickResolve(item.type);
			}catch{}
		}
	}
});

async function blockToHarvest(){
	while(1){
		let value = bot.findBlock({
		point:bot.entity.position,
		maxDistance:36,
		matching:(block)=>{
			return (['carrots','wheat','potatoes','beetroots'].includes(block.name) && block.metadata==7) || (block.name=='beetroots') && block.metadata==3;
		}});
		if(value!=null){
			return value
		}else{
			await sleep(1000);
			continue;
		}
	}
}

async function chestUC(){
	while(1){
		let value = bot.findBlock({
		point:bot.entity.position,
		maxDistance:36,
		matching:(block)=>{
			if(block.name=='chest'){
				return true;
			}
		},
		useExtraInfo:(block)=>{
			if(bot.blockAt(block.position.offset(0, 1, 0)).name=='composter'){
				return true;
			}
		}
		});
		if(value!=null){
			return value
		}else{
			await sleep(1000);
			continue;
		}
	}
}

async function loop(){
	const defaultMove = new Movements(bot);
	defaultMove.allow1by1towers = false;
	defaultMove.canDig = false;
	defaultMove.allowSprinting = false;
	bot.pathfinder.setMovements(defaultMove);
	while(1){
		const item = bot.inventory.items();
		const itemExi = [];
		let extraItem;
		for(let v of item){
			if(!itemExi.includes(v.type)){
				itemExi.push(v.type);
			}else{
				extraItem = v.type;
				break;
			}
		}
		try{
			if(extraItem){
				try{
					const cuc = await chestUC();
					await bot.pathfinder.goto(new goals.GoalNear(cuc.position.x, cuc.position.y, cuc.position.z, 1));
					const chest = await bot.openContainer(cuc).catch();
					await chest.deposit(extraItem, null, 64);
					chest.close();
				}catch{
					throw '送货发生错误';
				}
			}else{
				const toHarvest = await blockToHarvest();
				const toSow = bot.blockAt(toHarvest.position.offset(0,-1, 0));
				await bot.equip(801,'hand');
				await bot.pathfinder.goto(new goals.GoalBlock(toHarvest.position.x, toHarvest.position.y, toHarvest.position.z));
				await bot.dig(toHarvest);
				const picked = await new Promise((resolve,reject)=>{
					setTimeout(reject,5000);
					pickResolve = resolve;
				}).catch(()=>Promise.reject('拾取种子超时'));
				await Promise.race([sleep(2000).then(()=>Promise.reject('装备种子超时')),loopPromise(bot.equip(picked,'hand'),500)]);
				await Promise.race([sleep(2000).then(()=>Promise.reject('补种超时')),loopPromise(bot.placeBlock(toSow, new Vec3(0, 1, 0)),500)]);
			}
		}catch(err){
			console.log(err);
			await sleep(1000);
			continue;
		}
	}
};
