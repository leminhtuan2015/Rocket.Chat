import moment from 'moment';

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.lendTokenpassToken = function(lending, cb) {
	const authApiToken = RocketChat.settings.get('Accounts_OAuth_Tokenpass_id');
	const authApiSecret = RocketChat.settings.get('Accounts_OAuth_Tokenpass_secret');
	const authApiNonce = moment().unix();

	const requestParams = {
		source: lending.address,
		destination: lending.username,
		asset: lending.token,
		quantity: lending.amount * 100000000,
		expiration: lending.days > 0 ? moment().add(lending.days, 'days').toDate() : null
	};

	const endPointUrl = `${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/provisional/tx`;
	const authApiMessage = `POST\n${ endPointUrl }\n${ JSON.stringify(requestParams) }\n${ authApiToken }\n${ authApiNonce }`;

	crypto = require('crypto');
	const hmac = crypto.createHmac('sha256', authApiSecret).update(authApiMessage).digest();
	const authApiSignature = hmac.toString('base64');
	console.log('authApiSignature', authApiSignature.length, authApiSignature);

	try {
		const result = HTTP.post(
			endPointUrl, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent,
					'X-Tokenly-Auth-Api-Token': authApiToken,
					'X-Tokenly-Auth-Nonce': authApiNonce,
					'x-Tokenly-Auth-Signature': authApiSignature
				},
				params: requestParams
			});

		return cb(null, result && result.data && result.data.result);
	} catch (exception) {
		console.log(exception);
		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown')
		);
	}
};
