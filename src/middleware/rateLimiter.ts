import { Request } from 'express';
import { rateLimit } from 'express-rate-limit';

import { cLogger } from '$server/console';

import { APP_COMMON_RATE_LIMIT_MAX_REQUESTS, APP_COMMON_RATE_LIMIT_WINDOW_MS } from '@server/config/env';
import { handleServiceResponse } from '@server/utils/httpHandlers';
import { ResponseStatus, ServiceResponse } from '@server/utils/serviceResponse';

const rateLimiter = rateLimit({
	legacyHeaders: true,
	limit: APP_COMMON_RATE_LIMIT_MAX_REQUESTS,
	message: 'Too many requests, please try again later.',
	standardHeaders: true,
	windowMs: APP_COMMON_RATE_LIMIT_WINDOW_MS,
	keyGenerator,
	handler: (_req, res) => {
		handleServiceResponse(
			new ServiceResponse(ResponseStatus.Failed, 'Too many requests, please try again later.', null, 429),
			res
		);
	},
});

function keyGenerator(request: Request): string {
	if (!request.ip) {
		cLogger.error('Warning: request.ip is missing!');
		return request.socket.remoteAddress as string;
	}

	return request.ip.replace(/:\d+[^:]*$server/, '');
}

export default rateLimiter;