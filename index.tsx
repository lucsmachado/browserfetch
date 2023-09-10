import { Elysia } from 'elysia';
import { html } from '@elysiajs/html';
import * as elements from 'typed-html';

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
	.use(html())
	.get("/", ({ html, request }) => {
		const userAgentClientHint = request.headers.get("sec-ch-ua");
		const userAgentHeader = request.headers.get("user-agent");

		let browser: WebBrowser = {
			name: 'Unknown',
		};
		if (userAgentClientHint) {
			const data = parseUserAgentClientHint(userAgentClientHint);
			const KNOWN_BROWSERS = [
				'Google Chrome',
				'Microsoft Edge',
				'Opera',
				'Brave',
				'Chromium',
			];
			for (const option of KNOWN_BROWSERS) {
				const brand = data.brands.find((b) => b.name === option);
				if (brand) {
					browser = {
						name: brand.name,
						version: brand.version,
					}
					break;
				} else {
					browser = {
						name: 'Unknown',
					}
				}
			}
		} else if (userAgentHeader) {
			const data = parseUserAgentHeader(userAgentHeader);
			browser = {
				name: data.products[2].name,
				version: data.products[2].version,
			}
		} else {
			browser = {
				name: 'Unknown'
			}
		}
		const logo = browser.name === 'firefox' ? logos.firefox : logos.chrome;

		return html(
			<BaseHtml>
				<BrowserInfo browser={browser} logo={logo} />
			</BaseHtml>
		);
	})
	.listen(3000);

console.log(`Listening on http://${app.server?.hostname}:${app.server?.port}...`);

const BaseHtml = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html lang="en-US">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>browserfetch </title>
	</head>
	<body>
		<h1>browserfetch</h1>
		${children}
	</body>
</html>
`;

type WebBrowser = {
	name: string;
	version?: string;
}

type Props = {
	browser: WebBrowser;
	logo: string;
}

function BrowserInfo({ browser, logo }: Props) {
	return (
		<div>
			<pre>{logo}</pre>
			<p>{browser.name} {browser.version}</p>
		</div>
	);
}

const logos = {
	firefox: `                               .:                 
                             :::::.               
                           .::::::::              
                          :::::::::::.            
        ::               .:::::::::::::.          
      =*+=    :-.        ::::::::::::::::         
    -###*+ .+#*+.       :---::::::::::::::. :.    
   *%%###*+*****:  :-=+*****++=-:::::::::::: ::   
  *%%%%%###***+++=**************+=-:::::::::::::  
 +%%%%%%%####***+++++*********+===+=::::::::::::: 
.%%%%%%#**++++++**+++++++*******+-:--------::::::.
+%%%%%%*+++====---------+*********=:::-=------::::
#%%%%%%%%#**+=====+++++************----======-::::
%%%%%%%%%%%%*=+*###***************#+---=++++-::---
#%%%%%%%%%%%#+###########********##+====#**=---==-
+%%%%%%%%%%%%*#%%###########***####++***%#===-=++-
.%%%%%%%%%%%%%##%%%%####################*+++==***.
 =%%%%%%%%%%%%%%##%%%%%%%%######%%%%%%#*****+###= 
  *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####%%%*  
   *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*   
    =%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=    
     .*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#.     
       :*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*:       
         .=#%%%%%%%%%%%%%%%%%%%%%%%%%%#=.         
            .-+#%%%%%%%%%%%%%%%%%%#*-.            
`,
	chrome: `                .-=+*##%%%%%#*+=-.                
            :=*%%%%%%%%%%%%%%%%%%%%*=:            
         :+%%%%%%%%%%%%%%%%%%%%%%%%%%%%+.         
       -#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#:       
     :#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#:     
    =%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=    
   -+#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*   
  -===*%%%%%%%%%%%%*=:.     ..:----------------:  
 :=====*%%%%%%%%%=  ..::::::..  .:::::::::::::::: 
 =======+%%%%%%+  :------------:  .:::::::::::::: 
:========+%%%%+ .================  :::::::::::::::
==========+#%%  +++++++++++++++++=  ::::::::::::::
===========+## .******************  ::::::::::::::
=============* .******************  ::::::::::::::
-=============: -###############*: .:::::::::::::.
.==============: :*############*. .:::::::::::::: 
 -==============-. :+*######*=: .:::::::::::::::. 
  =================:.  ....  .-+-:::::::::::::::  
   =======================+***+-:::::::::::::::   
    -====================+***+-:::::::::::::::    
     .===================+**=:::::::::::::::.     
       :================+**=::::::::::::::.       
         .-=============+*-:::::::::::::          
            .-=========++-::::::::::.             
                .:--====-::::::..                 
`
}
