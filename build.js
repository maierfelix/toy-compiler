const fs = require("fs");
const vm = require('vm');

let stub_path = "./bin/stub.js";
let stub = require(stub_path);

let input = fs.readFileSync("./src/index.jsm", "utf-8");

console.log("Recompiling..");

let result = null;

try {
  let out = stub.compile(input);
  vm.runInNewContext(out.output, { module:{exports:{}},require:require});
  if (out.errors.length) {
    out.errors.map((msg) => {
      console.error(msg);
    });
    return void 0;
  }
  result = out.output;
} catch (e) {
  throw new Error(e);
  return void 0;
}

fs.writeFileSync(stub_path, result, "utf-8");
console.log("Successfully recompiled into " + stub_path);