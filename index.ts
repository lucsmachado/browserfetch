type Client = {
	name: string;
	version: string;
}

const userAgents = new Array<string>();

const clients = new Map<string, number>();

const server = Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === '/') {
			const headers = req.headers.toJSON();
			const reqUserAgent = headers["user-agent"];
			userAgents.push(reqUserAgent);

			clients.set(reqUserAgent, (clients.get(reqUserAgent) || 0) + 1);

			const regex = /^(\w+)\/([\d.]+)/;
			const match = reqUserAgent.match(regex);

			if (match) {
				const client: Client = {
					name: match[1],
					version: match[2],
				}
				return new Response(JSON.stringify(client), {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
			return new Response(JSON.stringify({ userAgent: reqUserAgent }), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
		if (url.pathname === '/count') {
			const headers = req.headers.toJSON();
			const reqUserAgent = headers["user-agent"];
			userAgents.push(reqUserAgent);

			clients.set(reqUserAgent, (clients.get(reqUserAgent) || 0) + 1);
			const reqCount = clients.get(reqUserAgent);
			const res = {
				requests: reqCount,
			};
			return new Response(JSON.stringify(res), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
		return new Response("Not found", {
			status: 404,
		});
	},
});

console.log(`Listening on http://localhost:${server.port} ...`);
