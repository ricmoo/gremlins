
export default {
  input: "./lib.esm/index.js",
  output: {
    file: "./dist/gremlins.js",
    format: "esm",
    sourcemap: true
  },
  treeshake: true,
  plugins: [
  /*
   nodeResolve({
    exportConditions: [ "default", "module", "import" ],
    mainFields: [ "browser", "module", "main" ],
    modulesOnly: true,
    preferBuiltins: false
  })
  */
  ],
}
