import { Elysia } from 'elysia';

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

const app = new Elysia()
	.get("/", ({ request, set }) => {
		const userAgentClientHint = request.headers.get("Sec-CH-UA");
		const userAgentHeader = request.headers.get("User-Agent");

		if (userAgentClientHint) {
			const data = parseUserAgentClientHint(userAgentClientHint);
			return data;
		} else if (userAgentHeader) {
			const data = parseUserAgentHeader(userAgentHeader);
			return data;
		} else {
			set.status = 400;
			return {
				error: 'Unidentified Client',
				message: 'Please provide an User-Agent or Sec-CH-UA header'
			}
		}
	})
	.listen(3000);

console.log(`Listening on http://${app.server?.hostname}:${app.server?.port}...`);
