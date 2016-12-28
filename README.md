This is a tiny compiler, which is able to compile itself.

 * bin/stub contains the latest generated version (and compiles src/index)
 * src/index contains the compiler, written in minimal "javascript" to be flexible enough for later feature and syntax changes

Bootstrapping:
````c
edit "src/index"
run "node build"
have fun with "bin/stub"
````

Todo:
 - Sandbox types
 - Type system
 - Precedence based expression parsing
 - More compiling targets e.g. java, python, c#
