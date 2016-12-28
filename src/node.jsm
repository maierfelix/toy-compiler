class Node {
  kind: NN_UNKNOWN;
  children: [];
  constructor(kind) {
    this.kind = kind;
  }
};

let node = new Node(NN_FUNCTION);