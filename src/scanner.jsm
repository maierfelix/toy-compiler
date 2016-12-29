class Scanner {
  ii: 0;
  line: 0;
  column: 0;
  next() {
    this.ii++;
    this.column++;
  }
  isBlank(cc) {
    return (
      cc == 9 ||
      cc == 11 ||
      cc == 12 ||
      cc == 32 ||
      cc == 160
    );
  }
  isQuote(cc) {
    return (
      cc == 39 ||
      cc == 34
    );
  }
  isAlpha(cc) {
    return (
      cc >= 65 && cc <= 90 ||
      cc >= 97 && cc <= 122 ||
      cc == 95 || cc == 35
    );
  }
  isNumber(cc) {
    return (
      cc >= 48 && cc <= 57
    );
  }
  scan(str) {

    this.ii = -1;
    this.line = 1;
    this.column = 0;

    let tokens = [];
    let length = str.length;

    while (true) {
      this.next();
      let ch = str.charAt(this.ii);
      let cc = str.charCodeAt(this.ii);
      // blank
      if (this.isBlank(cc)) {
        continue;
      }
      if (cc == 10) {
        this.line++;
        this.column = 0;
        continue;
      }
      // alpha
      if (this.isAlpha(cc)) {
        let start = this.ii;
        while (true) {
          if (!this.isAlpha(cc)) {
            this.ii--;
            this.column--;
            break;
          }
          this.next();
          cc = str.charCodeAt(this.ii);
        };
        let content = str.slice(start, this.ii+1);
        processToken(tokens, content, this.line, this.column);
        continue;
      }
      // number
      if (this.isNumber(cc) || cc == 45 && this.isNumber(str.charCodeAt(this.ii+1))) {
        let start = this.ii;
        while (true) {
          if (!this.isNumber(cc) && cc != 45) {
            this.ii--;
            this.column--;
            break;
          }
          this.next();
          cc = str.charCodeAt(this.ii);
        };
        let content = str.slice(start, this.ii+1);
        let token = createToken(TT_NUMBER, content, this.line, this.column);
        tokens.push(token);
        continue;
      }
      // string
      if (this.isQuote(cc)) {
        let start = this.ii;
        let begin = cc;
        while (true) {
          this.next();
          cc = str.charCodeAt(this.ii);
          // break on next matching quote
          if (this.isQuote(cc) && cc == begin) {
            break;
          }
        };
        let content = str.slice(start+1, this.ii);
        let token = createToken(TT_STRING, content, this.line, this.column);
        token.isChar = content[0] == "'";
        tokens.push(token);
        continue;
      }
      if (ch == "/") {
        // single line
        if (str.charAt(this.ii + 1) == "/") {
          while (true) {
            if (cc == 10) {
              this.column = 0;
              this.line++;
              break;
            }
            this.next();
            cc = str.charCodeAt(this.ii);
          };
        }
        // multi line
        else if (str.charAt(this.ii + 1) == "*") {
          while (true) {
            // handle line breaks, but dont break on them
            if (cc == 10) {
              this.column = 0;
              this.line++;
            }
            // comment end
            else if (cc == 42) {
              if (str.charCodeAt(this.ii + 1) == 47) break;
            }
            this.next();
            cc = str.charCodeAt(this.ii);
          };
        }
        continue;
      }
      if (
        ch == "(" ||
        ch == ")" ||
        ch == "[" ||
        ch == "]" ||
        ch == "{" ||
        ch == "}" ||
        ch == "." ||
        ch == ":" ||
        ch == "," ||
        ch == ";" ||
        ch == "*" ||
        ch == "/"
      ) {
        let content = str.slice(this.ii, this.ii+1);
        processToken(tokens, content, this.line, this.column);
        continue;
      }
      if (
        ch == "+" ||
        ch == "-" ||
        ch == "!" ||
        ch == "=" ||
        ch == "|" ||
        ch == "&" ||
        ch == ">" ||
        ch == "<"
      ) {
        let second = str.slice(this.ii+1, this.ii+2);
        // + # ++
        if (ch == "+") {
          if (ch + second == "++") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // - # --
        else if (ch == "-") {
          if (ch + second == "--") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // ! # !=
        else if (ch == "!") {
          if (ch + second == "!=") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // = # ==
        else if (ch == "=") {
          if (ch + second == "==") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // | # ||
        else if (ch == "|") {
          if (ch + second == "||") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // | # ||
        else if (ch == "|") {
          if (ch + second == "||") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // & # &&
        else if (ch == "&") {
          if (ch + second == "&&") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // > # >=
        else if (ch == ">") {
          if (ch + second == ">=") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        // < # <=
        else if (ch == "<") {
          if (ch + second == "<=") {
            this.next();
            processToken(tokens, ch + second, this.line, this.column);
          } else {
            processToken(tokens, ch, this.line, this.column);
          }
        }
        continue;
      }

      if (this.ii >= length) {
        break;
      }

    };
    return (tokens);
  }

};