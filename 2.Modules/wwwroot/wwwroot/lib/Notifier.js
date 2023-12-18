var NotifierjsConfig = {
	defaultTimeOut: 3000,
	position: ['bottom', 'right'],
	notificationStyles: {
		'padding': '12px 18px',
		'margin': '0 0 6px 0',
		'background-color': '#000',
		'opacity': 0.8,
		'-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=80)',
		'filter': 'alpha(opacity = 80)',
		'color': '#fff',
		'border-radius': '3px',
		'box-shadow': '#999 0 0 12px',
		'max-width': '800px',
		'min-width': '240px'
	},
	notificationStylesHover: {
		'opacity': 1,
		'-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)',
		'filter': 'alpha(opacity = 100)',
		'box-shadow': '#000 0 0 12px'
	},
	container: $('<div></div>')
};

$(document).ready(function () {
	NotifierjsConfig.container.css('position', 'fixed');
	NotifierjsConfig.container.css('z-index', 9999);
	NotifierjsConfig.container.css(NotifierjsConfig.position[0], '12px');
	NotifierjsConfig.container.css(NotifierjsConfig.position[1], '12px');
	$('body').append(NotifierjsConfig.container);
});

function escapeHtml(string) {
	return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
}

function getNotificationElement() {
	var notificationElement = $('<div></div>');
	notificationElement.css(NotifierjsConfig.notificationStyles);
	notificationElement.hover(function () {
		$(this).css(NotifierjsConfig.notificationStylesHover);
	}, function () {
		$(this).css(NotifierjsConfig.notificationStyles);
	});
	return notificationElement;
}

var Notifier = {};

Notifier.notify = function (message, title, iconUrl, timeOut) {
	var notificationElement = getNotificationElement();

	if (iconUrl) {
		var iconElement = $('<img/>');
		iconElement.attr('src', iconUrl);
		iconElement.css('width', '36px');
		iconElement.css('height', '36px');
		iconElement.css('display', 'inline-block');
		iconElement.css('vertical-align', 'middle');
		notificationElement.append(iconElement);
	}

	var textElement = $('<div/>');
	textElement.css('display', 'inline-block');
	textElement.css('vertical-align', 'middle');
	textElement.css('padding', '0 12px');

	if (title) {
		var titleElement = $('<div/>');
		titleElement.append(escapeHtml(title));
		titleElement.css('font-weight', 'bold');
		titleElement.css('margin-bottom', '2px');
		textElement.append(titleElement);
	}

	if (message) {
		var messageElement = $('<div/>');
		messageElement.append(escapeHtml(message));
		textElement.append(messageElement);
	}

	if (!timeOut) {
		timeOut = NotifierjsConfig.defaultTimeOut;
	}
	notificationElement.delay(timeOut).fadeOut(300, function () { $(this).remove(); });
	notificationElement.bind('click', function () {
		notificationElement.remove();
	});

	notificationElement.append(textElement);
	NotifierjsConfig.container.prepend(notificationElement);
};

Notifier.info = function (message, title) {
	Notifier.notify(message, title, '/img/icon/ico_notification_information.png');
};
Notifier.warning = function (message, title) {
	Notifier.notify(message, title, '/img/icon/ico_notification_warning.png');
};
Notifier.error = function (message, title) {
	Notifier.notify(message, title, '/img/icon/ico_notification_error.png');
};
Notifier.question = function (message, title) {
	Notifier.notify(message, title, '/img/icon/ico_notification_question.png');
};