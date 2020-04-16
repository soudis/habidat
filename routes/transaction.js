const security = require('../utils/security');
const moment = require("moment");
const router = require('express').Router();
const utils = require('../utils');
const models  = require('../models');
const multer = require('multer');

module.exports = function(app){

	/* GET home page. */
	router.get('/transaction/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.transaction.findByPk(req.params.id)
			.then(transaction => {
				return models.contract.findByIdFetchFull(models, transaction.contract_id)
					.then(contract => utils.render(req, res, 'transaction/edit', {contract: contract, transaction: transaction}))
			})
			.catch(error => next(error));
	});

	/* GET home page. */
	router.get('/transaction/add/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.contract.findByIdFetchFull(models, req.params.id)
			.then(contract => utils.render(req, res, 'transaction/add', {contract: contract}))
			.catch(error => next(error));
	});

	router.post('/transaction/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		console.log("contract_id: " + req.body.contract_id);
		models.transaction.create({
				transaction_date: moment(req.body.transaction_date),
				amount: req.body.amount,
				type: req.body.type, 
				contract_id: req.body.contract_id
			})
			.then(() => models.contract.findByIdFetchFull(models, req.body.contract_id))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}))
			})
		    .catch(error => next(error));
	});
	
	router.post('/transaction/edit', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		models.transaction.update({
				transaction_date: moment(req.body.transaction_date),
				amount: req.body.amount,
				type: req.body.type
			}, {where:{id:req.body.id}})
			.then(() => models.contract.findByIdFetchFull(models, req.body.contract_id))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}))		
			})
		    .catch(error => next(error));
	});


	router.get('/transaction/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.transaction.findByPk( req.params.id)
			.then(transaction =>  {
				transaction.destroy()
					.then(() => models.contract.findByIdFetchFull(models, transaction.contract_id))
					.then(contract => {
						return models.file.getContractTemplates()
							.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}))				
							})		
			})
			.catch(error => next(error));
	});

	app.use('/', router);
};
