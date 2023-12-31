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
	.get("/", ({ html, request, set }) => {
		set.headers = {
			'accept-ch': 'width,sec-ch-ua-arch,sec-ch-prefers-color-scheme',
		};
		const userAgentClientHint = request.headers.get("sec-ch-ua");
		const userAgentHeader = request.headers.get("user-agent");

		const osClientHint = request.headers.get("sec-ch-ua-platform");
		const archClientHint = request.headers.get("sec-ch-ua-arch");
		const colorSchemeClientHint = request.headers.get("sec-ch-prefers-color-scheme");

		let name;
		let version;
		let os = osClientHint ? osClientHint.replace(/^"(.*)"$/, '$1') : undefined;
		let colorScheme = colorSchemeClientHint ?? undefined;

		if (userAgentClientHint) {
			const data = parseUserAgentClientHint(userAgentClientHint);
			const mainBrowserBrand = data.brands.find((brand) => /(chrome)|(edge)|(opera)|(brave)|(firefox)/i.test(brand.name));
			if (mainBrowserBrand) {
				name = mainBrowserBrand.name;
				version = mainBrowserBrand.version;
			} else {
				const chromium = data.brands.find((brand) => /(chromium)/i.test(brand.name));
				if (chromium) {
					name = chromium.name;
					version = chromium.version;
				}
			}
		} else if (userAgentHeader) {
			const data = parseUserAgentHeader(userAgentHeader);
			name = data.products[2].name;
			version = data.products[2].version;
		}

		return html(
			<BaseHtml>
				<Page colorScheme={colorScheme}>
					<BrowserInfo
						name={name}
						version={version}
						os={os}
					/>
				</Page>
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
		<script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css">
	</head>
	${children}
</html>
`;

type PageProps = {
	children?: elements.Children;
	colorScheme?: string;
}

function Page({ children, colorScheme }: PageProps) {
	if (colorScheme === 'dark') {
		return (
			<body class="bg-slate-900 text-slate-200">
				<Header />
				{children}
			</body>
		)
	} else {
		return (
			<body class="bg-slate-50 text-slate-900">
				<Header />
				{children}
			</body>
		)
	}
}

function Header() {
	return (
		<header class="px-8 py-4">
			<h1 class="text-4xl">browserfetch</h1>
		</header>
	);
}

type Browser = {
	name: string;
	displayName: string;
	logo: string;
}

type Props = {
	name?: string;
	version?: string;
	os?: string;
}

function BrowserInfo({
	name,
	version,
	os,
}: Props) {
	const browser = browsers.find((browser) => new RegExp(browser.name, "i").test(name || ''));

	if (!browser) {
		return (
			<p>Unknown browser</p>
		);
	}

	return (
		<main class="p-8 grid place-items-center">
			<div class="flex gap-8">
				<pre>{browser.logo}</pre>
				<ul>
					<li>
						<span class="text-red-400">Browser:</span>
						<span>{browser.displayName} {version}</span>
					</li>
					{os && (
						<li>
							<span class="text-red-400">OS:</span>
							<span>{os}</span>
						</li>
					)}
				</ul>
			</div>
		</main>
	);

}

const browsers: Browser[] = [{
	name: 'firefox',
	displayName: 'Mozilla Firefox',
	logo: `                               .:                 
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
},
{
	name: 'chrome',
	displayName: 'Google Chrome',
	logo: `                .-=+*##%%%%%#*+=-.                
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
},
{
	name: 'chromium',
	displayName: 'Chromium',
	logo: `                .-=+*##%%%%%#*+=-.                
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
},
{
	name: 'brave',
	displayName: 'Brave',
	logo: `              .+##################+.              
             =*#####################=             
      .... :*#########################-..::.      
   .=*******############################%%%%%+:   
 .=*********+**######*+=--=+*########*%%%%%%%%%*. 
:**********:    ..:.          .:..    :#%%%%%%%%%:
 =*******=                              =%%%%%%%+ 
 -******.   .:::::.           .:---::.   .#%%%%%= 
.*****=      :-=+****+:    :*#%%%#+=:      +%%%%%:
+****+            .-*#.    .%#=:            *%%%%*
-*****:             =+      **             :#%%%%-
 ******+:          -*-      -%=          :*%%%%%# 
 :*******+.       =**        %%+       :*%%%%%%%- 
  +********+.     =**-:...::=%#+     .+%%%%%%%%#  
  :**********.      :=*#####+:      .%%%%%%%%%%-  
   +********+          :**:          *%%%%%%%%*   
   :********:          :##-          :%%%%%%%%:   
    +*******+        -*#####=.       *%%%%%%%*    
    .*********-..:=+**=-::-+#%#+-..-#%%%%%%%%:    
     =************=:         .-+#%%%%%%%%%%%+     
     .***********-              =%%%%%%%%%%%.     
      =************+:        :+%%%%%%%%%%%%+      
       +**************=.  .=#%%%%%%%%%%%%%#       
        =************###++##%%%%%%%%%%%%%*        
         .=**********#######%%%%%%%%%%#+:         
            :=*******#######%%%%%%%%+-            
               :+****#######%%%%%*-               
                  :+*#######%%*-                  
                     :+####*-                     
`,
},
{
	name: 'edge',
	displayName: 'Microsoft Edge',
	logo: `                 ...:::::::::::...                
             .:::::::::::::::::-----:.            
          .::::::::::::::::::::::-------:.        
        :::::::::::::::::::::::::::-------:.      
      ::::::::::::::::::::::::::::::--------:.    
    .:::::::::::::::::::::::::::::::::------::.   
   .:::--===++++=++===--:::::::::::::-----::::::  
  ::-==++=================-::::::---------::::::: 
 .-=++======================-::-------------:::::.
 -++============------:...::==-------------------:
:+==================.        .--------------------
=================+*            ------------------:
================**=            :-----------------.
-==============***+            -----------------. 
:=============*****:          -----------------   
 ============+*****+:        .---==========-:.    
 :===========********-          ..:::::::.        
  -==========+********+-                          
   -=========+***********=-.                .:    
    :=========***************+=-::....::-=+**=    
     .-========****************************+.     
       .-=======+************************+:       
         .-======+*********************=.         
            .:-====++**************+-:            
                ..:--==++++++==-:.                
`,
},
{
	name: 'opera',
	displayName: 'Opera',
	logo: `                .:-=++******++=-:.                
            :-+**************#####*+-:            
         .=************##%%%%%%%%%%%%%#+:         
       :+************+=-:::-=*%%%%%%%%%%%#-       
     :+***********-.           -*##########*:     
    =***********=                :*##########=    
   +***********:                   =##########+   
  +***********.                     =**********+  
 =***********:                       +**********= 
.***********+                        .***********.
=***********:                         +++++++++++-
+***********.                         -++++++++++=
************                          :+++++++++++
+***********.                         -===========
=***********:                         -==========:
.***********+                        .===========.
 =***********:                       -----------: 
  +***********.                     :-----------  
   +##########*:                   :----------:   
    =###########=                .-----------:    
     :*###########-            .:-----------.     
       -*###########+-......::------------.       
         :+############*+=-----------==-.         
            :=*%%%%%%%%%%%%##*****#*=:            
                :-=+*##%%%%##*+=-:                
`,
}];
