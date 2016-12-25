function scan(str) {

  let ii = -1;
  let line = 1;
  let column = 0;
  let length = str.length;

  let tokens = __imports.createArray();

  function next() {
    ii++;
    column++;
  };

  while (true) {
    next();
    let ch = str.charAt(ii);
    let cc = str.charCodeAt(ii);
    // blank
    if (isBlank(cc)) {
      continue;
    }
    if (cc == 10) {
      line++;
      column = 0;
      continue;
    }
    // alpha
    if (isAlpha(cc)) {
      let start = ii;
      while (true) {
        if (!isAlpha(cc)) {
          ii--;
          column--;
          break;
        }
        next();
        cc = str.charCodeAt(ii);
      };
      let content = str.slice(start, ii+1);
      processToken(tokens, content, line, column);
      continue;
    }
    // number
    if (isNumber(cc) || cc == 45 && isNumber(str.charCodeAt(ii+1))) {
      let start = ii;
      while (true) {
        if (!isNumber(cc) && cc != 45) {
          ii--;
          column--;
          break;
        }
        next();
        cc = str.charCodeAt(ii);
      };
      let content = str.slice(start, ii+1);
      let token = createToken(TT_NUMBER, content, line, column);
      tokens.push(token);
      continue;
    }
    // string
    if (isQuote(cc)) {
      let start = ii;
      let begin = cc;
      while (true) {
        next();
        cc = str.charCodeAt(ii);
        // break on next matching quote
        if (isQuote(cc) && cc == begin) {
          break;
        }
      };
      let content = str.slice(start+1, ii);
      let token = createToken(TT_STRING, content, line, column);
      token.isChar = content[0] == "'";
      tokens.push(token);
      continue;
    }
    if (ch == "/") {
      if (str.charAt(ii + 1) == "/") {
        while (true) {
          if (cc == 10) {
            column = 0;
            line++;
            break;
          }
          next();
          cc = str.charCodeAt(ii);
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
      let content = str.slice(ii, ii+1);
      processToken(tokens, content, line, column);
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
      let second = str.slice(ii+1, ii+2);
      // + # ++
      if (ch == "+") {
        if (ch + second == "++") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // - # --
      else if (ch == "-") {
        if (ch + second == "--") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // ! # !=
      else if (ch == "!") {
        if (ch + second == "!=") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // = # ==
      else if (ch == "=") {
        if (ch + second == "==") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // | # ||
      else if (ch == "|") {
        if (ch + second == "||") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // | # ||
      else if (ch == "|") {
        if (ch + second == "||") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // & # &&
      else if (ch == "&") {
        if (ch + second == "&&") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // > # >=
      else if (ch == ">") {
        if (ch + second == ">=") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      // < # <=
      else if (ch == "<") {
        if (ch + second == "<=") {
          next();
          processToken(tokens, ch + second, line, column);
        } else {
          processToken(tokens, ch, line, column);
        }
      }
      continue;
    }

    if (ii >= length) {
      break;
    }

  };

  return (tokens);

};