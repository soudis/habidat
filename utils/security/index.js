/* jshint esversion: 8 */
const moment = 	require("moment");
const url = 	require('url');
const utils =   require('../');

//route middleware to make sure a user is logged in
exports.isLoggedIn = function(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	// 	if they aren't redirect them to the home page
	req.session.returnTo = req.url;
	if (req.addPath) {
		req.session.returnTo = req.addPath + req.session.returnTo;
	}
	res.redirect(utils.generateUrl(req, '/login'));
};

//route middleware to make sure a user is logged in
exports.isLoggedInAdmin = function(req, res, next) {
	// 	if user is authenticated in the session, carry on
	if (req.isAuthenticated() && req.user.dn)
		return next();
	else if (req.isAuthenticated() && (req.user.isAdmin()))
		return next();
	else if (req.isAuthenticated()) {
		res.redirect(utils.generateUrl(req, '/profile'));
	} else {
		req.session.returnTo = req.url;
		if (req.addPath) {
			req.session.returnTo = req.addPath + req.session.returnTo;
		}
		res.redirect(utils.generateUrl(req, '/login'));
	}
};

exports.redirectReload = function(redirectUrl) {
	var u = url.parse(redirectUrl, true, false);
		u.query.v = +new Date(); // add versioning to bust cache
		delete u.search;
		return url.format(u);
	};

	exports.getPrevURL = function(req) {
		if (req.session.prevURLs && req.session.prevURLs.length >= 2) {
			return req.session.prevURLs[req.session.prevURLs.length-2];
		} else{
			return "/";
		}
	};