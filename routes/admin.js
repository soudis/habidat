/* jshint esversion: 8 */
const security = require('../utils/security');
const router = require('express').Router();
const utils = require('../utils');
const Promise = require('bluebird');
const Op = require("sequelize").Op;
const models  = require('../models');
const settings = require('../utils/settings');
const fs = require('fs');
const multer = require('multer');
const email = require('../utils/email');
const moment = require('moment');

module.exports = function(app){

	router.get('/admin/accounts', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, {administrator: true})
			.then(users => {
				return users.doeesnotexist;
			})
			.then(users => utils.render(req, res, 'admin/admin_accounts', {accounts: users, message: req.flash('error')}, 'Administrator*innen Accounts'))
		.catch(error => next(error));
	});

	router.get('/admin/add_account', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'admin/admin_accounts_add', {})
		.catch(error => next(error));
	});

	router.get('/admin/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.destroy({
			where: {
				id: req.params.id,
				administrator: true
			}, trackOptions: utils.getTrackOptions(req.user, true)
		}).then(deleted => {
			if(deleted > 0) {
				res.json({redirect: '/admin/accounts'});
			} else {
				res.status(500).json({error: 'Es wurde kein Account gelöscht, das sollte nicht passieren!'});
			}
		}).catch(error => {
			res.status(500).json({error: error});
		});
	});


	router.post('/admin/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {

		Promise.resolve()
			.then(() => {

				if (!req.body.logon_id) {
					throw 'Login ID muss angegeben werden!';
				} else if (!req.body.email) {
					throw 'E-Mailadresse muss angegeben werden!';
				}

				var length = 16,
				charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
				generatedPassword = "";
				for (var i = 0, n = charset.length; i < length; ++i) {
					generatedPassword += charset.charAt(Math.floor(Math.random() * n));
				}
				var user = {
					logon_id: req.body.logon_id,
					email: req.body.email,
					administrator: true,
					password: generatedPassword
				};
				if (req.body.ldap) {
					user.ldap = true;

				} else {
					user.ldap = false;
				}

				return models.user.build(user);
			})
			.then(user => {
				if (req.body.send_password_link) {
					user.setPasswordResetToken();
					return user.save()
						.then(() => email.sendPasswordMail(req,res,user));
				} else {
					return user.save();
				}
			})
			.then(() => res.send({redirect: '/admin/accounts'}))
			.catch(error => next(error));

	});

	var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, './public/images');
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname);
		}
	});

	router.post('/admin/settings', security.isLoggedInAdmin, multer({storage:storage}).single('logo_upload'), function(req, res, next) {

		Promise.resolve()
			.then(() => {

				var setSetting = function(id, value = undefined) {
					settings.project.set(id, value || req.body[id] ||settings.project.get(id));
				};

				setSetting('projectname');
				setSetting('email');
				setSetting('url');
				setSetting('theme');
				setSetting('defaults.interest_method', req.body.interest_method);
				setSetting('defaults.termination_type', req.body.termination_type);
				setSetting('defaults.termination_period', req.body.termination_period);
				setSetting('defaults.termination_period_type', req.body.termination_period_type);
				setSetting('defaults.relationships', JSON.parse(req.body.relationships) || []);
				setSetting('defaults.country', req.body.country);

				if (req.body.logo_change === 'logo_link') {
					setSetting('logo', req.body.logo_link);
				} else if (req.body.logo_change === 'logo_upload' && req.file && req.file.originalname) {
					setSetting('logo', '/public/images/' + req.file.originalname);
				}

				return settings.project.save();
			})
			.then(() => res.send({redirect: '/admin/settings'}))
			.catch(error => next(error));

	});

	router.get('/admin/settings', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, {administrator: true})
			.then(users => utils.render(req, res, 'admin/settings', {}, 'Einstellungen'))
			.catch(error => next(error));
	});

	router.get('/admin/edit_settings', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'admin/settings_edit', {})
			.catch(error => next(error));
	});


	router.get('/admin/templates', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findAll({
			where: {
				ref_table: {
					[Op.like]: "template_%"
				}
			}
		}).then(function(templates) {
			res.render('admin/templates', { title: 'Vorlagen', templates:templates });
		});
	});

	router.get('/admin/infopack', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findAll({
			where: {
				ref_table: {
			      [Op.like]: "infopack_%"
			    }
			}
		}).then(function(files) {
			groups = {
				balance: {
					title: "Jahresabschlüsse",
					files: []
				},
				infopack: {
					title: "Direktkreditinformationen",
					files: []
				},
				other: {
					title: "Sonstige Dateien",
					files: []
				}
			};
			files.map((file => {
				var group = file.ref_table.split("_")[1];
				file.group = group;
				if (groups[group]) {
					groups[group].files.push(file);
				}
			}));
			res.render('admin/infopack', { title: 'Downloads für Direktkreditgeber*innen', groups: groups });
		});
	});

	router.get('/admin/addtemplate/:type', security.isLoggedInAdmin, function(req, res, next) {
		var titles = {
			infopack_balance: "Jahresabschluss hochladen",
			infopack_infopack: "Kreditinformation hochladen",
			infopack_other: "Sonstige Datei hochladen",
			template_account_notification: "Vorlage für Buchhaltungsbestätigung überschreiben",
			template_user: "Vorlage für Kreditgeber*innen hochladen",
			template_contract: "Vorlage für Kredite hochladen"
		};
		utils.render(req, res, 'admin/template_add', {type: req.params.type, formTitle: titles[req.params.type]})
			.catch(error => next(error));
	});

	router.post('/admin/addtemplate', security.isLoggedInAdmin, multer({dest:'./upload/'}).single('file'), function(req, res, next) {
		var type = req.body.type;
		Promise.resolve()
			.then(() => {
				if (type == "template_account_notification") {
				    return models.file.findOne({ where: { ref_table: "template_account_notification"	}})
				    	.then(function(file) {
							if (file && file.path) {
								try {
									fs.unlinkSync(file.path);
								}catch(error) {

								}
								return file.destroy({trackOptions: utils.getTrackOptions(req.user, true)});
							} else {
								return;
							}
						});
				} else {
					return;
				}
			})
			.then(() => models.file.create({
							filename: req.file.originalname,
							description: req.body.description,
							mime: req.file.mimetype,
							path: req.file.path,
							ref_id: 1,
							ref_table: type
						}, { trackOptions: utils.getTrackOptions(req.user, true) }))
			.then(() => res.json({redirect: 'reload'}))
			.catch(error => res.status(500).json({error: error}));
	});

	router.get('/admin/auditlog/:timeframe', security.isLoggedInAdmin, function(req,res,next) {
			var where = {
			    timestamp: {
      				[Op.gte]: moment().subtract(req.params.timeframe.substr(0,req.params.timeframe.length-1), req.params.timeframe.substr(req.params.timeframe.length -1, 1)).toDate()
    			}
			}
		Promise.join(
			models.userLog.findAll({where: where, include: {all:true}}),
			models.contractLog.findAll({where: where, include: [{model: models.user, as: 'user'},{model: models.contract, as: 'target', include: {model: models.user, as: 'user'}}]} ),
			models.transactionLog.findAll({where: where, include: [{model: models.user, as: 'user'},{model: models.transaction, as: 'target', include: {model: models.contract, as: 'contract', include: {model: models.user, as: 'user'}}}]}),
			models.fileLog.findAll({where: where, include: [{model: models.user, as: 'user'},{model: models.file, as: 'target', include: {model: models.user, as: 'user'}}]} ),
			function(userLog, contractLog, transactionLog, fileLog) {
				const addType = function(list, type) {
					list.forEach(entry => {
						entry.type = type;
					})
					return list;
				}
				var auditLog = addType(userLog, 'user').concat(addType(contractLog, 'contract'), addType(transactionLog, 'transaction'), addType(fileLog, 'file'));
				auditLog.sort((a,b) => {
					return moment(a.timestamp).isAfter(moment(b.timestamp));
				})
	 			res.render('admin/auditlog', {timeframe: req.params.timeframe, auditLog: auditLog, title: 'Änderungsprotokoll'});

			})
	})
	app.use('/', router);

};
