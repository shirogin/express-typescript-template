import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

import { APP_TOKEN_NAME } from "&server/env";
import { googleOAuth2Service } from "@server/services";
import { setToken } from "@server/utils/cookies";
import { handleServiceResponse } from "@server/utils/httpHandlers";
import { ResponseStatus, ServiceResponse } from "@server/utils/serviceResponse";

import type { ERequest } from "!server/back/E_Express";
import type { UserHydratedDocument } from "!server/models/user";
import userModel from "#server/user";
export const getUserApps = async (
	req: ERequest<UserDocumentI, any, ResponseI<Partial<UserAppsI<string>>>>,
	res: Response<ResponseI<Partial<UserAppsI<string>>>>,
) => {
	const user = req.records!.user as UserHydratedDocument;
	const apps: Partial<UserAppsI<string>> = (Object.entries(user.apps) as [UserAppsEnum, AppDetailsI][]).reduce(
		(acc, [key, value]) => {
			if (value) {
				acc[key] = value.username || value.id;
			}
			return acc;
		},
		{} as Partial<UserAppsI<string>>,
	);

	handleServiceResponse(
		new ServiceResponse<Partial<UserAppsI<string>>>(
			ResponseStatus.Success,
			"User apps have been retrieved",
			apps,
			StatusCodes.OK,
		),
		res,
	);
};
export const googleAuthorizationUrl = (
	req: ERequest<null, any, ResponseI<string>, object, GoogleAuthorizationUrlRequestI>,
	res: Response<ResponseI<string>>,
) => {
	handleServiceResponse(
		new ServiceResponse<string>(
			ResponseStatus.Success,
			"Google authorization url has been generated",
			googleOAuth2Service.authorizationUrl,
			StatusCodes.OK,
		),
		res,
	);
};
export const googleLinkUrl = (
	req: ERequest<null, any, ResponseI<string>, object, GoogleAuthorizationUrlRequestI>,
	res: Response<ResponseI<string>>,
) => {
	handleServiceResponse(
		new ServiceResponse<string>(
			ResponseStatus.Success,
			"Google authorization url has been generated",
			googleOAuth2Service.linkingUrl,
			StatusCodes.OK,
		),
		res,
	);
};
export const loginWithGoogle = async (
	req: ERequest<null, any, ResponseI<UserAuthI>, GoogleLogOnI>,
	res: Response<ResponseI<UserAuthI>>,
) => {
	const { code } = req.body;
	try {
		const googleRegistration = await googleOAuth2Service.logOn(code);
		const user = await userModel.loginGoogleUser(googleRegistration.id);
		const token = await user.generateAuthToken();
		setToken(APP_TOKEN_NAME, token, res, true);

		handleServiceResponse(
			new ServiceResponse<UserAuthI>(
				ResponseStatus.Success,
				"You have been logged in with Google",
				{
					user: user.toOptimizedObject(),
					new: false,
				},
				StatusCodes.OK,
			),
			res,
		);
	} catch (e) {
		handleServiceResponse(
			new ServiceResponse<ErrorResponseI>(
				ResponseStatus.Failed,
				"Failed to log in with Google",
				{ message: (e as Error).message, error: e as Error },
				StatusCodes.BAD_REQUEST,
			),
			res,
		);
	}
};
export const linkToGoogle = async (
	req: ERequest<UserDocumentI, any, ResponseI<UserAuthI>, GoogleLogOnI>,
	res: Response<ResponseI<UserAuthI>>,
) => {
	const user = req.records!.user as UserHydratedDocument;
	const { code } = req.body;
	try {
		const googleRegistration = await googleOAuth2Service.link(code);
		user.apps.google = googleRegistration;

		await user.save();

		handleServiceResponse(
			new ServiceResponse<UserAuthI>(
				ResponseStatus.Success,
				"You have been logged in with Google",
				{
					user: user.toOptimizedObject(),
					new: false,
				},
				StatusCodes.OK,
			),
			res,
		);
	} catch (e) {
		handleServiceResponse(
			new ServiceResponse<ErrorResponseI>(
				ResponseStatus.Failed,
				"Failed to log in with Google",
				{ message: (e as Error).message, error: e as Error },
				StatusCodes.BAD_REQUEST,
			),
			res,
		);
	}
};
export const unlinkGoogle = async (
	req: ERequest<UserDocumentI, any, ResponseI<UserAuthI>>,
	res: Response<ResponseI<UserAuthI>>,
) => {
	const user = req.records!.user as UserHydratedDocument;
	try {
		user.apps.google = undefined;
		await user.save();

		handleServiceResponse(
			new ServiceResponse<UserAuthI>(
				ResponseStatus.Success,
				"Google has been unlinked",
				{
					user: user.toOptimizedObject(),
					new: false,
				},
				StatusCodes.OK,
			),
			res,
		);
	} catch (e) {
		handleServiceResponse(
			new ServiceResponse<ErrorResponseI>(
				ResponseStatus.Failed,
				"Failed to unlink Google",
				{ message: (e as Error).message, error: e as Error },
				StatusCodes.BAD_REQUEST,
			),
			res,
		);
	}
};
