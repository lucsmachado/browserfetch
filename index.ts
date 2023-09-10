type ProductIdentifier = {
	name: string;
	version?: string;
	comments: string[];
}

type UserAgentData = {
	products: ProductIdentifier[];
}

function parseUserAgent(userAgentString: string): UserAgentData {
	const data: UserAgentData = {
		products: [],
	};

	const regex = /([^/;]+)(?:\/([\w.]+))?(?:\s*\(([^)]+)\))?/g;

	let match;
	while ((match = regex.exec(userAgentString)) !== null) {
		const name = match[1].trim();
		const version = match[2] ? match[2].trim() : undefined;
		const comment = match[3] ? match[3].trim() : undefined;

		if (data.products.length === 0 || version) {
			const newProduct: ProductIdentifier = {
				name,
				version,
				comments: comment ? [comment] : [],
			};

			data.products.push(newProduct);
		} else {
			const lastProduct = data.products.at(-1);
			if (lastProduct && comment) {
				lastProduct.comments.push(comment);
			}
		}
	}

	return data;
}

const server = Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === '/') {
			const userAgentString = req.headers.get("User-Agent");

			if (userAgentString) {
				const data = parseUserAgent(userAgentString);
				return new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			} else {
				return new Response(undefined, {
					status: 400,
				});
			}
		}
		return new Response(undefined, {
			status: 404,
		});
	},
});

console.log(`Listening on http://localhost:${server.port} ...`);
