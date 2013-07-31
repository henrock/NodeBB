var user = require('./../user.js'),
	auth = require('./authentication.js'),
	topics = require('./../topics.js'),
	categories = require('./../categories.js')
	utils = require('./../../public/src/utils.js'),
	pkg = require('../../package.json');
	

(function(Api) {
	Api.create_routes = function(app) {
		app.get('/api/get_templates_listing', function(req, res) {
			utils.walk(global.configuration.ROOT_DIRECTORY + '/public/templates', function(err, data) {
				res.json(data);
			});
		});
		
		app.get('/api/home', function(req, res) {
			var uid = (req.user) ? req.user.uid : 0;
			categories.getAllCategories(function(data) {
						
				function iterator(category, callback) {
					categories.getRecentReplies(category.cid, 2, function(posts) {
						category["posts"] = posts;
						category["post_count"] = posts.length>2 ? 2 : posts.length;
						callback(null);
					});
				}
						
				require('async').each(data.categories, iterator, function(err) {
					data.motd_class = (config.show_motd === '1' || config.show_motd === undefined) ? '' : 'none';
					data.motd = marked(config.motd || "# NodeBB v" + pkg.version + "\nWelcome to NodeBB, the discussion platform of the future.\n\n<a target=\"_blank\" href=\"http://www.nodebb.org\" class=\"btn btn-large\"><i class=\"icon-comment\"></i> Get NodeBB</a> <a target=\"_blank\" href=\"https://github.com/designcreateplay/NodeBB\" class=\"btn btn-large\"><i class=\"icon-github-alt\"></i> Fork us on Github</a> <a target=\"_blank\" href=\"https://twitter.com/dcplabs\" class=\"btn btn-large\"><i class=\"icon-twitter\"></i> @dcplabs</a>");
					res.json(data);							
				});
	
			}, uid);
		});

		app.get('/api/login', function(req, res) {
			var data = {},
				login_strategies = auth.get_login_strategies(),
				num_strategies = login_strategies.length;

			if (num_strategies == 0) {
				data = {
					'login_window:spansize': 'span12',
					'alternate_logins:display': 'none'
				};	
			} else {
				data = {
					'login_window:spansize': 'span6',
					'alternate_logins:display': 'block'
				}
				for (var i=0, ii=num_strategies; i<ii; i++) {
					data[login_strategies[i] + ':display'] = 'active';
				}
			}

			data.token = res.locals.csrf_token;

			res.json(data);
		});
		
		app.get('/api/register', function(req, res) {
			var data = {},
				login_strategies = auth.get_login_strategies(),
				num_strategies = login_strategies.length;

			if (num_strategies == 0) {
				data = {
					'register_window:spansize': 'span12',
					'alternate_logins:display': 'none'
				};	
			} else {
				data = {
					'register_window:spansize': 'span6',
					'alternate_logins:display': 'block'
				}
				for (var i=0, ii=num_strategies; i<ii; i++) {
					data[login_strategies[i] + ':display'] = 'active';
				}
			}

			data.token = res.locals.csrf_token;

			res.json(data);
		});
	
		app.get('/api/topic/:id/:slug?', function(req, res) {
			var uid = (req.user) ? req.user.uid : 0;
			topics.getTopicWithPosts(req.params.id, uid, function(err, data) {
				res.json(data);
			});			
		});
		
		app.get('/api/category/:id/:slug?', function(req, res, next) {
			var uid = (req.user) ? req.user.uid : 0;
			categories.getCategoryById(req.params.id, uid, function(err, data) {
				if (!err) 
					res.json(data);
				else 
					next();
			}, req.params.id, uid);			
		});

		app.get('/api/recent', function(req, res) {
			var uid = (req.user) ? req.user.uid : 0;
			topics.getLatestTopics(uid, 0, 9, function(data) {
				res.json(data);
			});
		});

		app.get('/api/unread', function(req, res) {
			var uid = (req.user) ? req.user.uid : 0;
			topics.getUnreadTopics(uid, 0, -1, function(data) {
				res.json(data);
			});
		});

		app.get('/api/confirm/:id', function(req, res) {
			user.email.confirm(req.params.id, function(data) {
				if (data.status === 'ok') {
					res.json({
						'alert-class': 'alert-success',
						title: 'Email Confirmed',
						text: 'Thank you for vaidating your email. Your account is now fully activated.'
					});
				} else {
					res.json({
						'alert-class': 'alert-error',
						title: 'An error occurred...',
						text: 'There was a problem validating your email address. Perhaps the code was invalid or has expired.'
					});
				}
			});
		});

		app.get('/api/outgoing', function(req, res) {
			var url = req.url.split('?');
			if (url[1]) {
				res.json({
					url: url[1],
					home: global.nconf.get('url')
				});
			} else {
				res.status(404);
				res.redirect(global.nconf.get('relative_path') + '/404');
			}
		});	
	}
}(exports));