/**
 * AjaxForm - v0.2.0
 *
 * @author  UNION <union.co>
 * @copyright 2014 Union, LLC
 * @license http://www.opensource.org/licenses/mit-license.html MIT License
 */

;(function($) {

	function AjaxForm(wrap, options) {

		var form = this;
		form.wrap = $(wrap);

		var o = {
			errorClass: 'error',
			namespace: false,
			namespaceSetter: 'namespace',
			submitActiveHTML: 'Submit',
			submitInactiveHTML: '<i class="ajax-waiting"></i>',
			successCallback: function(form, response) {
				var modal = form.wrap.parents('.reveal-modal');
				var message = $('<p class="message message-success"></p>').html(response.message);

				form.wrap.replaceWith(message);

				if (modal.length) {

					setTimeout(function() {
						modal.foundation('reveal', 'close');
					}, 2000);

					setTimeout(function() {
						form.reset();
						message.replaceWith(form.wrap);
					}, 3500);
				}

			},
			failCallback: function(form, response) {}
		};

		form.init = function () {
			if (form.wrap[0].ajaxForm) {
				return form.wrap[0].ajaxForm;
			}

			prepare();
			setMethods();
			bindEvents();

			form.wrap[0].ajaxForm = form;
			return form.wrap[0].ajaxForm
		};

		function prepare() {

			o = $.extend(o, options);
			o.namespace = form.wrap.data(o.namespaceSetter) || o.namespace;

			form.subButton = form.wrap.find('button');
			form.errors = [];
		}

		function setMethods() {

			form.set = function (name, value) {
				if ($.isPlainObject(name)) {
					$.extend(o, name);
				} else if (o.hasOwnProperty(name)) {
					o[name] = value;
				}
			};

			form.dump = function () {
				console.log(o);
			};

			form.reset = function() {
				form.wrap.get(0).reset();
			}

		}

		function bindEvents() {

			function submittable(enabled) {

				var buttonHTML = enabled ? o.submitActiveHTML : o.submitInactiveHTML;

				form.subButton.html(buttonHTML).prop('disabled', !enabled);
			}

			var events = {
				removeError: function() {
					this.errorMessage.remove();
					this.errorMessage = undefined;
					$(this).removeClass(o.errorClass);

					form.errorCount--;

					if (form.errorCount == 0) {
						submittable(true);
					}
				},
				submit: function (e) {
					e.preventDefault();

					submittable(false);

					$
						.ajax({
							type: "POST",
							url: form.wrap.attr('action'),
							data: form.wrap.serialize(),
							dataType: 'json'
						})
						.done(function(response) {
							submittable(true);
							o.successCallback(form, response);
						})
						.fail(function(response) {

							form.errorCount = 0;

							if (response.responseJSON) {

								form.subButton.html(o.submitActiveHTML);
								var errors = response.responseJSON.errors;

								$.each(errors, function(key, errors) {
									var name = o.namespace ? o.namespace + '[' + key + ']' : key;
									var input = $('[name="' + name + '"]');

									if (input.length) {

										input.addClass(o.errorClass)
											.one('keyup.error', events.removeError);

										var message = $('<small class="'+ o.errorClass +'"></small>').html(errors[0]);

										var parent = input.parents('label');
										if (!parent.length) {
											parent = input.parent();
										}

										form.errorCount++;

										parent.append(message);
										input.get(0).errorMessage = message;
									}
								})
							}

							if (form.errorCount == 0) {
								submittable(true);
							}

							o.failCallback(form, response);
						})
					;

					return false;
				}
			};

			form.wrap.on('submit.ajaxForm', events.submit);
		}
	}

	$.fn.ajaxForm = function(options) {
		return this.each(function() {
			var opts = $.extend({}, options, $(this).data('ajaxForm'));
			return new AjaxForm(this, opts).init();
		});
	}

})(jQuery || Zepto);