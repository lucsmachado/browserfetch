type ProductIdentifier = {
	name: string;
	version?: string;
	comments: string[];
}

type UserAgentHeader = {
	products: ProductIdentifier[];
}

function parseUserAgentHeader(userAgentString: string): UserAgentHeader {
	const data: UserAgentHeader = {
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

type BrandIdentifier = {
	name: string;
	version: string;
}

type UserAgentClientHint = {
	brands: BrandIdentifier[];
}

function parseUserAgentClientHint(userAgentString: string): UserAgentClientHint {
	const data: UserAgentClientHint = {
		brands: [],
	};

	const regex = /"([^"]+)";v="([^"]+)"/g;

	let match;
	while ((match = regex.exec(userAgentString)) !== null) {
		const newBrand: BrandIdentifier = {
			name: match[1].trim(),
			version: match[2].trim(),
		};

		data.brands.push(newBrand);
	}

	return data;
}

const server = Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === '/') {
			const userAgentClientHint = req.headers.get("Sec-CH-UA");
			const userAgentHeader = req.headers.get("User-Agent");

			if (userAgentClientHint) {
				const data = parseUserAgentClientHint(userAgentClientHint);
				return new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			} else if (userAgentHeader) {
				const data = parseUserAgentHeader(userAgentHeader);
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
