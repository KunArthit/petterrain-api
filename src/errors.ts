import { InvertedStatusMap } from "elysia";

type Status = keyof InvertedStatusMap;
type Headers = Record<string, string> | undefined | null;
type ErrorDetail = string | Record<string, unknown>;

export class HTTPError extends Error {
	public readonly status: Status;
	public readonly detail: ErrorDetail;
	public readonly headers?: Headers;

	// TODO: named constructor
	constructor(status: Status, detail?: ErrorDetail, headers?: Headers) {
		super();
		if (!detail) {
			const pharse = InvertedStatusMap[status];
			if (!pharse) {
				throw new Error("Invalid status code");
			}
			this.detail = pharse;
		} else {
			this.detail = detail;
		}
		this.status = status;
		this.headers = headers;
		this.message = `${status}: ${this.detail}`;
	}
}
