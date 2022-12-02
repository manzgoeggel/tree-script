import ccxt from "ccxt";
import chalk from "chalk";
import inquirer from "inquirer";

const TICKER = "ETH/USDT";

//binance related;
let binance;
let apiKey = "";
let lastTickerPrice = 0;

console.log("********************************************")
console.log("********************************************")
console.log("********************************************")
console.log(chalk.blue("hi & welcome to the tree script"));
console.log("********************************************")
console.log("********************************************")
console.log("********************************************")
inquirer
	.prompt([
		{
			type: "input",
			name: "apiKey",
			message: "Enter you binance api key (note: this key is only stored in the current process and will get deleted once you end it”)",
			default: "",
			filter(value) {
				apiKey = value;
				return value;
			},
		},
		{
			type: "input",
			name: "secretKey",
			message: "Enter you binance secret key (note: this secret is only stored in the current process and will get deleted once you end it”)",
			default: "",
			filter: async (value) => {
				//initiate binance class
				binance = new ccxt.binanceusdm({
					apiKey,
					secret: value,
				});

				//fetch the lastest market price & set it
				const market = await binance.fetchTicker(TICKER);
				console.log("last price:", market.last)
				lastTickerPrice = market.last;

				return value;
			},
		},
		{
			type: "input",
			name: "notionalSize",
			message: "Enter your notional size in USD",
			validate(value) {
				const valid = !isNaN(parseFloat(value));
				return valid || "Please enter a number";
			},
			filter: Number,
			default: 1,
		},
		{
			type: "input",
			name: "longMultiplier",
			message: "Enter your position multiplier for LONG (e.g. 0.5 => 0.5 * notional_size)",
			validate(value) {
				const valid = !isNaN(parseFloat(value));
				return valid || "Please enter a number";
			},
			filter: Number,
			default: 1,
		},
		{
			type: "input",
			name: "shortMultiplier",
			message: "Enter your position multiplier for SHORT (e.g. 1.3 => 1.3 * notional_size)",
			validate(value) {
				const valid = !isNaN(parseFloat(value));
				return valid || "Please enter a number";
			},
			filter: Number,
			default: 1,
		},
		{
			type: "list",
			name: "positionSide",
			message: "Choose your side and confirm to open position",
			choices: [
        {
          key: "",
          name: "🔴 SHORT",
          value: "SHORT"
        },
        {
          key: "",
          name: "🟢 LONG",
          value: "LONG",
        }

      ],
			default: false,
		},
	])
	.then(async (answers) => {
		const { positionSide, longMultiplier, shortMultiplier, notionalSize } = answers;
		const notionalUSDvalue = notionalSize * (positionSide === "SHORT" ? shortMultiplier : longMultiplier);
    const positionSizeInTicker = Math.round((notionalUSDvalue / lastTickerPrice) * 100) / 100;

 
  
    if (lastTickerPrice <= 0) {
      throw new Error("ticker price can't be 0");
      return;
    }

		if (positionSide === "LONG") {
			binance
				.createMarketBuyOrder(TICKER, positionSizeInTicker, {})
				.then((res) => {
					console.log(`✅ Successfully posted ${chalk.green(positionSide)}!.Total notional:${chalk.blueBright("$" + notionalUSDvalue)}`);
				})
				.catch((error) => {
					console.log(chalk.red("Oops, something went wrong: ", error));
				});
			return;
		}
		if (positionSide === "SHORT") {
			binance
				.createMarketSellOrder(TICKER, positionSizeInTicker, {})
				.then((res) => {
					console.log(`✅ Successfully posted ${chalk.red(positionSide)}!.Total notional:${chalk.blueBright("$" + notionalUSDvalue)}`);
				})
				.catch((error) => {
					console.log(chalk.red("Oops, something went wrong: ", error));
				});
			return;
		}
	})
	.catch((error) => {
    console.log("Oops, something went wrong: ", error);
	});
