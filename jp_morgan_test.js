const stock_props = {
	TEA: {
		type: 'Common',
		last_dividend: 0,
		fixed_dividend: '',
		par_value: 100,
	},
	POP: {
		type: 'Common',
		last_dividend: 8,
		fixed_dividend: false,
		par_value: 100,
	},
	ALE: {
		type: 'Common',
		last_dividend: 23,
		fixed_dividend: false,
		par_value: 60,
	},
	GIN: {
		type: 'Preferred',
		last_dividend: 8,
		fixed_dividend: 2,
		par_value: 100,
	},
	JOE: {
		type: 'Common',
		last_dividend: 13,
		fixed_dividend: false,
		par_value: 250,
	},
};

// To store trade objects. Keys here could represent foreign keys
const trades = { TEA: [], POP: [], ALE: [], GIN: [], JOE: [] };

// Basically the controller
class StockMarket {
	constructor() {
		this.children = [];
		this.trade = new Trade();
	}

	add_stock(obj, price) {
		this.children.push(obj);
	}

	all_share_index() {
		const vwsp_arr = this.children.map((stock) => stock.calc_vwsp(this.trade));
		let product = 1;

		for (let i = 0; i < vwsp_arr.length; i++) {
			product = product * vwsp_arr[i];
		}

		return Math.pow(product, 1 / vwsp_arr.length).toFixed(6);
	}
}

class Trade {
	register_trade(symbol, operation, price, qty) {
		const trade_object = {
			operation: operation, // Could also be a boolean e.g. buy: false. Could make for slightly easier checks
			quantity: qty,
			price: price, // Not using object's price value since unclear whether the i. and ii. given price is only for "inspecting" the stock before making a trade. Easily changeable
			timestamp: Date.now(), // Unix timestamp, since no preferred format is required and it's a format that you can manipulate however you want
		};
		trades[symbol].push(trade_object);
	}

	retrieve_relevant_trades(symbol, time_range = 300000) {
		const filtered_trades = trades[symbol].filter((trade) => Date.now() - trade.timestamp < time_range);

		return filtered_trades;
	}
}

class Stock {
	constructor(symbol, price) {
		this.symbol = symbol;
		this.price = price;
		this.stock_props = this.retrieve_stock_props() ?? null;
		this.divident_yield = this.calc_divident_yield();
		this.pe_ratio = this.calc_pe_ratio();
	}

	retrieve_stock_props() {
		return stock_props[this.symbol];
	}

	calc_divident_yield() {
		if (!this.stock_props) throw 'Missing stock property data.';

		switch (this.stock_props.type) {
			case 'Common':
				return (this.stock_props.last_dividend / this.price).toFixed(2);
				break;
			case 'Preferred':
				return (((this.stock_props.fixed_dividend / 100) * this.stock_props.par_value) / this.price).toFixed(2);
				break;
			default:
				throw 'Unexpected stock property "type" value';
				break;
		}
	}

	calc_pe_ratio() {
		return (this.price / this.calc_divident_yield()).toFixed(2);
	}

	// Volume Weighted Stock Price
	calc_vwsp(trade_obj) {
		const recent_trades = trade_obj.retrieve_relevant_trades(this.symbol);
		if (recent_trades.length === 0) throw 'No relevant trades';

		let numerator = 0;
		let denominator = 0;

		for (let i = 0; i < recent_trades.length; i++) {
			numerator += recent_trades[i].price * recent_trades[i].quantity;
			denominator += recent_trades[i].quantity;
		}

		return (numerator / denominator).toFixed(2);
	}
}

// #################### TESTING ####################
// For easier testing, not for deployment. Generating trade records
const do_trades = (stock_obj) => {
	const trade_num = Math.round(Math.random() * 10);
	for (let i = 0; i < trade_num; i++) {
		const operation = Math.random() > 0.5 ? 'buy' : 'sell';
		const price = Math.round(Math.random() * 10);
		const quantity = Math.round(Math.random() * 100);

		stock_market.trade.register_trade(stock_obj.symbol, operation, price, quantity);
	}
};

const stock_market = new StockMarket();
stock_market.add_stock(new Stock('TEA', 15));
stock_market.add_stock(new Stock('POP', 10));
stock_market.add_stock(new Stock('ALE', 9));
stock_market.add_stock(new Stock('GIN', 14));
stock_market.add_stock(new Stock('JOE', 12));

stock_market.children.map((stock) => do_trades(stock));

console.log(stock_market.children.map((stock) => stock.calc_vwsp(stock_market.trade)));
console.log(stock_market.all_share_index());
