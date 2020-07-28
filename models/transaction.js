/* jshint esversion: 8 */

const moment = require('moment');
const settings = require('../utils/settings');
const format = require('../utils/format');
const intl = require('../utils/intl');

module.exports = (sequelize, DataTypes) => {
		transaction = sequelize.define('transaction', {
			id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			contract_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'contract',
					key: 'id'
				}
			},
			type: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			transaction_date: {
				type: DataTypes.DATEONLY,
				allowNull: false
			},
			amount: {
				type: DataTypes.DECIMAL(14,2),
				allowNull: false,
				validate: {
					isValid: function(value) {
		    		  	//console.log("value " + this.type);
		    		  	if (this.type === 'withdrawal' || this.type === 'termination' || this.type === 'notreclaimed'){
		    		  		if (value >= 0) {
		    		  			throw new Error("Rückzahlungen müssen negativ sein");
		    		  		}
		    		  	} else {
		    		  		if (value <= 0) {
		    		  			throw new Error("Einzahlungen müssen positiv sein");
		    		  		}
		    		  	}
	    			}
	    		}
	    	},
	    	payment_type: {
				type: DataTypes.TEXT,
				allowNull: true
			}
		}, {
			tableName: 'transaction',
			freezeTableName: true
		}
	);

	transaction.associate = function (db) {
		db.transaction.belongsTo(db.contract, {
			onDelete: "CASCADE",
			foreignKey: 'contract_id'
		});
	};

	transaction.getColumns = function () {
		return {
			transaction_id: {id: "transaction_id", label: "Zahlungsnummer", filter: 'text'},
			transaction_type: {id: "transaction_type", label: "Zahlungsrichtung", filter: 'text'},
			transaction_date: {id: "transaction_date", label: "Zahlungsdatum", filter: 'date'},
			transaction_amount: {id: "transaction_amount", label: "Zahlungsbetrag", class: "text-right", filter: 'number'},
			transaction_payment_type: {id: "transaction_payment_type", label: "Zahlungsart", filter: 'text'}
		}
	}

	transaction.prototype.getRow = function (effectiveDate = undefined, interestYear = undefined) {
		var transaction = this;
		return {
			transaction_id: { valueRaw: transaction.id, value: transaction.id },
			transaction_type: { valueRaw: transaction.getTypeText(), value: transaction.getTypeText() },
			transaction_date: { valueRaw: transaction.transaction_date, value: moment(transaction.transaction_date).format('DD.MM.YYYY'), order: moment(transaction.transaction_date).format('YYYY/MM/DD') },
			transaction_amount: { valueRaw: transaction.amount, value: format.formatMoney(transaction.amount,2), order: transaction.amount},
			transaction_payment_type: { valueRaw: transaction.getPaymentTypeText(), value: transaction.getPaymentTypeText() }
		};
	}

	transaction.prototype.getTypeText = function () {
		switch(this.type) {
			case "initial":
			return 'Einzahlung';
			case "deposit":
			return 'Zusatzzahlung';
			case "withdrawal":
			return 'Teilauszahlung';
			case "termination":
			return 'Rückzahlung';
			case "notreclaimed":
			return 'Nicht rückgefordert';
		}

		return "Unbekannt";
	};

	transaction.prototype.getPaymentTypeText = function () {
		if (this.payment_type && this.payment_type !== null) {
			return intl._t('payment_type_' + this.payment_type)
		} else {
			return '-';
		}
	};


	transaction.prototype.getLink = function () {
		return `<a href="/user/show/${this.contract.user.id}#show_transaction_${this.id}">${moment(this.transaction_date).format('DD.MM.YYYY')}</a>`;
	}

	transaction.prototype.getDescriptor = function (models) {
		return `Zahlung vom ${this.getLink()} für den Vertrag vom ${this.contract.getLink()} von ${this.contract.user.getLink()}`;
	};


	transaction.prototype.interestToDate = function (rate, toDate) {

		if (rate > 0 && moment(toDate).diff(this.transaction_date) >= 0) {
			var methodString = settings.project.get('defaults.interest_method') || '365_compound';
			var method = methodString.split('_')[0];
			var methodCompound = methodString.split('_')[1];

			var getBaseDays = function(date) {
				if (method === 'ACT') {
					return moment(date).endOf('year').dayOfYear();
				} else if (method === '30E360') {
					return 360;
				} else {
					return parseInt(method);
				}
			}

			//var method_days = 365;
			var amountWithInterest = this.amount;
			var fromDate = moment(this.transaction_date);
			var endOfYear = moment(fromDate).endOf('year');
	      	// if toDate is before end of year
	      	if (endOfYear.diff(toDate) >= 0) {
	        	// calculation interest until toDate
	        	var interestDays = 0;
	        	if (method === '30E360') {
	        		var endOfMonth = fromDate.endOf('month');
	        		if (endOfMonth.diff(toDate) >= 0) {
	        			interestDays = moment(toDate).diff(fromDate, 'days');
	        		} else {
	        			interestDays = 30 - fromDate.date();
	        			var months = moment(toDate).diff(endOfMonth, 'months');
	        			interestDays += months * 30 + moment(toDate).date();
	        		}
	        	} else {
	        		interestDays = moment(toDate).diff(fromDate, 'days');
	        	}
	        	amountWithInterest += amountWithInterest * rate / 100 * interestDays / getBaseDays(fromDate);
	      	// if toDate is after end of year
	  		} else {
	        	// calculation interest until end of first year

	        	var interestDays = 0;
	        	if (method === '30E360') {
	       			interestDays = 30 - fromDate.date();
	        		var months = 12 - fromDate.month() - 1;
	        		interestDays += months * 30;
	        	} else {
	        		interestDays = endOfYear.diff(fromDate, 'days');
	        	}
	        	amountWithInterest += amountWithInterest * rate / 100 * interestDays / getBaseDays(fromDate);
	        	// calculation interest for all full years
	        	var years = moment(toDate).diff(endOfYear, 'years');
	        	if (years > 0) {
	        		if (methodCompound === 'nocompound') {
	        			amountWithInterest += this.amount * rate / 100 * years;
	        		} else {
	        			amountWithInterest = amountWithInterest * Math.pow(1+rate/100, years);
	        		}
	        	}

	        	if (method === '30E360') {
	       			interestDays = moment(toDate).date();
	        		var months = moment(toDate).month();
	        		interestDays += months * 30;
	        	} else {
	        		interestDays = moment(toDate).diff(endOfYear.add(years, 'years'),'days');
	        	}

	        	//calculate interest for remaining days in last year
	        	if (methodCompound === 'nocompound') {
	        		amountWithInterest += this.amount * rate / 100 * interestDays / getBaseDays(toDate);
	        	} else {
	        		amountWithInterest += amountWithInterest * rate / 100 * interestDays / getBaseDays(toDate);
	        	}
	    	}
	    	return amountWithInterest - this.amount;
		} else {
			return 0;
		}
	};

	return transaction;
};
