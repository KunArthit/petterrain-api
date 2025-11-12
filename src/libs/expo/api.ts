export async function sendNotification(
	tokens: string[],
	// biome-ignore lint/suspicious/noExplicitAny: ignore any type
	payload: Record<string, any>
	// biome-ignore lint/suspicious/noExplicitAny: ignore any type
): Promise<any> {
	console.log("sendNotification");

	const message = {
		to: tokens,
		sound: "default",
		...payload
	};

	try {
		const response = await fetch("https://exp.host/--/api/v2/push/send", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(message)
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`HTTP error: ${text}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Error sending notification:", error);
		throw new Error("Failed to send notification");
	}
}
