let errors = [];
let __imports = {
  error: function(msg) {
    console.error("Error: " + msg);
    errors.push(msg);
  },
  readFile: function(path) {
    return (require("fs").readFileSync("src/" + path, "utf-8"));
  },
  getPlatformName: function() {
    return (require("os").platform());
  }
};

#include "scope.jsm"
#include "token.jsm"
#include "node.jsm"
#include "scanner.jsm"
#include "parser.jsm"
#include "generator.jsm"
#include "inference.jsm"

export function compile(str) {
  let base = '(function() { "use strict"; \n';
  let scanner = new Scanner();
  let tokens = scanner.scan(str);
  let parser = new Parser();
  let ast = parser.parse(tokens);
  let generator = new Generator();
  let code = generator.generate(ast);
  code = base + code + "\n})();";
  return ({
    output: code,
    errors: errors
  });
};