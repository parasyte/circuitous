// This is a modern rewrite of `ngraph.graph`

/**
 * @template N
 * @template L
 */
export class Graph {
  /** @type {Map<String, Node<N, L>>} */
  #nodes;

  /** @type {Map<String, Link<L>>} */
  #links;

  constructor() {
    this.#nodes = new Map();
    this.#links = new Map();

    // TODO: event emitter
  }

  /**
   * @arg {String} id - Node identifier.
   * @return {Node<N, L> | undefined}
   */
  getNode(id) {
    return this.#nodes.get(id);
  }

  /**
   * @arg {String} id - Node identifier.
   * @arg {N} data - Data for the node.
   * @return {Node<N, L>}
   */
  addNode(id, data) {
    let node = this.getNode(id);
    if (node) {
      node.data = data;
    } else {
      node = new Node(id, data);
      this.#nodes.set(id, node);
    }

    return node;
  }

  /**
   * @arg {String} id - Node identifier.
   * @return {Node<N, L> | undefined}
   */
  removeNode(id) {
    let node = this.getNode(id);
    if (node) {
      this.#nodes.delete(id);

      // TODO: Break links.
    }

    return node;
  }

  /**
   * @arg {String} from - Node ID source.
   * @arg {String} to - Node ID destination.
   * @arg {L} data - Link data.
   * @return {Link<L>}
   */
  addLink(from, to, data) {
    const fromNode = this.getNode(from);
    if (!fromNode) {
      throw new Error('`from` is an invalid node ID');
    }

    const toNode = this.getNode(to);
    if (!toNode) {
      throw new Error('`to` is an invalid node ID');
    }

    const link = this.#createLink(from, to, data);
    this.#links.set(link.id, link);

    fromNode.addLink(link);
    if (from !== to) {
      toNode.addLink(link);
    }

    return link;
  }

  /**
   * @arg {String} id - Link identifier.
   * @return {Link<L> | undefined}
   */
  removeLink(id) {
    const link = this.#links.get(id);
    if (link) {
      this.#links.delete(id);

      const fromNode = this.getNode(link.from);
      const toNode = this.getNode(link.to);

      if (!fromNode || !toNode) {
        throw new Error('Should not happen!');
      }

      fromNode.removeLink(link);
      toNode.removeLink(link);
    }

    return link;
  }

  /**
   * @arg {String} from - Node ID source.
   * @arg {String} to - Node ID destination.
   * @arg {L} data - Link data.
   * @return {Link<L>}
   */
  #createLink(from, to, data) {
    const id = this.#makeLinkId(from, to);
    const link = this.#links.get(id);
    if (link) {
      link.data = data;
      return link;
    }

    return new Link(id, data, from, to);
  }

  /**
   * @arg {String} from - Node ID source.
   * @arg {String} to - Node ID destination.
   * @return {String}
   */
  #makeLinkId(from, to) {
    return from + '👉' + to;
  }
}

/**
 * @template N
 * @template L
 */
export class Node {
  /** @type {String} */
  id;

  /** @type {N} */
  data;

  /** @type {Set<Link<L>>} */
  #links;

  /**
   * @arg {String} id - Node identifier.
   * @arg {N} data - Node data.
   */
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.#links = new Set();
  }

  /** @arg {Link<L>} link - Link to add. */
  addLink(link) {
    this.#links.add(link);
  }

  /** @arg {Link<L>} link - Link to remove. */
  removeLink(link) {
    this.#links.delete(link);
  }

  /** @return {IterableIterator<Link<L>>} */
  links() {
    return this.#links[Symbol.iterator]();
  }

  /** @return {InputIterator<L>} */
  inputs() {
    return new InputIterator(this.links(), this.id);
  }

  /** @return {OutputIterator<L>} */
  outputs() {
    return new OutputIterator(this.links(), this.id);
  }
}

/**
 * @template L
 */
export class Link {
  /** @type {String} */
  id;

  /** @type {L} */
  data;

  /** @type {String} */
  from;

  /** @type {String} */
  to;

  /**
   * @arg {String} id - Link identifier.
   * @arg {L} data - Link data.
   * @arg {String} from - Node source identifier.
   * @arg {String} to - Node destination identifier.
   */
  constructor(id, data, from, to) {
    this.id = id;
    this.data = data;
    this.from = from;
    this.to = to;
  }
}

/**
 * @template L
 */
export class LinkIterator {
  /** @type {IterableIterator<Link<L>>} */
  #iter;

  /** @type {String} */
  #id;

  /**
   * @arg {IterableIterator<Link<L>>} iter - Parent iterator.
   * @arg {String} id - Search predicate.
   */
  constructor(iter, id) {
    this.#iter = iter;
    this.#id = id;
  }

  /** @return {IteratorResult<Link<L>>} */
  next() {
    const next = this.#iter.next();
    if (next.done || this.predicate(next.value, this.#id)) {
      return next;
    }

    return { done: true, value: undefined };
  }

  /**
   * @arg {Link<L>} _next - Link item to test.
   * @arg {String} _id - Link identifier.
   * @return {Boolean}
   */
  predicate(_next, _id) {
    throw new Error('Base class must be extended with predicate overload');
  }
}

/**
 * @template L
 * @extends LinkIterator<L>
 */
export class InputIterator extends LinkIterator {
  /**
   * @arg {Link<L>} next - Link item to test.
   * @arg {String} id - Link identifier.
   * @return {Boolean}
   */
  predicate(next, id) {
    return next.to === id;
  }
}

/**
 * @template L
 * @extends LinkIterator<L>
 */
export class OutputIterator extends LinkIterator {
  /**
   * @arg {Link<L>} next - Link item to test.
   * @arg {String} id - Link identifier.
   * @return {Boolean}
   */
  predicate(next, id) {
    return next.from === id;
  }
}
