const fs = require("fs");

module.exports = {
  error: function(msg) {
    console.error("Error: " + msg);
  },
  createArray: function() {
    return ([]);
  },
  readFile: function(path) {
    return (fs.readFileSync(__dirname + "/" + path, "utf-8"));
  }
};