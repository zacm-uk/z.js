# Z.JS
A new, simple JavaScript ecosystem.

## What is it?
This is a simple project with the goal of hosting and using pure JavaScript libraries without tools such as npm.

## The goal
the goal is to provide the following:

- a simple package manager for pure JavaScript libraries and scripts.
- a toolset to upload existing projects.
- a repl interface to use Z.JS.
- snippets to allow using Z.JS in node and web projects without the need for an external package manager.
- an easy way to setup a private package server.
- code validation before running or uploading, for example to ensure compatibility with the runtime environment.
- code transpilation (including typescript) either before uploading or before running to ensure compatibility with the runtime environment.

## Why?
There aren't many package management options of JavaScript. And the ones there are can be over the top for a simple project.
For example if you're writing a small script and you need to format a date, You have to create a package.json, install a dependency such as moment, then if you want to have a single file you have to install and configure a tool to bundle your code.

Z.JS will not be suitable for every project, or even most. Especially if you require dependencies with native code. However it will hopefully be perfect for simple projects, or even use on the web to manage a site's dependencies.

## Usage
### Loading (platform agnostic/async)
The following code can be used in either Node.JS or a web browser to load the same version of z.js:

Note: This code is minified to reduce the impact on you code.

This code does the following:

- Detects if the code is running in Node.JS or a browser
- Uses either ```fetch``` or Node.JS ```https``` module to download loader.js from github
- Executes loader.js using eval, loader.js creates a promise that can be accessed using ```global.zLoaded``` or ```window.zLoaded```
- When this promise resolves, ```z``` will be available in the global context (window or global)

```javascript
(async()=>{const isNode=(()=>{try{const isNode=eval('(process.release.name === "node") && (Object.prototype.toString.call(process) === "[object process]")')
if(isNode){return!0}}catch{}
return!1})()
const get=url=>{if(isNode){const fn=require(url.startsWith('https')?'https':'http').get
return new Promise((resolve,reject)=>{fn(url,response=>{let data=''
response.on('data',chunk=>data+=chunk)
response.on('end',()=>resolve(data))}).on('error',reject)})}
return fetch(url).then(res=>res.text())}
await get('https://raw.githubusercontent.com/zacm-uk/z.js/master/js/loader.js').then(script=>eval(`(async () => {
    ${ script }
  })()`))})()
```

### Web (synchronous)
Z.js can also be loaded in a script tag:

```html
<script src="https://raw.githubusercontent.com/zacm-uk/z.js/master/js/z.js"></script>
<script>
(async () => {
  const { hello } = await z.pkg.require('test', '1.0.0')
  hello()
})()
</script>
```

### NodeJS (synchronous)
Z.js can also be loaded using require by first downloading ```js/z.js``` from this repository.

It can then be used as below:

```javascript
require('./js/z')
;(async () => {
  const { hello } = await z.pkg.require('test', '1.0.0')
  hello()
})()
```

## z.pkg
z.pkg is the package manager backing Z.JS. it consists of the following:

- require - a function to download a JavaScript file by name and version, execute it in an async function, and return the result.
- execute - a function to execute a local script with Z.JS loaded in the global context.

