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
The below snippets use the version I have hosted on my own storage solution. Feel free to link to the GitHub version instead.

### Web
```html
<script src="https://zfilestore.blob.core.windows.net/public/z.js"></script>
<script>
z.pkg.require('z.js', '1.0.0')
  .then(async z => {
    const test = await z.pkg.require('test', '1.0.0')
    test.hello()
  })
</script>
```

## z.pkg
z.pkg is the package manager backing Z.JS. it consists of the following:

- upload - a function to upload a single JavaScript file with a name and version.
- require - a function to download a JavaScript file by name and version, execute it in an async function, and return the result.
- execute - a function to execute a local script with Z.JS loaded in the global context.

