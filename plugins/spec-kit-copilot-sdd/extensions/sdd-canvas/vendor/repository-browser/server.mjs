import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name3 in all)
    __defProp(target, name3, { get: all[name3], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar2(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias2;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap2;
    exports.isNode = isNode;
    exports.isPair = isPair2;
    exports.isScalar = isScalar2;
    exports.isSeq = isSeq2;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity2.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path3) {
      const ctrl = callVisitor(key, node, visitor, path3);
      if (identity2.isNode(ctrl) || identity2.isPair(ctrl)) {
        replaceNode(key, path3, ctrl);
        return visit_(key, ctrl, visitor, path3);
      }
      if (typeof ctrl !== "symbol") {
        if (identity2.isCollection(node)) {
          path3 = Object.freeze(path3.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path3);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity2.isPair(node)) {
          path3 = Object.freeze(path3.concat(node));
          const ck = visit_("key", node.key, visitor, path3);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path3);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity2.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path3) {
      const ctrl = await callVisitor(key, node, visitor, path3);
      if (identity2.isNode(ctrl) || identity2.isPair(ctrl)) {
        replaceNode(key, path3, ctrl);
        return visitAsync_(key, ctrl, visitor, path3);
      }
      if (typeof ctrl !== "symbol") {
        if (identity2.isCollection(node)) {
          path3 = Object.freeze(path3.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path3);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity2.isPair(node)) {
          path3 = Object.freeze(path3.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path3);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path3);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path3) {
      if (typeof visitor === "function")
        return visitor(key, node, path3);
      if (identity2.isMap(node))
        return visitor.Map?.(key, node, path3);
      if (identity2.isSeq(node))
        return visitor.Seq?.(key, node, path3);
      if (identity2.isPair(node))
        return visitor.Pair?.(key, node, path3);
      if (identity2.isScalar(node))
        return visitor.Scalar?.(key, node, path3);
      if (identity2.isAlias(node))
        return visitor.Alias?.(key, node, path3);
      return void 0;
    }
    function replaceNode(key, path3, node) {
      const parent = path3[path3.length - 1];
      if (identity2.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity2.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity2.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity2.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name3 = parts.shift();
        switch (name3) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version3] = parts;
            if (version3 === "1.1" || version3 === "1.2") {
              this.yaml.version = version3;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version3);
              onError(6, `Unsupported YAML version ${version3}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name3}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity2.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity2.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name3 = `${prefix}${i}`;
        if (!exclude.has(name3))
          return name3;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity2.isScalar(ref.node) || identity2.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity2.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity2 = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity2.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity2.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity2 = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity2.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity2.isAlias(node) || identity2.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity2.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity2.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity2.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity2.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity2.isDocument(value))
        value = value.contents;
      if (identity2.isNode(value))
        return value;
      if (identity2.isPair(value)) {
        const map = ctx.schema[identity2.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity2.MAP] : Symbol.iterator in Object(value) ? schema[identity2.SEQ] : schema[identity2.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity2 = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path3, value) {
      let v = value;
      for (let i = path3.length - 1; i >= 0; --i) {
        const k = path3[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path3) => path3 == null || typeof path3 === "object" && !!path3[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity2.isNode(it) || identity2.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path3, value) {
        if (isEmptyPath(path3))
          this.add(value);
        else {
          const [key, ...rest] = path3;
          const node = this.get(key, true);
          if (identity2.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path3) {
        const [key, ...rest] = path3;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity2.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path3, keepScalar) {
        const [key, ...rest] = path3;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity2.isScalar(node) ? node.value : node;
        else
          return identity2.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity2.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity2.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path3) {
        const [key, ...rest] = path3;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity2.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path3, value) {
        const [key, ...rest] = path3;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity2.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text2, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text2;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text2.length <= endStep)
        return text2;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text2, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text2[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text2[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text2, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text2[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text2[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text2;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text2;
      if (onFold)
        onFold();
      let res = text2.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text2.length;
        if (fold === 0)
          res = `
${indent}${text2.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text2[fold]}\\`;
          res += `
${indent}${text2.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text2, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text2[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text2[++i];
        } else {
          do {
            ch = text2[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text2[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity2 = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity2.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name3 = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name3} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity2.isScalar(node) || identity2.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity2.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity2.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity2.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity2.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity2.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity2.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity2.isCollection(key) || !identity2.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity2.isCollection(key) || (identity2.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity2.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity2.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity2.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity2.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages2) {
      if (logLevel === "debug")
        console.log(...messages2);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity2.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity2.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity2.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity2.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity2 = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity2.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity2.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity2 = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity2.NODE_TYPE, { value: identity2.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity2.isNode(key))
          key = key.clone(schema);
        if (identity2.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity2.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity2.isPair(item)) {
          const ik = identity2.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity2.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity2.isPair(item)) {
          const ik = identity2.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity2.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity2 = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity2.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity2.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity2.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity2.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity2.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity2.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity2.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity2.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity2.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity2.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity2.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity2.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity2.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity2.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity2.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity2.isPair(item))
            continue;
          else if (identity2.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity2.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity2.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity2.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity2.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity2.isPair(pair) ? identity2.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity2.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity2.MAP, { value: map.map });
        Object.defineProperty(this, identity2.SCALAR, { value: string.string });
        Object.defineProperty(this, identity2.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity2.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity2 = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity2.NODE_TYPE, { value: identity2.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version: version3 } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version3 = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version: version3 });
        this.setSchema(version3, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity2.NODE_TYPE]: { value: identity2.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity2.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path3, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path3, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name3) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name3 || prev.has(name3) ? anchors.findNewAnchor(name3 || "a", prev) : name3;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity2.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path3) {
        if (Collection.isEmptyPath(path3)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path3) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity2.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path3, keepScalar) {
        if (Collection.isEmptyPath(path3))
          return !keepScalar && identity2.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity2.isCollection(this.contents) ? this.contents.getIn(path3, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity2.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path3) {
        if (Collection.isEmptyPath(path3))
          return this.contents !== void 0;
        return identity2.isCollection(this.contents) ? this.contents.hasIn(path3) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path3, value) {
        if (Collection.isEmptyPath(path3)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path3), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path3, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version3, options = {}) {
        if (typeof version3 === "number")
          version3 = String(version3);
        let opt;
        switch (version3) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version3;
            else
              this.directives = new directives.Directives({ version: version3 });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version3);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity2.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name3, pos, code, message) {
        super();
        this.name = name3;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity2.isScalar(a) && identity2.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep4, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep4?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep4) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep4 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep4, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep4 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep4 + cb;
              sep4 = "";
              break;
            }
            case "newline":
              if (comment)
                sep4 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap2 = fc.start.source === "{";
      const fcName = isMap2 ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap2 ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep4, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep4?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep4 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap2 && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity2.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap2 && !sep4 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep4, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep4 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap2 && !props.found && ctx.options.strict) {
              if (sep4)
                for (const st of sep4) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep4, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap2) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap2 ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name3 = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name3} must end with a ${expectedEnd}` : `${name3} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity2.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep4 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep4 + indent.slice(trimIndent) + content;
          sep4 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep4 === " ")
            sep4 = "\n";
          else if (!prevMoreIndented && sep4 === "\n")
            sep4 = "\n\n";
          value += sep4 + indent.slice(trimIndent) + content;
          sep4 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep4 === "\n")
            value += "\n";
          else
            sep4 = "\n";
        } else {
          value += sep4 + content;
          sep4 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep4 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep4 === "\n")
            res += sep4;
          else
            sep4 = "\n";
        } else {
          res += sep4 + match[1];
          sep4 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep4 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity2 = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity2.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity2.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity2.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity2.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity2.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity2.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity2.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity2 = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity2.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity2 = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity2.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity2.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep4, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep4)
        for (const st of sep4)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path3) => {
      let item = cst;
      for (const [field, index] of path3) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path3) => {
      const parent = visit.itemAtPath(cst, path3.slice(0, -1));
      const field = path3[path3.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path3, item, visitor) {
      let ctrl = visitor(item, path3);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path3.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path3);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path3) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar2 = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar2;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep4;
          if (scalar.end) {
            sep4 = scalar.end;
            sep4.push(this.sourceToken);
            delete scalar.end;
          } else
            sep4 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep4 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep4 = it.sep;
                  sep4.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep4 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs6 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs6, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs6);
              } else {
                Object.assign(it, { key: fs6, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs6 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs6, sep: [] });
              else if (it.sep)
                this.stack.push(fs6);
              else
                Object.assign(it, { key: fs6, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep4 = fc.end.splice(1, fc.end.length);
            sep4.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep4 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity2 = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments2(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument4(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument4(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity2.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments2;
    exports.parseDocument = parseDocument4;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity2 = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity2.isAlias;
    exports.isCollection = identity2.isCollection;
    exports.isDocument = identity2.isDocument;
    exports.isMap = identity2.isMap;
    exports.isNode = identity2.isNode;
    exports.isPair = identity2.isPair;
    exports.isScalar = identity2.isScalar;
    exports.isSeq = identity2.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer4 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer4.from && Buffer4.alloc && Buffer4.allocUnsafe && Buffer4.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer4(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer4.prototype);
    copyProps(Buffer4, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer4(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer4(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer4(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer4 = require_safe_buffer().Buffer;
    var Stream = __require("stream");
    var util = __require("util");
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer4.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer4.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick(function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }.bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer4.concat([this.buffer, Buffer4.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer4 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer4.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer4.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer4.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer4.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer4 = __require("buffer").Buffer;
    var SlowBuffer = __require("buffer").SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer4.isBuffer(a) || !Buffer4.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer4.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer4.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer4.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/jwa/index.js"(exports, module) {
    var Buffer4 = require_safe_buffer().Buffer;
    var crypto3 = __require("crypto");
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util = __require("util");
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto3.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer4.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer4.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer4.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util.format.bind(util, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer4.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto3.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual4 = "timingSafeEqual" in crypto3 ? function timingSafeEqual5(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto3.timingSafeEqual(a, b);
    } : function timingSafeEqual5(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual4(Buffer4.from(signature), Buffer4.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase();
      var bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer4 = __require("buffer").Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer4.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer4 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    function base64url(string, encoding) {
      return Buffer4.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      secret = secret == null ? opts.privateKey : secret;
      secret = secret == null ? opts.key : secret;
      if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }.bind(this));
      this.payload.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }.bind(this));
    }
    util.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer4 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer4.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer4.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
      secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
      if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }.bind(this));
      this.signature.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }.bind(this));
    }
    util.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/jsonwebtoken/decode.js
var require_decode = __commonJS({
  "node_modules/jsonwebtoken/decode.js"(exports, module) {
    var jws = require_jws();
    module.exports = function(jwt2, options) {
      options = options || {};
      var decoded = jws.decode(jwt2, options);
      if (!decoded) {
        return null;
      }
      var payload = decoded.payload;
      if (typeof payload === "string") {
        try {
          var obj = JSON.parse(payload);
          if (obj !== null && typeof obj === "object") {
            payload = obj;
          }
        } catch (e) {
        }
      }
      if (options.complete === true) {
        return {
          header: decoded.header,
          payload,
          signature: decoded.signature
        };
      }
      return payload;
    };
  }
});

// node_modules/jsonwebtoken/lib/JsonWebTokenError.js
var require_JsonWebTokenError = __commonJS({
  "node_modules/jsonwebtoken/lib/JsonWebTokenError.js"(exports, module) {
    var JsonWebTokenError = function(message, error) {
      Error.call(this, message);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
      this.name = "JsonWebTokenError";
      this.message = message;
      if (error) this.inner = error;
    };
    JsonWebTokenError.prototype = Object.create(Error.prototype);
    JsonWebTokenError.prototype.constructor = JsonWebTokenError;
    module.exports = JsonWebTokenError;
  }
});

// node_modules/jsonwebtoken/lib/NotBeforeError.js
var require_NotBeforeError = __commonJS({
  "node_modules/jsonwebtoken/lib/NotBeforeError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = function(message, date) {
      JsonWebTokenError.call(this, message);
      this.name = "NotBeforeError";
      this.date = date;
    };
    NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype);
    NotBeforeError.prototype.constructor = NotBeforeError;
    module.exports = NotBeforeError;
  }
});

// node_modules/jsonwebtoken/lib/TokenExpiredError.js
var require_TokenExpiredError = __commonJS({
  "node_modules/jsonwebtoken/lib/TokenExpiredError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var TokenExpiredError = function(message, expiredAt) {
      JsonWebTokenError.call(this, message);
      this.name = "TokenExpiredError";
      this.expiredAt = expiredAt;
    };
    TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);
    TokenExpiredError.prototype.constructor = TokenExpiredError;
    module.exports = TokenExpiredError;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name3) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name3 + (isPlural ? "s" : "");
    }
  }
});

// node_modules/jsonwebtoken/lib/timespan.js
var require_timespan = __commonJS({
  "node_modules/jsonwebtoken/lib/timespan.js"(exports, module) {
    var ms = require_ms();
    module.exports = function(time, iat) {
      var timestamp = iat || Math.floor(Date.now() / 1e3);
      if (typeof time === "string") {
        var milliseconds = ms(time);
        if (typeof milliseconds === "undefined") {
          return;
        }
        return Math.floor(timestamp + milliseconds / 1e3);
      } else if (typeof time === "number") {
        return timestamp + time;
      } else {
        return;
      }
    };
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports, module) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports, module) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports, module) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t = exports.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name3, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name3, index, value);
      t[name3] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports, module) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports, module) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports, module) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier3) => {
      const identifiers = identifier3.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version3, options) {
        options = parseOptions(options);
        if (version3 instanceof _SemVer) {
          if (version3.loose === !!options.loose && version3.includePrerelease === !!options.includePrerelease) {
            return version3;
          } else {
            version3 = version3.version;
          }
        } else if (typeof version3 !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version3}".`);
        }
        if (version3.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version3, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version3.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version3}`);
        }
        this.raw = version3;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier3, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier3 && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier3) {
            const match = `-${identifier3}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier3) {
              throw new Error(`invalid identifier: ${identifier3}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier3, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier3, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier3, identifierBase);
            this.inc("pre", identifier3, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier3, identifierBase);
            }
            this.inc("pre", identifier3, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier3 === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier3) {
              let prerelease = [identifier3, base];
              if (identifierBase === false) {
                prerelease = [identifier3];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier3)) {
                const prereleaseBase = this.prerelease[identifier3.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version3, options, throwErrors = false) => {
      if (version3 instanceof SemVer) {
        return version3;
      }
      try {
        return new SemVer(version3, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var valid = (version3, options) => {
      const v = parse(version3, options);
      return v ? v.version : null;
    };
    module.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var clean = (version3, options) => {
      const s = parse(version3.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version3, release, options, identifier3, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier3;
        identifier3 = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version3 instanceof SemVer ? version3.version : version3,
          options
        ).inc(release, identifier3, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version22) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version22, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version3, options) => {
      const parsed = parse(version3, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compare2 = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module.exports = compare2;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var rcompare = (a, b, loose) => compare2(b, a, loose);
    module.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var compareLoose = (a, b) => compare2(a, b, true);
    module.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var gt = (a, b, loose) => compare2(a, b, loose) > 0;
    module.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var lt = (a, b, loose) => compare2(a, b, loose) < 0;
    module.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var eq = (a, b, loose) => compare2(a, b, loose) === 0;
    module.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var neq = (a, b, loose) => compare2(a, b, loose) !== 0;
    module.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var gte = (a, b, loose) => compare2(a, b, loose) >= 0;
    module.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports, module) {
    "use strict";
    var compare2 = require_compare();
    var lte = (a, b, loose) => compare2(a, b, loose) <= 0;
    module.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports, module) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version3, options) => {
      if (version3 instanceof SemVer) {
        return version3;
      }
      if (typeof version3 === "number") {
        version3 = String(version3);
      }
      if (typeof version3 !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version3.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version3)) && (!match || match.index + match[0].length !== version3.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module.exports = coerce;
  }
});

// node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/semver/functions/truncate.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var constants2 = require_constants();
    var SemVer = require_semver();
    var truncate = (version3, truncation, options) => {
      if (!constants2.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version3, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version3, options) => {
      const versionStringToParse = version3 instanceof SemVer ? version3.version : version3;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version3, truncation) => {
      if (isPrerelease(truncation)) {
        return version3.version;
      }
      version3.prerelease = [];
      switch (truncation) {
        case "major":
          version3.minor = 0;
          version3.patch = 0;
          break;
        case "minor":
          version3.patch = 0;
          break;
      }
      return version3.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module.exports = truncate;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports, module) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports, module) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version3) {
        if (!version3) {
          return false;
        }
        if (typeof version3 === "string") {
          try {
            version3 = new SemVer(version3, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version3, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version3, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version3)) {
          return false;
        }
      }
      if (version3.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version3.major && allowed.minor === version3.minor && allowed.patch === version3.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports, module) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version3) {
        debug("Comparator.test", version3, this.options.loose);
        if (this.semver === ANY || version3 === ANY) {
          return true;
        }
        if (typeof version3 === "string") {
          try {
            version3 = new SemVer(version3, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version3, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var satisfies = (version3, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version3);
    };
    module.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version3, range, hilo, options) => {
      version3 = new SemVer(version3, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version3, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version3, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version3, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var gtr = (version3, range, options) => outside(version3, range, ">", options);
    module.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var ltr = (version3, range, options) => outside(version3, range, "<", options);
    module.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports, module) {
    "use strict";
    var satisfies = require_satisfies();
    var compare2 = require_compare();
    module.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare2(a, b, options));
      for (const version3 of v) {
        const included = satisfies(version3, range, options);
        if (included) {
          prev = version3;
          if (!first) {
            first = version3;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare2 = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare2(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare2(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare2(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports, module) {
    "use strict";
    var internalRe = require_re();
    var constants2 = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare2 = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare: compare2,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants2.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants2.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
var require_asymmetricKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=15.7.0");
  }
});

// node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
var require_rsaPssKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=16.9.0");
  }
});

// node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
var require_validateAsymmetricKey = __commonJS({
  "node_modules/jsonwebtoken/lib/validateAsymmetricKey.js"(exports, module) {
    var ASYMMETRIC_KEY_DETAILS_SUPPORTED = require_asymmetricKeyDetailsSupported();
    var RSA_PSS_KEY_DETAILS_SUPPORTED = require_rsaPssKeyDetailsSupported();
    var allowedAlgorithmsForKeys = {
      "ec": ["ES256", "ES384", "ES512"],
      "rsa": ["RS256", "PS256", "RS384", "PS384", "RS512", "PS512"],
      "rsa-pss": ["PS256", "PS384", "PS512"]
    };
    var allowedCurves = {
      ES256: "prime256v1",
      ES384: "secp384r1",
      ES512: "secp521r1"
    };
    module.exports = function(algorithm, key) {
      if (!algorithm || !key) return;
      const keyType = key.asymmetricKeyType;
      if (!keyType) return;
      const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
      if (!allowedAlgorithms) {
        throw new Error(`Unknown key type "${keyType}".`);
      }
      if (!allowedAlgorithms.includes(algorithm)) {
        throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(", ")}.`);
      }
      if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
        switch (keyType) {
          case "ec":
            const keyCurve = key.asymmetricKeyDetails.namedCurve;
            const allowedCurve = allowedCurves[algorithm];
            if (keyCurve !== allowedCurve) {
              throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
            }
            break;
          case "rsa-pss":
            if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
              const length = parseInt(algorithm.slice(-3), 10);
              const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;
              if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
              }
              if (saltLength !== void 0 && saltLength > length >> 3) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
              }
            }
            break;
        }
      }
    };
  }
});

// node_modules/jsonwebtoken/lib/psSupported.js
var require_psSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/psSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, "^6.12.0 || >=8.0.0");
  }
});

// node_modules/jsonwebtoken/verify.js
var require_verify = __commonJS({
  "node_modules/jsonwebtoken/verify.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = require_NotBeforeError();
    var TokenExpiredError = require_TokenExpiredError();
    var decode = require_decode();
    var timespan = require_timespan();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var PS_SUPPORTED = require_psSupported();
    var jws = require_jws();
    var { KeyObject, createSecretKey, createPublicKey } = __require("crypto");
    var PUB_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var EC_KEY_ALGS = ["ES256", "ES384", "ES512"];
    var RSA_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var HS_ALGS = ["HS256", "HS384", "HS512"];
    if (PS_SUPPORTED) {
      PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
      RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
    }
    module.exports = function(jwtString, secretOrPublicKey, options, callback) {
      if (typeof options === "function" && !callback) {
        callback = options;
        options = {};
      }
      if (!options) {
        options = {};
      }
      options = Object.assign({}, options);
      let done;
      if (callback) {
        done = callback;
      } else {
        done = function(err, data) {
          if (err) throw err;
          return data;
        };
      }
      if (options.clockTimestamp && typeof options.clockTimestamp !== "number") {
        return done(new JsonWebTokenError("clockTimestamp must be a number"));
      }
      if (options.nonce !== void 0 && (typeof options.nonce !== "string" || options.nonce.trim() === "")) {
        return done(new JsonWebTokenError("nonce must be a non-empty string"));
      }
      if (options.allowInvalidAsymmetricKeyTypes !== void 0 && typeof options.allowInvalidAsymmetricKeyTypes !== "boolean") {
        return done(new JsonWebTokenError("allowInvalidAsymmetricKeyTypes must be a boolean"));
      }
      const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1e3);
      if (!jwtString) {
        return done(new JsonWebTokenError("jwt must be provided"));
      }
      if (typeof jwtString !== "string") {
        return done(new JsonWebTokenError("jwt must be a string"));
      }
      const parts = jwtString.split(".");
      if (parts.length !== 3) {
        return done(new JsonWebTokenError("jwt malformed"));
      }
      let decodedToken;
      try {
        decodedToken = decode(jwtString, { complete: true });
      } catch (err) {
        return done(err);
      }
      if (!decodedToken) {
        return done(new JsonWebTokenError("invalid token"));
      }
      const header = decodedToken.header;
      let getSecret;
      if (typeof secretOrPublicKey === "function") {
        if (!callback) {
          return done(new JsonWebTokenError("verify must be called asynchronous if secret or public key is provided as a callback"));
        }
        getSecret = secretOrPublicKey;
      } else {
        getSecret = function(header2, secretCallback) {
          return secretCallback(null, secretOrPublicKey);
        };
      }
      return getSecret(header, function(err, secretOrPublicKey2) {
        if (err) {
          return done(new JsonWebTokenError("error in secret or public key callback: " + err.message));
        }
        const hasSignature = parts[2].trim() !== "";
        if (!hasSignature && secretOrPublicKey2) {
          return done(new JsonWebTokenError("jwt signature is required"));
        }
        if (hasSignature && !secretOrPublicKey2) {
          return done(new JsonWebTokenError("secret or public key must be provided"));
        }
        if (!hasSignature && !options.algorithms) {
          return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
        }
        if (secretOrPublicKey2 != null && !(secretOrPublicKey2 instanceof KeyObject)) {
          try {
            secretOrPublicKey2 = createPublicKey(secretOrPublicKey2);
          } catch (_) {
            try {
              secretOrPublicKey2 = createSecretKey(typeof secretOrPublicKey2 === "string" ? Buffer.from(secretOrPublicKey2) : secretOrPublicKey2);
            } catch (_2) {
              return done(new JsonWebTokenError("secretOrPublicKey is not valid key material"));
            }
          }
        }
        if (!options.algorithms) {
          if (secretOrPublicKey2.type === "secret") {
            options.algorithms = HS_ALGS;
          } else if (["rsa", "rsa-pss"].includes(secretOrPublicKey2.asymmetricKeyType)) {
            options.algorithms = RSA_KEY_ALGS;
          } else if (secretOrPublicKey2.asymmetricKeyType === "ec") {
            options.algorithms = EC_KEY_ALGS;
          } else {
            options.algorithms = PUB_KEY_ALGS;
          }
        }
        if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
          return done(new JsonWebTokenError("invalid algorithm"));
        }
        if (header.alg.startsWith("HS") && secretOrPublicKey2.type !== "secret") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
        } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey2.type !== "public") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInvalidAsymmetricKeyTypes) {
          try {
            validateAsymmetricKey(header.alg, secretOrPublicKey2);
          } catch (e) {
            return done(e);
          }
        }
        let valid;
        try {
          valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey2);
        } catch (e) {
          return done(e);
        }
        if (!valid) {
          return done(new JsonWebTokenError("invalid signature"));
        }
        const payload = decodedToken.payload;
        if (typeof payload.nbf !== "undefined" && !options.ignoreNotBefore) {
          if (typeof payload.nbf !== "number") {
            return done(new JsonWebTokenError("invalid nbf value"));
          }
          if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
            return done(new NotBeforeError("jwt not active", new Date(payload.nbf * 1e3)));
          }
        }
        if (typeof payload.exp !== "undefined" && !options.ignoreExpiration) {
          if (typeof payload.exp !== "number") {
            return done(new JsonWebTokenError("invalid exp value"));
          }
          if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("jwt expired", new Date(payload.exp * 1e3)));
          }
        }
        if (options.audience) {
          const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
          const target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
          const match = target.some(function(targetAudience) {
            return audiences.some(function(audience) {
              return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
            });
          });
          if (!match) {
            return done(new JsonWebTokenError("jwt audience invalid. expected: " + audiences.join(" or ")));
          }
        }
        if (options.issuer) {
          const invalid_issuer = typeof options.issuer === "string" && payload.iss !== options.issuer || Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1;
          if (invalid_issuer) {
            return done(new JsonWebTokenError("jwt issuer invalid. expected: " + options.issuer));
          }
        }
        if (options.subject) {
          if (payload.sub !== options.subject) {
            return done(new JsonWebTokenError("jwt subject invalid. expected: " + options.subject));
          }
        }
        if (options.jwtid) {
          if (payload.jti !== options.jwtid) {
            return done(new JsonWebTokenError("jwt jwtid invalid. expected: " + options.jwtid));
          }
        }
        if (options.nonce) {
          if (payload.nonce !== options.nonce) {
            return done(new JsonWebTokenError("jwt nonce invalid. expected: " + options.nonce));
          }
        }
        if (options.maxAge) {
          if (typeof payload.iat !== "number") {
            return done(new JsonWebTokenError("iat required when maxAge is specified"));
          }
          const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
          if (typeof maxAgeTimestamp === "undefined") {
            return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
          }
          if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("maxAge exceeded", new Date(maxAgeTimestamp * 1e3)));
          }
        }
        if (options.complete === true) {
          const signature = decodedToken.signature;
          return done(null, {
            header,
            payload,
            signature
          });
        }
        return done(null, payload);
      });
    };
  }
});

// node_modules/lodash.includes/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.includes/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var argsTag = "[object Arguments]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var freeParseInt = parseInt;
    function arrayMap(array, iteratee) {
      var index = -1, length = array ? array.length : 0, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseValues(object3, props) {
      return arrayMap(props, function(key) {
        return object3[key];
      });
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeKeys = overArg(Object.keys, Object);
    var nativeMax = Math.max;
    function arrayLikeKeys(value, inherited) {
      var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
      var length = result.length, skipIndexes = !!length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function baseKeys(object3) {
      if (!isPrototype(object3)) {
        return nativeKeys(object3);
      }
      var result = [];
      for (var key in Object(object3)) {
        if (hasOwnProperty.call(object3, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
    }
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    function isFunction(value) {
      var tag = isObject(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    function keys(object3) {
      return isArrayLike(object3) ? arrayLikeKeys(object3) : baseKeys(object3);
    }
    function values(object3) {
      return object3 ? baseValues(object3, keys(object3)) : [];
    }
    module.exports = includes;
  }
});

// node_modules/lodash.isboolean/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.isboolean/index.js"(exports, module) {
    var boolTag = "[object Boolean]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isBoolean(value) {
      return value === true || value === false || isObjectLike(value) && objectToString.call(value) == boolTag;
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    module.exports = isBoolean;
  }
});

// node_modules/lodash.isinteger/index.js
var require_lodash3 = __commonJS({
  "node_modules/lodash.isinteger/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isInteger(value) {
      return typeof value == "number" && value == toInteger(value);
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = isInteger;
  }
});

// node_modules/lodash.isnumber/index.js
var require_lodash4 = __commonJS({
  "node_modules/lodash.isnumber/index.js"(exports, module) {
    var numberTag = "[object Number]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isNumber(value) {
      return typeof value == "number" || isObjectLike(value) && objectToString.call(value) == numberTag;
    }
    module.exports = isNumber;
  }
});

// node_modules/lodash.isplainobject/index.js
var require_lodash5 = __commonJS({
  "node_modules/lodash.isplainobject/index.js"(exports, module) {
    var objectTag = "[object Object]";
    function isHostObject(value) {
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {
        }
      }
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    var objectToString = objectProto.toString;
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isPlainObject3(value) {
      if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    module.exports = isPlainObject3;
  }
});

// node_modules/lodash.isstring/index.js
var require_lodash6 = __commonJS({
  "node_modules/lodash.isstring/index.js"(exports, module) {
    var stringTag = "[object String]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var isArray = Array.isArray;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    module.exports = isString;
  }
});

// node_modules/lodash.once/index.js
var require_lodash7 = __commonJS({
  "node_modules/lodash.once/index.js"(exports, module) {
    var FUNC_ERROR_TEXT = "Expected a function";
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function before(n, func) {
      var result;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = void 0;
        }
        return result;
      };
    }
    function once(func) {
      return before(2, func);
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = once;
  }
});

// node_modules/jsonwebtoken/sign.js
var require_sign = __commonJS({
  "node_modules/jsonwebtoken/sign.js"(exports, module) {
    var timespan = require_timespan();
    var PS_SUPPORTED = require_psSupported();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var jws = require_jws();
    var includes = require_lodash();
    var isBoolean = require_lodash2();
    var isInteger = require_lodash3();
    var isNumber = require_lodash4();
    var isPlainObject3 = require_lodash5();
    var isString = require_lodash6();
    var once = require_lodash7();
    var { KeyObject, createSecretKey, createPrivateKey } = __require("crypto");
    var SUPPORTED_ALGS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "HS256", "HS384", "HS512", "none"];
    if (PS_SUPPORTED) {
      SUPPORTED_ALGS.splice(3, 0, "PS256", "PS384", "PS512");
    }
    var sign_options_schema = {
      expiresIn: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"expiresIn" should be a number of seconds or string representing a timespan' },
      notBefore: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"notBefore" should be a number of seconds or string representing a timespan' },
      audience: { isValid: function(value) {
        return isString(value) || Array.isArray(value);
      }, message: '"audience" must be a string or array' },
      algorithm: { isValid: includes.bind(null, SUPPORTED_ALGS), message: '"algorithm" must be a valid string enum value' },
      header: { isValid: isPlainObject3, message: '"header" must be an object' },
      encoding: { isValid: isString, message: '"encoding" must be a string' },
      issuer: { isValid: isString, message: '"issuer" must be a string' },
      subject: { isValid: isString, message: '"subject" must be a string' },
      jwtid: { isValid: isString, message: '"jwtid" must be a string' },
      noTimestamp: { isValid: isBoolean, message: '"noTimestamp" must be a boolean' },
      keyid: { isValid: isString, message: '"keyid" must be a string' },
      mutatePayload: { isValid: isBoolean, message: '"mutatePayload" must be a boolean' },
      allowInsecureKeySizes: { isValid: isBoolean, message: '"allowInsecureKeySizes" must be a boolean' },
      allowInvalidAsymmetricKeyTypes: { isValid: isBoolean, message: '"allowInvalidAsymmetricKeyTypes" must be a boolean' }
    };
    var registered_claims_schema = {
      iat: { isValid: isNumber, message: '"iat" should be a number of seconds' },
      exp: { isValid: isNumber, message: '"exp" should be a number of seconds' },
      nbf: { isValid: isNumber, message: '"nbf" should be a number of seconds' }
    };
    function validate(schema, allowUnknown, object3, parameterName) {
      if (!isPlainObject3(object3)) {
        throw new Error('Expected "' + parameterName + '" to be a plain object.');
      }
      Object.keys(object3).forEach(function(key) {
        const validator = schema[key];
        if (!validator) {
          if (!allowUnknown) {
            throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
          }
          return;
        }
        if (!validator.isValid(object3[key])) {
          throw new Error(validator.message);
        }
      });
    }
    function validateOptions(options) {
      return validate(sign_options_schema, false, options, "options");
    }
    function validatePayload(payload) {
      return validate(registered_claims_schema, true, payload, "payload");
    }
    var options_to_payload = {
      "audience": "aud",
      "issuer": "iss",
      "subject": "sub",
      "jwtid": "jti"
    };
    var options_for_objects = [
      "expiresIn",
      "notBefore",
      "noTimestamp",
      "audience",
      "issuer",
      "subject",
      "jwtid"
    ];
    module.exports = function(payload, secretOrPrivateKey, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      } else {
        options = options || {};
      }
      const isObjectPayload = typeof payload === "object" && !Buffer.isBuffer(payload);
      const header = Object.assign({
        alg: options.algorithm || "HS256",
        typ: isObjectPayload ? "JWT" : void 0,
        kid: options.keyid
      }, options.header);
      function failure(err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (!secretOrPrivateKey && options.algorithm !== "none") {
        return failure(new Error("secretOrPrivateKey must have a value"));
      }
      if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
        try {
          secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
        } catch (_) {
          try {
            secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === "string" ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
          } catch (_2) {
            return failure(new Error("secretOrPrivateKey is not valid key material"));
          }
        }
      }
      if (header.alg.startsWith("HS") && secretOrPrivateKey.type !== "secret") {
        return failure(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
      } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
        if (secretOrPrivateKey.type !== "private") {
          return failure(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInsecureKeySizes && !header.alg.startsWith("ES") && secretOrPrivateKey.asymmetricKeyDetails !== void 0 && //KeyObject.asymmetricKeyDetails is supported in Node 15+
        secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
          return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
        }
      }
      if (typeof payload === "undefined") {
        return failure(new Error("payload is required"));
      } else if (isObjectPayload) {
        try {
          validatePayload(payload);
        } catch (error) {
          return failure(error);
        }
        if (!options.mutatePayload) {
          payload = Object.assign({}, payload);
        }
      } else {
        const invalid_options = options_for_objects.filter(function(opt) {
          return typeof options[opt] !== "undefined";
        });
        if (invalid_options.length > 0) {
          return failure(new Error("invalid " + invalid_options.join(",") + " option for " + typeof payload + " payload"));
        }
      }
      if (typeof payload.exp !== "undefined" && typeof options.expiresIn !== "undefined") {
        return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
      }
      if (typeof payload.nbf !== "undefined" && typeof options.notBefore !== "undefined") {
        return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
      }
      try {
        validateOptions(options);
      } catch (error) {
        return failure(error);
      }
      if (!options.allowInvalidAsymmetricKeyTypes) {
        try {
          validateAsymmetricKey(header.alg, secretOrPrivateKey);
        } catch (error) {
          return failure(error);
        }
      }
      const timestamp = payload.iat || Math.floor(Date.now() / 1e3);
      if (options.noTimestamp) {
        delete payload.iat;
      } else if (isObjectPayload) {
        payload.iat = timestamp;
      }
      if (typeof options.notBefore !== "undefined") {
        try {
          payload.nbf = timespan(options.notBefore, timestamp);
        } catch (err) {
          return failure(err);
        }
        if (typeof payload.nbf === "undefined") {
          return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      if (typeof options.expiresIn !== "undefined" && typeof payload === "object") {
        try {
          payload.exp = timespan(options.expiresIn, timestamp);
        } catch (err) {
          return failure(err);
        }
        if (typeof payload.exp === "undefined") {
          return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      Object.keys(options_to_payload).forEach(function(key) {
        const claim = options_to_payload[key];
        if (typeof options[key] !== "undefined") {
          if (typeof payload[claim] !== "undefined") {
            return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
          }
          payload[claim] = options[key];
        }
      });
      const encoding = options.encoding || "utf8";
      if (typeof callback === "function") {
        callback = callback && once(callback);
        jws.createSign({
          header,
          privateKey: secretOrPrivateKey,
          payload,
          encoding
        }).once("error", callback).once("done", function(signature) {
          if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
            return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
          }
          callback(null, signature);
        });
      } else {
        let signature = jws.sign({ header, payload, secret: secretOrPrivateKey, encoding });
        if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
          throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
        }
        return signature;
      }
    };
  }
});

// node_modules/jsonwebtoken/index.js
var require_jsonwebtoken = __commonJS({
  "node_modules/jsonwebtoken/index.js"(exports, module) {
    module.exports = {
      decode: require_decode(),
      verify: require_verify(),
      sign: require_sign(),
      JsonWebTokenError: require_JsonWebTokenError(),
      NotBeforeError: require_NotBeforeError(),
      TokenExpiredError: require_TokenExpiredError()
    };
  }
});

// src/repository-service.ts
var import_yaml4 = __toESM(require_dist(), 1);
import { createHash as createHash7, randomBytes as randomBytes8 } from "node:crypto";
import { realpath as realpath5 } from "node:fs/promises";
import { homedir as homedir6 } from "node:os";
import { basename, join as join6 } from "node:path";

// src/ado-client.ts
import { setTimeout as delay } from "node:timers/promises";

// src/errors.ts
var messages = {
  invalid_request: "The repository request is invalid.",
  connection_required: "Connect a Microsoft account to continue.",
  interaction_required: "Microsoft sign-in is required to continue.",
  wrong_tenant: "Use a Microsoft account from the configured organization.",
  insufficient_scope: "The required delegated permission is unavailable.",
  policy_blocked: "Microsoft sign-in is blocked by organizational policy.",
  resource_unavailable: "The requested repository resource is unavailable.",
  invalid_context: "The repository context is no longer valid.",
  expired_cursor: "The repository page expired. Refresh the collection.",
  source_unavailable: "The selected repository revision is unavailable.",
  unsupported_file: "This artifact cannot be previewed as text.",
  file_too_large: "The artifact exceeds the 5 MiB preview limit.",
  rate_limited: "Azure DevOps is temporarily limiting requests. Try again later.",
  clone_conflict: "The repository preparation cannot proceed in this state.",
  clone_cancelled: "Repository preparation was cancelled.",
  remote_read_only: "Open the repository in a verified local session to run workflows.",
  local_context_mismatch: "The workflow does not match this session's local repository.",
  entry_required: "Choose a repository or continue with the current workspace first.",
  source_changed: "The repository's default revision changed. Select it again before confirming.",
  context_changed: "The active workspace changed. Review the repository selection again.",
  confirmation_expired: "Clone confirmation expired. Review and confirm the selection again.",
  session_busy: "The current session is busy. Wait until it is idle, then try again.",
  clone_identity_changed: "The prepared checkout changed. It has been preserved and handoff is blocked.",
  handoff_in_progress: "The repository handoff is still in progress.",
  handoff_unknown: "The handoff outcome is not confirmed. Check its status before trying again.",
  host_handoff_unsupported: "This Copilot App host does not provide the verified repository handoff capability.",
  activity_unknown: "The host's activity state could not be verified. Repository preparation is blocked.",
  canvas_unavailable: "The original Spec Kit canvas is unavailable in the target session.",
  upstream_unavailable: "The repository service is temporarily unavailable."
};
function repositoryErrorStatus(code) {
  if (code === "invalid_request") return 400;
  if (code === "resource_unavailable") return 404;
  if (["connection_required", "interaction_required"].includes(code)) return 401;
  if (["wrong_tenant", "insufficient_scope", "policy_blocked"].includes(code)) return 403;
  if (["host_handoff_unsupported", "activity_unknown", "canvas_unavailable"].includes(code)) return 412;
  if (code === "rate_limited") return 429;
  if (code === "upstream_unavailable") return 503;
  return 409;
}
function knownRepositoryError(code) {
  return new RepositoryError(typeof code === "string" && Object.hasOwn(messages, code) ? code : "upstream_unavailable");
}
var RepositoryError = class extends Error {
  code;
  retryAfterSeconds;
  constructor(code, retryAfterSeconds) {
    super(messages[code]);
    this.name = "RepositoryError";
    this.code = code;
    if (Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds > 0) this.retryAfterSeconds = Math.min(retryAfterSeconds, 3600);
    this.stack = `${this.name}: ${this.message}`;
  }
};
function errorEnvelope(error) {
  const failure = error instanceof RepositoryError ? error : new RepositoryError("upstream_unavailable");
  return { ok: false, error: {
    code: failure.code,
    message: failure.message,
    retryable: ["upstream_unavailable", "rate_limited"].includes(failure.code),
    ...failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : {}
  } };
}

// src/profile.ts
var import_yaml = __toESM(require_dist(), 1);
import { lstat, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var PROFILE_FIELDS = /* @__PURE__ */ new Set(["schemaVersion", "enabled", "tenantId", "clientId", "organization", "project"]);
function identifier(value) {
  if (typeof value !== "string" || !UUID.test(value)) throw new RepositoryError("invalid_request");
  return value.toLowerCase();
}
function segment(value) {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > 128 || /[\p{Cc}\p{Cf}/\\?#%]/u.test(value) || value === "." || value === "..") throw new RepositoryError("invalid_request");
  return value;
}
function parseRepositoryProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RepositoryError("invalid_request");
  const input = value;
  if (Object.keys(input).some((key) => !PROFILE_FIELDS.has(key)) || input.schemaVersion !== 1 || typeof input.enabled !== "boolean") {
    throw new RepositoryError("invalid_request");
  }
  return Object.freeze({
    schemaVersion: 1,
    enabled: input.enabled,
    tenantId: identifier(input.tenantId),
    clientId: identifier(input.clientId),
    organization: segment(input.organization),
    project: segment(input.project)
  });
}
async function loadRepositoryProfile(homeDirectory = homedir()) {
  if (!isAbsolute(homeDirectory)) return { state: "invalid" };
  const profilePath = join(resolve(homeDirectory), ".speckit-canvas", "repository-profile.json");
  try {
    for (let parent = dirname(profilePath); ; parent = dirname(parent)) {
      const info2 = await lstat(parent);
      if (!info2.isDirectory() || info2.isSymbolicLink()) return { state: "invalid" };
      if (dirname(parent) === parent) break;
    }
    const info = await lstat(profilePath);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 16384) return { state: "invalid" };
    const bytes = await readFile(profilePath);
    if (bytes.length > 16384) return { state: "invalid" };
    const profile = parseRepositoryProfile(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    return profile.enabled ? { state: "configured", profile } : { state: "disabled" };
  } catch (error) {
    return { state: error.code === "ENOENT" ? "unconfigured" : "invalid" };
  }
}
async function loadEntrySettings(homeDirectory = homedir()) {
  const result = (state) => ({
    state,
    settings: Object.freeze({ schemaVersion: 1, repositoryEntryEnabled: state === "enabled" })
  });
  if (!isAbsolute(homeDirectory)) return result("invalid");
  const filename = join(resolve(homeDirectory), ".speckit-canvas", "entry-settings.json");
  try {
    for (let parent = dirname(filename); ; parent = dirname(parent)) {
      const info2 = await lstat(parent);
      if (!info2.isDirectory() || info2.isSymbolicLink()) return result("invalid");
      if (dirname(parent) === parent) break;
    }
    const info = await lstat(filename);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 4096) return result("invalid");
    const bytes = await readFile(filename);
    if (bytes.length > 4096) return result("invalid");
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input) || (0, import_yaml.parseDocument)(raw, { schema: "json", uniqueKeys: true }).errors.length) return result("invalid");
    const fields2 = input;
    if (fields2.schemaVersion !== 1 || typeof fields2.repositoryEntryEnabled !== "boolean" || Object.keys(fields2).some((key) => !["schemaVersion", "repositoryEntryEnabled"].includes(key))) return result("invalid");
    return result(fields2.repositoryEntryEnabled ? "enabled" : "disabled");
  } catch (error) {
    return result(error.code === "ENOENT" ? "enabled" : "invalid");
  }
}

// src/ado-client.ts
var COMMIT = /^[a-f0-9]{40}$/i;
async function responseBytes(response, maximumBytes) {
  if (!response.body || Number(response.headers.get("content-length")) > maximumBytes) {
    await response.body?.cancel();
    throw new RepositoryError("file_too_large");
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new RepositoryError("file_too_large");
      }
      chunks.push(part.value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    reader.releaseLock();
  }
}
function createAdoClient({ profile, connection, request = fetch, pause = (milliseconds, signal) => delay(milliseconds, void 0, { signal }) }) {
  const api = {
    async open() {
      const access = await connection.access();
      const expiresAt = Date.now() + 35e3;
      const signal = AbortSignal.any([access.signal, AbortSignal.timeout(35e3)]);
      let retries = 2;
      async function send(segments, query, options, accept) {
        if (segments.some((segment2) => !segment2 || segment2 === "." || segment2 === ".." || /[\p{Cc}/\\?#]/u.test(segment2))) throw new RepositoryError("invalid_request");
        const url = new URL(`https://${options.search ? "almsearch.dev.azure.com" : "dev.azure.com"}/${[profile.organization, ...segments].map(encodeURIComponent).join("/")}`);
        url.searchParams.set("api-version", "7.1");
        for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
        while (true) {
          access.assertCurrent();
          if (signal.aborted) throw new RepositoryError("upstream_unavailable");
          let response;
          try {
            response = await request(url, {
              method: options.body === void 0 ? "GET" : "POST",
              headers: {
                Authorization: `Bearer ${access.accessToken}`,
                Accept: accept,
                ...options.body === void 0 ? {} : { "Content-Type": "application/json" }
              },
              body: options.body === void 0 ? void 0 : JSON.stringify(options.body),
              redirect: "error",
              signal: AbortSignal.any([signal, AbortSignal.timeout(1e4)])
            });
          } catch {
            access.assertCurrent();
            throw new RepositoryError("upstream_unavailable");
          }
          access.assertCurrent();
          if (response.ok) return response;
          await response.body?.cancel();
          if ([401, 403, 404].includes(response.status)) {
            throw new RepositoryError(options.personalization && response.status === 403 ? "insufficient_scope" : "resource_unavailable");
          }
          const header = response.headers.get("retry-after");
          const seconds = header && Number.isFinite(Number(header)) ? Math.max(1, Math.ceil(Number(header))) : header && Number.isFinite(Date.parse(header)) ? Math.max(1, Math.ceil((Date.parse(header) - Date.now()) / 1e3)) : 1;
          if (![429, 502, 503, 504].includes(response.status) || retries <= 0 || Date.now() + seconds * 1e3 >= expiresAt) {
            throw new RepositoryError(response.status === 429 ? "rate_limited" : "upstream_unavailable", seconds);
          }
          retries--;
          await pause(seconds * 1e3, signal).catch(() => {
            throw new RepositoryError("upstream_unavailable");
          });
        }
      }
      return {
        access,
        signal,
        async json(segments, query = {}, options = {}) {
          const response = await send(segments, query, options, "application/json");
          const payload = await readBoundedJson(response, options.maximumBytes ?? 25 * 1024 * 1024);
          access.assertCurrent();
          return record(payload);
        },
        async bytes(segments, query = {}, maximumBytes = 5242880) {
          const response = await send(segments, query, {}, "application/octet-stream");
          try {
            const bytes = await responseBytes(response, maximumBytes);
            access.assertCurrent();
            return bytes;
          } catch (error) {
            if (error instanceof RepositoryError) throw error;
            throw new RepositoryError("upstream_unavailable");
          }
        }
      };
    },
    async list(operation) {
      const payload = await operation.json([profile.project, "_apis", "git", "repositories"]);
      if (!Array.isArray(payload.value)) throw new RepositoryError("upstream_unavailable");
      return payload.value.filter((value) => !record(value).isDisabled).map((value) => repositorySummary(value, profile));
    },
    async repository(operation, id) {
      if (!UUID.test(id)) throw new RepositoryError("invalid_request");
      const raw = await operation.json([profile.project, "_apis", "git", "repositories", id]);
      if (raw.isDisabled) throw new RepositoryError("resource_unavailable");
      const result = repositorySummary(raw, profile);
      if (result.id !== id.toLowerCase()) throw new RepositoryError("resource_unavailable");
      return result;
    },
    async commit(operation, repository) {
      if (!repository.defaultBranch || repository.operationalState !== "active") return null;
      const raw = await operation.json([profile.project, "_apis", "git", "repositories", repository.id, "refs"], { filter: repository.defaultBranch.slice(5) });
      if (!Array.isArray(raw.value)) throw new RepositoryError("upstream_unavailable");
      const ref = raw.value.map(record).find((reference) => reference.name === repository.defaultBranch);
      return typeof ref?.objectId === "string" && COMMIT.test(ref.objectId) && !/^0+$/.test(ref.objectId) ? ref.objectId.toLowerCase() : null;
    },
    async item(operation, repositoryId, commit, path3) {
      if (!UUID.test(repositoryId) || !COMMIT.test(commit)) throw new RepositoryError("invalid_request");
      return operation.json([profile.project, "_apis", "git", "repositories", repositoryId, "items"], {
        path: path3,
        "versionDescriptor.versionType": "commit",
        "versionDescriptor.version": commit,
        includeContentMetadata: "true",
        resolveLfs: "false"
      });
    },
    async tree(operation, repositoryId, commit, path3) {
      if (!UUID.test(repositoryId) || !COMMIT.test(commit)) throw new RepositoryError("invalid_request");
      const raw = await operation.json([profile.project, "_apis", "git", "repositories", repositoryId, "items"], {
        scopePath: path3,
        recursionLevel: "Full",
        "versionDescriptor.versionType": "commit",
        "versionDescriptor.version": commit,
        includeContentMetadata: "true",
        resolveLfs: "false"
      });
      if (!Array.isArray(raw.value)) throw new RepositoryError("upstream_unavailable");
      return raw.value.map(record);
    },
    async blob(operation, repositoryId, objectId, maximumBytes = 5242880) {
      if (!UUID.test(repositoryId) || !COMMIT.test(objectId)) throw new RepositoryError("invalid_request");
      return operation.bytes([profile.project, "_apis", "git", "repositories", repositoryId, "blobs", objectId], { download: "true" }, maximumBytes);
    }
  };
  return api;
}
function repositorySummary(value, profile) {
  const raw = record(value);
  const project = record(raw.project);
  if (typeof raw.id !== "string" || !UUID.test(raw.id) || typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 256 || /[\p{Cc}\p{Cf}]/u.test(raw.name) || String(project.name).toLowerCase() !== profile.project.toLowerCase() && String(project.id).toLowerCase() !== profile.project.toLowerCase()) {
    throw new RepositoryError("resource_unavailable");
  }
  const defaultBranch = typeof raw.defaultBranch === "string" && raw.defaultBranch.startsWith("refs/heads/") && raw.defaultBranch.length <= 1024 && !/[\p{Cc}\p{Cf}]/u.test(raw.defaultBranch) ? raw.defaultBranch : null;
  return { id: raw.id.toLowerCase(), name: raw.name, defaultBranch, operationalState: raw.isInMaintenance ? "maintenance" : "active" };
}
async function readBoundedJson(response, maximumBytes) {
  if (!response.body || Number(response.headers.get("content-length")) > maximumBytes) throw new RepositoryError("upstream_unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > maximumBytes) {
        await reader.cancel();
        throw new RepositoryError("upstream_unavailable");
      }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RepositoryError("upstream_unavailable");
  } finally {
    reader.releaseLock();
  }
}
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RepositoryError("resource_unavailable");
  return value;
}

// src/artifact-clock.ts
import { createHash as createHash2 } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { realpath as realpath3 } from "node:fs/promises";
import { homedir as homedir4 } from "node:os";
import { isAbsolute as isAbsolute5, join as join4, relative as relative2, resolve as resolve4, sep as sep2 } from "node:path";

// src/clone.ts
import { createHash, randomBytes as randomBytes3, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { lstat as lstat3, mkdir as mkdir2, open as open2, readFile as readFile2, readdir, realpath as realpath2, rm, writeFile } from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import { delimiter, dirname as dirname3, isAbsolute as isAbsolute4, join as join3, relative, resolve as resolve3, sep } from "node:path";

// src/host-handoff.ts
import { randomBytes } from "node:crypto";
import { isAbsolute as isAbsolute2 } from "node:path";
function record2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function identifier2(value, maximum = 256) {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\p{Cc}\p{Cf}]/u.test(value);
}
function supportsRepositoryCloning(snapshot) {
  return snapshot.capabilities.checkedPreparation === true || snapshot.capabilities.atomicPreparation;
}
function supportsRemotePreparation(snapshot) {
  const capabilities = snapshot.capabilities;
  return capabilities.localCanvas && capabilities.atomicPreparation && capabilities.atomicHandoff && capabilities.targetAcknowledgment && capabilities.handoffReconciliation;
}
function createHostHandoffAdapter(options) {
  if (!identifier2(options.sessionId) || options.extensionId !== void 0 && !identifier2(options.extensionId)) throw new RepositoryError("invalid_context");
  const timeoutMs = options.timeoutMs ?? 5e3;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 5e3) throw new RepositoryError("invalid_request");
  const shutdown = new AbortController();
  const capabilities = Object.freeze({
    localCanvas: typeof options.canvas?.open === "function",
    checkedPreparation: typeof options.metadata.activity === "function",
    atomicPreparation: false,
    atomicHandoff: false,
    targetAcknowledgment: false,
    handoffReconciliation: false
  });
  const admittedPreparations = /* @__PURE__ */ new Set();
  const generation = randomBytes(24).toString("base64url");
  let epoch = 0;
  let activityEpoch = 0;
  let contextRevision = randomBytes(24).toString("base64url");
  let activityRevision = randomBytes(24).toString("base64url");
  let lastDirectory;
  let lastActivity;
  let readSequence = 0;
  let appliedSequence = 0;
  const unsubscribe = options.subscribeContextChanged?.(() => {
    epoch++;
    contextRevision = randomBytes(24).toString("base64url");
  });
  const unsubscribeActivity = options.subscribeActivityChanged?.(() => {
    activityEpoch++;
    activityRevision = randomBytes(24).toString("base64url");
  });
  async function bounded(operation, code, external) {
    if (shutdown.signal.aborted) throw new RepositoryError("invalid_context");
    const signal = external ? AbortSignal.any([shutdown.signal, external]) : shutdown.signal;
    if (signal.aborted) throw new RepositoryError("invalid_context");
    let timer;
    let onAbort = () => void 0;
    try {
      return await Promise.race([
        Promise.resolve().then(operation).catch(() => {
          throw new RepositoryError(code);
        }),
        new Promise((_resolve, reject) => {
          timer = setTimeout(() => reject(new RepositoryError(code)), timeoutMs);
          onAbort = () => reject(new RepositoryError("invalid_context"));
          signal.addEventListener("abort", onAbort, { once: true });
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }
  }
  async function inspectCurrent(signal) {
    const expectedEpoch = epoch;
    const expectedActivityEpoch = activityEpoch;
    const sequence = ++readSequence;
    const [rawSnapshot, rawActivity] = await Promise.all([
      bounded(() => options.metadata.snapshot(), "activity_unknown", signal),
      options.metadata.activity ? bounded(() => options.metadata.activity(), "activity_unknown", signal).catch(() => void 0) : void 0
    ]);
    if (shutdown.signal.aborted || signal?.aborted) throw new RepositoryError("invalid_context");
    if (expectedEpoch !== epoch || sequence < appliedSequence) throw new RepositoryError("context_changed");
    const snapshot = record2(rawSnapshot);
    if (snapshot.sessionId !== options.sessionId || !identifier2(snapshot.workingDirectory, 32768) || !isAbsolute2(snapshot.workingDirectory)) {
      throw new RepositoryError("context_changed");
    }
    if (lastDirectory !== void 0 && lastDirectory !== snapshot.workingDirectory) {
      epoch++;
      contextRevision = randomBytes(24).toString("base64url");
    }
    lastDirectory = snapshot.workingDirectory;
    appliedSequence = sequence;
    const activityFlags = record2(rawActivity);
    const activity = expectedActivityEpoch !== activityEpoch || typeof activityFlags.hasActiveWork !== "boolean" || typeof activityFlags.abortable !== "boolean" ? "unknown" : activityFlags.hasActiveWork || activityFlags.abortable ? "busy" : "idle";
    if (activity !== lastActivity) activityRevision = randomBytes(24).toString("base64url");
    lastActivity = activity;
    return {
      sessionId: options.sessionId,
      contextRevision,
      workingDirectory: snapshot.workingDirectory,
      activity,
      activityRevision,
      capabilityGeneration: generation,
      capabilities: { ...capabilities }
    };
  }
  function sameContext(expected, snapshot) {
    if (expected.sessionId !== snapshot.sessionId || expected.contextRevision !== snapshot.contextRevision) throw new RepositoryError("context_changed");
  }
  return {
    inspectCurrent,
    async openCurrentCanvas(expected, instanceId, signal) {
      if (!capabilities.localCanvas) throw new RepositoryError("canvas_unavailable");
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(instanceId)) throw new RepositoryError("invalid_request");
      const current = await inspectCurrent(signal);
      sameContext(expected, current);
      const result = record2(await bounded(() => options.canvas.open({
        ...options.extensionId ? { extensionId: options.extensionId } : {},
        canvasId: "sdd-canvas-direct",
        instanceId,
        input: {}
      }), "canvas_unavailable", signal));
      const verified = await inspectCurrent(signal);
      sameContext(current, verified);
      if (result.canvasId !== "sdd-canvas-direct" || result.instanceId !== instanceId || !identifier2(result.extensionId) || options.extensionId !== void 0 && result.extensionId !== options.extensionId) throw new RepositoryError("canvas_unavailable");
      return {
        sessionId: verified.sessionId,
        contextRevision: verified.contextRevision,
        workingDirectory: verified.workingDirectory,
        providerId: result.extensionId,
        instanceId
      };
    },
    async admitPreparation(input, start) {
      if (!/^[a-f0-9]{32}$/.test(input.operationId)) throw new RepositoryError("invalid_request");
      if (!capabilities.checkedPreparation) throw new RepositoryError("activity_unknown");
      if (input.capabilityGeneration !== generation) throw new RepositoryError("context_changed");
      const current = await inspectCurrent();
      sameContext(input.expectedSource, current);
      if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
      if (input.activityRevision !== void 0 && input.activityRevision !== current.activityRevision) throw new RepositoryError("context_changed");
      if (admittedPreparations.has(input.operationId) || admittedPreparations.size >= 32) throw new RepositoryError("clone_conflict");
      admittedPreparations.add(input.operationId);
      return start();
    },
    async handoffPrepared() {
      throw new RepositoryError("host_handoff_unsupported");
    },
    async getHandoffOutcome() {
      throw new RepositoryError("host_handoff_unsupported");
    },
    dispose() {
      shutdown.abort();
      unsubscribe?.();
      unsubscribeActivity?.();
    }
  };
}
async function executeHostHandoff({ host, request, outcome, persistActivation, readReadiness, timeoutMs = 3e4 }) {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 3e4 || request.canvasId !== "sdd-canvas-direct") throw new RepositoryError("invalid_request");
  const deadline = new AbortController();
  let timer;
  const matchesActivation = (activation, current) => current.sessionId === activation.sessionId && current.contextRevision === activation.contextRevision && current.workingDirectory === activation.workingDirectory;
  const verifyReady = (ready, activation) => {
    if (ready.instanceId !== request.instanceId || !identifier2(ready.providerId) || ready.attemptId !== request.attemptId || ready.sessionId !== activation.sessionId || ready.contextRevision !== activation.contextRevision || ready.workingDirectory !== activation.workingDirectory || ready.targetKind !== activation.targetKind || ready.targetBranch !== activation.targetBranch) throw new RepositoryError("clone_identity_changed");
    return { status: "canvas_ready", activation, result: ready };
  };
  const execute = async () => {
    const received = outcome ?? await host.handoffPrepared(request);
    if (!["workspace_activated", "canvas_ready"].includes(received.status)) return received;
    const activation = received.activation;
    if (!activation || activation.attemptId !== request.attemptId || !identifier2(activation.sessionId) || !identifier2(activation.contextRevision) || !identifier2(activation.workingDirectory, 32768) || !isAbsolute2(activation.workingDirectory) || !["prepared_checkout", "host_worktree"].includes(activation.targetKind) || !activation.targetBranch.startsWith("refs/heads/")) throw new RepositoryError("clone_identity_changed");
    await persistActivation(activation);
    if (deadline.signal.aborted) throw new RepositoryError("handoff_unknown");
    const current = await host.inspectCurrent(deadline.signal);
    if (!matchesActivation(activation, current)) throw new RepositoryError("context_changed");
    if (!supportsRemotePreparation(current)) throw new RepositoryError("host_handoff_unsupported");
    const existing = await readReadiness();
    if (existing) return verifyReady(existing, activation);
    if (current.activity !== "idle") throw new RepositoryError(current.activity === "busy" ? "session_busy" : "activity_unknown");
    const opened = await host.openCurrentCanvas(activation, request.instanceId, deadline.signal);
    if (deadline.signal.aborted) throw new RepositoryError("handoff_unknown");
    if (opened.sessionId !== activation.sessionId || opened.contextRevision !== activation.contextRevision || opened.workingDirectory !== activation.workingDirectory || opened.instanceId !== request.instanceId) throw new RepositoryError("context_changed");
    const ready = await readReadiness();
    if (!ready) throw new RepositoryError("canvas_unavailable");
    if (ready.providerId !== opened.providerId) throw new RepositoryError("canvas_unavailable");
    return verifyReady(ready, activation);
  };
  try {
    return await Promise.race([execute(), new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        deadline.abort();
        reject(new RepositoryError("handoff_unknown"));
      }, timeoutMs);
    })]);
  } catch (error) {
    throw knownRepositoryError(error?.code);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// src/preparation-store.ts
var import_yaml2 = __toESM(require_dist(), 1);
import { constants } from "node:fs";
import { link, lstat as lstat2, mkdir, open, opendir, realpath, rename, unlink } from "node:fs/promises";
import { randomBytes as randomBytes2 } from "node:crypto";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname2, isAbsolute as isAbsolute3, join as join2, resolve as resolve2 } from "node:path";
var operationPattern = /^[a-f0-9]{32}$/;
var digestPattern = /^[a-f0-9]{64}$/;
var commitPattern = /^[a-f0-9]{40}$/;
var repositoryPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
var fields = [
  "schemaVersion",
  "kind",
  "operationId",
  "repositoryId",
  "originIdentity",
  "defaultRef",
  "sourceCommit",
  "destination",
  "gitCommonDirectory",
  "branch",
  "initialWorktreeFingerprint",
  "profileFingerprint",
  "accountKey",
  "createdAt",
  "completedAt"
];
function invalid() {
  throw new RepositoryError("invalid_context");
}
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value;
}
function safeText(value, maximum = 4096) {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\p{Cc}\p{Cf}]/u.test(value);
}
function namedRef(value) {
  return safeText(value, 1024) && value.startsWith("refs/heads/") && !/[ ~^:?*\[\\]|\.\.|@\{|\/\//.test(value) && value.split("/").every((part) => part && !part.startsWith(".") && !part.endsWith(".") && !part.endsWith(".lock"));
}
function origin(value, repositoryId) {
  if (!safeText(value) || !safeText(repositoryId, 64)) return false;
  try {
    const url = new URL(value);
    return url.origin === "https://dev.azure.com" && !url.username && !url.password && !url.search && !url.hash && url.pathname.split("/").length === 5 && url.pathname.endsWith(`/_git/${repositoryId}`);
  } catch {
    return false;
  }
}
var activationFields = ["attemptId", "sessionId", "contextRevision", "workingDirectory", "targetKind", "targetBranch"];
function validateActivation(input, attemptId, ready = false) {
  const value = object(input);
  const allowed = ready ? [...activationFields, "providerId", "instanceId"] : activationFields;
  if (Object.keys(value).length !== allowed.length || allowed.some((field) => !Object.hasOwn(value, field)) || value.attemptId !== attemptId || !safeText(value.sessionId, 256) || !safeText(value.contextRevision, 256) || !safeText(value.workingDirectory) || !isAbsolute3(value.workingDirectory) || !["prepared_checkout", "host_worktree"].includes(String(value.targetKind)) || !namedRef(value.targetBranch) || ready && (!safeText(value.providerId, 256) || !safeText(value.instanceId, 256))) return invalid();
  return value;
}
function validateAttempt(input, operationId) {
  const value = object(input);
  const required = ["attemptId", "operationId", "expectedSource", "instanceId", "status", "createdAt"];
  if (required.some((field) => !Object.hasOwn(value, field)) || Object.keys(value).some((field) => ![...required, "activation", "result", "errorCode"].includes(field)) || !safeText(value.attemptId, 32) || !operationPattern.test(value.attemptId) || value.operationId !== operationId || !safeText(value.instanceId, 256) || !["requested", "in_progress", "workspace_activated", "canvas_ready", "rejected", "unknown"].includes(String(value.status)) || !Number.isSafeInteger(value.createdAt) || Number(value.createdAt) < 0 || value.errorCode !== void 0 && knownRepositoryError(value.errorCode).code !== value.errorCode) return invalid();
  const source = object(value.expectedSource);
  if (Object.keys(source).length !== 2 || !safeText(source.sessionId, 256) || !safeText(source.contextRevision, 256)) return invalid();
  if (value.activation !== void 0) validateActivation(value.activation, value.attemptId);
  if (value.result !== void 0) {
    const result = validateActivation(value.result, value.attemptId, true);
    const activation = object(value.activation);
    if (result.instanceId !== value.instanceId || activationFields.some((field) => Reflect.get(result, field) !== activation[field])) return invalid();
  }
  if (["workspace_activated", "canvas_ready"].includes(String(value.status)) && !value.activation) return invalid();
  if (value.status === "canvas_ready" !== Boolean(value.result)) return invalid();
  return structuredClone(value);
}
async function regularPath(path3, directory) {
  if (!safeText(path3) || !isAbsolute3(path3)) return invalid();
  const resolved = resolve2(path3);
  let current = resolved;
  for (; ; ) {
    const info = await lstat2(current);
    if (info.isSymbolicLink() || (current !== resolved || directory ? !info.isDirectory() : !info.isFile())) return invalid();
    if (dirname2(current) === current) break;
    current = dirname2(current);
  }
  return realpath(resolved);
}
async function boundedJson(path3, maximum) {
  await regularPath(path3, false);
  const before = await lstat2(path3);
  if (before.size > maximum) return invalid();
  const handle = await open(path3, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) return invalid();
    const bytes = Buffer.alloc(maximum + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = await handle.read(bytes, count, bytes.length - count, count);
      if (!read.bytesRead) break;
      count += read.bytesRead;
    }
    const after = await handle.stat();
    if (count > maximum || count !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) return invalid();
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, count));
    const value = object(JSON.parse(raw));
    if ((0, import_yaml2.parseDocument)(raw, { schema: "json", uniqueKeys: true }).errors.length) return invalid();
    return value;
  } finally {
    await handle.close();
  }
}
function validateRecord(input) {
  const value = object(input);
  if (Object.keys(value).some((field) => ![...fields, "handoff", "acceptedTarget"].includes(field)) || fields.some((field) => !Object.hasOwn(value, field))) return invalid();
  if (value.schemaVersion !== 2 || value.kind !== "sdd-prepared-repository" || !safeText(value.operationId, 32) || !operationPattern.test(value.operationId) || !safeText(value.repositoryId, 36) || !repositoryPattern.test(value.repositoryId) || !origin(value.originIdentity, value.repositoryId) || !safeText(value.sourceCommit, 40) || !commitPattern.test(value.sourceCommit) || !namedRef(value.defaultRef) || value.branch !== `refs/heads/speckit/canvas-${value.operationId}` || ![value.initialWorktreeFingerprint, value.profileFingerprint, value.accountKey].every((item) => safeText(item, 64) && digestPattern.test(item)) || ![value.createdAt, value.completedAt].every((time) => Number.isSafeInteger(time) && Number(time) >= 0) || Number(value.completedAt) < Number(value.createdAt) || !safeText(value.destination) || !safeText(value.gitCommonDirectory)) return invalid();
  const handoff = value.handoff === void 0 ? void 0 : validateAttempt(value.handoff, value.operationId);
  if (handoff && handoff.createdAt < Number(value.completedAt)) return invalid();
  if (handoff?.status === "canvas_ready" !== Boolean(value.acceptedTarget)) return invalid();
  if (value.acceptedTarget !== void 0 && JSON.stringify(value.acceptedTarget) !== JSON.stringify(handoff?.result)) return invalid();
  if (Buffer.byteLength(JSON.stringify(value)) > 8192) return invalid();
  return structuredClone(value);
}
function createPreparationStore({ homeDirectory = homedir2() } = {}) {
  async function home() {
    return regularPath(homeDirectory, true);
  }
  async function directory(create = false) {
    let path3 = await home();
    for (const name3 of [".speckit-canvas", "preparations"]) {
      path3 = join2(path3, name3);
      if (create) {
        try {
          await mkdir(path3, { mode: 448 });
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
      }
      await regularPath(path3, true);
    }
    return path3;
  }
  async function ownership(operationId, destination, gitCommonDirectory) {
    const root = join2(await home(), "SpecKitCanvas", "repositories", operationId);
    if (destination !== join2(root, "checkout") || gitCommonDirectory !== join2(destination, ".git")) return invalid();
    if (await regularPath(destination, true) !== destination || await regularPath(gitCommonDirectory, true) !== gitCommonDirectory) return invalid();
    const marker = await boundedJson(join2(root, ".sdd-clone-owner.json"), 1024);
    if (Object.keys(marker).length !== 2 || marker.kind !== "sdd-repository-clone" || marker.operationId !== operationId) return invalid();
  }
  async function read(operationId) {
    if (!operationPattern.test(operationId)) return invalid();
    try {
      const record3 = validateRecord(await boundedJson(join2(await directory(), `${operationId}.json`), 8192));
      if (record3.operationId !== operationId) return invalid();
      await ownership(record3.operationId, record3.destination, record3.gitCommonDirectory);
      return record3;
    } catch {
      return invalid();
    }
  }
  async function change(operationId, update) {
    if (!operationPattern.test(operationId)) return invalid();
    const parent = await directory();
    const lockPath = join2(parent, `.${operationId}.lock`);
    const lock = await open(lockPath, "wx", 384).catch((error) => {
      if (error.code === "EEXIST") throw new RepositoryError("handoff_in_progress");
      return invalid();
    });
    let temporary;
    try {
      const previous = await read(operationId);
      const next = validateRecord(update(structuredClone(previous)));
      if (fields.some((field) => Reflect.get(next, field) !== Reflect.get(previous, field))) return invalid();
      if (JSON.stringify(next) === JSON.stringify(previous)) return previous;
      temporary = join2(parent, `.${operationId}-${randomBytes2(12).toString("hex")}.tmp`);
      const handle = await open(temporary, "wx", 384);
      try {
        await handle.writeFile(JSON.stringify(next));
        await handle.sync();
      } finally {
        await handle.close();
      }
      await regularPath(parent, true);
      if (JSON.stringify(await read(operationId)) !== JSON.stringify(previous)) throw new RepositoryError("handoff_in_progress");
      await rename(temporary, join2(parent, `${operationId}.json`));
      temporary = void 0;
      return next;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      return invalid();
    } finally {
      if (temporary) await unlink(temporary).catch(() => void 0);
      await lock.close();
      await unlink(lockPath).catch(() => void 0);
    }
  }
  const store = {
    read,
    async verifyOwnership(input) {
      try {
        const record3 = validateRecord(input);
        await ownership(record3.operationId, record3.destination, record3.gitCommonDirectory);
        return record3;
      } catch {
        return invalid();
      }
    },
    async beginAttempt(operationId, input) {
      const attempt = validateAttempt(input, operationId);
      if (attempt.status !== "requested" || attempt.activation || attempt.result || attempt.errorCode) return invalid();
      return change(operationId, (record3) => {
        if (record3.handoff?.attemptId === attempt.attemptId) {
          if (["operationId", "instanceId", "createdAt"].some((field) => Reflect.get(record3.handoff, field) !== Reflect.get(attempt, field)) || JSON.stringify(record3.handoff.expectedSource) !== JSON.stringify(attempt.expectedSource)) return invalid();
          return record3;
        }
        if (record3.acceptedTarget || record3.handoff && (record3.handoff.status !== "rejected" || record3.handoff.activation)) throw new RepositoryError("handoff_in_progress");
        return { ...record3, handoff: attempt };
      });
    },
    async updateAttempt(operationId, input) {
      const incoming = validateAttempt(input, operationId);
      return change(operationId, (record3) => {
        const previous = record3.handoff;
        if (!previous || ["attemptId", "operationId", "instanceId", "createdAt"].some((field) => Reflect.get(incoming, field) !== Reflect.get(previous, field)) || JSON.stringify(incoming.expectedSource) !== JSON.stringify(previous.expectedSource)) return invalid();
        if (previous.status === "canvas_ready") {
          if (incoming.status !== "canvas_ready" || JSON.stringify(incoming.result) !== JSON.stringify(previous.result)) return invalid();
          return record3;
        }
        if (incoming.status === "requested") return invalid();
        if (incoming.status === "canvas_ready" && !previous.activation) return invalid();
        if (previous.activation && incoming.activation && JSON.stringify(previous.activation) !== JSON.stringify(incoming.activation)) return invalid();
        if (previous.activation && incoming.status === "rejected") return invalid();
        const next = { ...incoming, ...previous.activation ? { activation: previous.activation } : {} };
        if (previous.activation && ["unknown", "in_progress"].includes(next.status)) next.status = "workspace_activated";
        if (next.status === "canvas_ready") delete next.errorCode;
        return { ...record3, handoff: next, ...next.result ? { acceptedTarget: next.result } : {} };
      });
    },
    async write(input) {
      let temporary;
      try {
        const record3 = validateRecord(input);
        if (record3.handoff || record3.acceptedTarget) return invalid();
        await ownership(record3.operationId, record3.destination, record3.gitCommonDirectory);
        const parent = await directory(true);
        const filename = join2(parent, `${record3.operationId}.json`);
        try {
          await lstat2(filename);
          if (JSON.stringify(await read(record3.operationId)) !== JSON.stringify(record3)) return invalid();
          return;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        temporary = join2(parent, `.${record3.operationId}-${randomBytes2(12).toString("hex")}.tmp`);
        const handle = await open(temporary, "wx", 384);
        try {
          await handle.writeFile(JSON.stringify(record3));
          await handle.sync();
        } finally {
          await handle.close();
        }
        await regularPath(parent, true);
        try {
          await link(temporary, filename);
        } catch (error) {
          if (error.code !== "EEXIST" || JSON.stringify(await read(record3.operationId)) !== JSON.stringify(record3)) throw error;
        }
      } catch {
        return invalid();
      } finally {
        if (temporary) await unlink(temporary).catch(() => void 0);
      }
    },
    async list() {
      const items = [];
      let inspected = 0;
      let hasMore = false;
      try {
        const parent = await directory();
        for await (const entry of await opendir(parent)) {
          if (inspected >= 256) {
            hasMore = true;
            break;
          }
          inspected++;
          if (!/^[a-f0-9]{32}\.json$/.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) continue;
          const operationId = entry.name.slice(0, -5);
          try {
            const input = await boundedJson(join2(parent, entry.name), 8192);
            if (input.schemaVersion === 2) {
              const record3 = await read(operationId);
              items.push({ operationId, destination: record3.destination, legacy: false, actionable: false, record: record3 });
            } else if (input.schemaVersion === 1) {
              const legacy = await boundedJson(join2(parent, entry.name), 4096);
              const legacyFields = ["schemaVersion", "operationId", "kind", "gitDirectory", "checkout", "remote", "repositoryId", "initialCommit", "initialBranch", "createdAt"];
              if (Object.keys(legacy).length !== legacyFields.length || legacyFields.some((field) => !Object.hasOwn(legacy, field)) || legacy.operationId !== operationId || legacy.kind !== "sdd-prepared-repository" || !origin(legacy.remote, legacy.repositoryId) || !safeText(legacy.initialCommit, 40) || !commitPattern.test(legacy.initialCommit) || legacy.initialBranch !== `speckit/canvas-${operationId}` || !safeText(legacy.createdAt, 64) || !Number.isFinite(Date.parse(legacy.createdAt)) || !safeText(legacy.checkout) || !safeText(legacy.gitDirectory)) continue;
              await ownership(operationId, legacy.checkout, legacy.gitDirectory);
              items.push({ operationId, destination: legacy.checkout, legacy: true, actionable: false });
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        if (error.code !== "ENOENT") return invalid();
      }
      return { items, inspected, hasMore };
    }
  };
  return store;
}

// src/clone.ts
var COMMIT2 = /^[a-f0-9]{40}$/;
var operationIdPattern = /^[a-f0-9]{32}$/;
var digest = (value) => createHash("sha256").update(value).digest("hex");
var sameSecret = (value, expected) => typeof value === "string" && value.length <= 256 && timingSafeEqual(Buffer.from(digest(value), "hex"), Buffer.from(expected, "hex"));
async function fingerprintCheckout(checkout, signal) {
  const root = await realpath2(checkout);
  if ((await lstat3(checkout)).isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
  const queue = [root];
  const files = [];
  let count = 0;
  while (queue.length) {
    if (signal.aborted) throw new RepositoryError("clone_cancelled");
    const directory = queue.pop();
    if ((await lstat3(directory)).isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (directory === root && entry.name === ".git") continue;
      if (++count > 1e5 || entry.isSymbolicLink()) throw new RepositoryError("clone_identity_changed");
      const path3 = join3(directory, entry.name);
      if (entry.isDirectory()) queue.push(path3);
      else if (entry.isFile()) files.push(path3);
      else throw new RepositoryError("clone_identity_changed");
    }
  }
  const hash = createHash("sha256");
  for (const path3 of files.sort()) {
    if (signal.aborted) throw new RepositoryError("clone_cancelled");
    const before = await lstat3(path3);
    if (!before.isFile() || before.isSymbolicLink() || await realpath2(path3) !== path3) throw new RepositoryError("clone_identity_changed");
    const handle = await open2(path3, "r");
    const content = createHash("sha256");
    try {
      const opened = await handle.stat();
      if (!opened.isFile() || opened.ino !== before.ino || opened.dev !== before.dev) throw new RepositoryError("clone_identity_changed");
      const buffer = Buffer.alloc(65536);
      let position = 0;
      for (; ; ) {
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        const result = await handle.read(buffer, 0, buffer.length, position);
        if (!result.bytesRead) break;
        content.update(buffer.subarray(0, result.bytesRead));
        position += result.bytesRead;
      }
      const after = await handle.stat();
      if (position !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new RepositoryError("clone_identity_changed");
    } finally {
      await handle.close();
    }
    hash.update(relative(root, path3).split(sep).join("/"));
    hash.update("\0");
    hash.update(String(before.mode & 73));
    hash.update("\0");
    hash.update(content.digest());
  }
  return hash.digest("hex");
}
async function runGit({ executable, args, cwd, env, signal }) {
  if (signal.aborted) throw new RepositoryError("clone_cancelled");
  return new Promise((resolveResult, reject) => {
    const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
    const chunks = [];
    let bytes = 0;
    let excessive = false;
    let settled = false;
    let spawnFailed = false;
    let terminating = false;
    let termination = Promise.resolve();
    const terminate = () => {
      if (terminating || !child.pid || child.exitCode !== null) return;
      terminating = true;
      if (process.platform === "win32") {
        const systemRoot = env.SystemRoot ?? env.SYSTEMROOT ?? process.env.SystemRoot ?? process.env.SYSTEMROOT;
        if (!systemRoot || !isAbsolute4(systemRoot)) {
          child.kill("SIGTERM");
          return;
        }
        termination = new Promise((resolveTermination) => {
          const killer = spawn(
            join3(systemRoot, "System32", "taskkill.exe"),
            ["/PID", String(child.pid), "/T", "/F"],
            { windowsHide: true, shell: false, stdio: "ignore" }
          );
          killer.once("error", () => {
            child.kill("SIGTERM");
            resolveTermination();
          });
          killer.once("close", () => resolveTermination());
        });
      } else {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
      }
    };
    const finish = (failure) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", terminate);
      if (failure) reject(failure);
      else resolveResult(Buffer.concat(chunks).toString("utf8").trim());
    };
    child.stdout.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 1048576) {
        excessive = true;
        terminate();
      } else chunks.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 1048576) {
        excessive = true;
        terminate();
      }
    });
    child.once("error", () => {
      spawnFailed = true;
      if (!child.pid) finish(new RepositoryError("clone_conflict"));
    });
    child.once("close", (code) => {
      void termination.then(() => finish(signal.aborted ? new RepositoryError("clone_cancelled") : code !== 0 || excessive || spawnFailed ? new RepositoryError("clone_conflict") : void 0));
    });
    signal.addEventListener("abort", terminate, { once: true });
    if (signal.aborted) terminate();
  });
}
function inside(root, target) {
  const path3 = relative(root, target);
  return path3 !== ".." && !path3.startsWith(`..${sep}`) && !isAbsolute4(path3);
}
async function findGitExecutable(workspacePath, environment = process.env) {
  const filename = process.platform === "win32" ? "git.exe" : "git";
  for (const directory of (environment.PATH ?? environment.Path ?? "").split(delimiter)) {
    if (!directory || !isAbsolute4(directory) || inside(resolve3(workspacePath), resolve3(directory))) continue;
    const candidate = join3(directory, filename);
    try {
      const info = await lstat3(candidate);
      if (info.isFile() && !info.isSymbolicLink()) return await realpath2(candidate);
    } catch {
      continue;
    }
  }
  throw new RepositoryError("clone_conflict");
}
function cloneEnvironment({ token, remote, home, emptyFile, signalEnvironment = process.env }) {
  const env = {};
  const allow = /* @__PURE__ */ new Set(["path", "pathext", "systemroot", "windir", "comspec", "temp", "tmp"]);
  for (const [name3, value] of Object.entries(signalEnvironment)) if (allow.has(name3.toLowerCase())) env[name3] = value;
  Object.assign(env, {
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: home,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: emptyFile,
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "never",
    GIT_LFS_SKIP_SMUDGE: "1",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: `http.${remote}.extraHeader`,
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: bearer ${token}`
  });
  return env;
}
async function ensureParents(path3) {
  const parents = [];
  for (let current = resolve3(path3); ; current = dirname3(current)) {
    parents.push(current);
    if (dirname3(current) === current) break;
  }
  for (const parent of parents.reverse()) {
    try {
      const info = await lstat3(parent);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new RepositoryError("clone_conflict");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir2(parent);
    }
  }
}
async function removeOwnedStage(root, operationId) {
  try {
    const marker = JSON.parse(await readFile2(join3(root, ".sdd-clone-owner.json"), "utf8"));
    if (marker.operationId !== operationId || marker.kind !== "sdd-repository-clone") return;
    const children = await readdir(root, { withFileTypes: true });
    if (children.some((child) => ![".sdd-clone-owner.json", "config", "checkout"].includes(child.name) || child.isSymbolicLink())) return;
    const queue = [root];
    let count = 0;
    while (queue.length) {
      const directory = queue.pop();
      if ((await lstat3(directory)).isSymbolicLink()) return;
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (++count > 1e5 || entry.isSymbolicLink()) return;
        if (entry.isDirectory()) queue.push(join3(directory, entry.name));
        else if (!entry.isFile()) return;
      }
    }
    await rm(root, { recursive: true });
  } catch {
    return;
  }
}
function createCloneService({
  readSource,
  connection,
  profile,
  workspacePath,
  homeDirectory = homedir3(),
  runner = runGit,
  executable,
  onPrepared,
  onChange = () => void 0,
  now = Date.now
}) {
  const operations = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Set();
  let active;
  let disposed = false;
  const identity2 = (access) => JSON.stringify([access.tenantId, access.accountId, access.connectionId, access.generation]);
  function update(operation, state, error) {
    operation.public = { ...operation.public, state, ...error ? { error } : {} };
    try {
      onChange();
    } catch {
      return;
    }
  }
  async function prepare(operation) {
    const controller = operation.controller;
    const deadline = AbortSignal.timeout(6e5);
    let environment;
    try {
      const source = await readSource(operation.contextId);
      const access = await connection.access();
      if (disposed || operation.account !== identity2(access) || source.sourceVersion !== operation.source.sourceVersion || source.repository.id !== operation.source.repository.id || source.repository.defaultBranch !== operation.source.repository.defaultBranch) throw new RepositoryError("invalid_context");
      access.assertCurrent();
      const signal = AbortSignal.any([controller.signal, access.signal, deadline]);
      if (signal.aborted) throw new RepositoryError("clone_cancelled");
      const git = executable ?? await findGitExecutable(workspacePath);
      if (!isAbsolute4(git)) throw new RepositoryError("clone_conflict");
      const canonicalHome = await realpath2(homeDirectory);
      const parent = join3(canonicalHome, "SpecKitCanvas", "repositories");
      await ensureParents(parent);
      const root = join3(parent, operation.public.operationId);
      await mkdir2(root);
      operation.root = root;
      await writeFile(join3(root, ".sdd-clone-owner.json"), JSON.stringify({ kind: "sdd-repository-clone", operationId: operation.public.operationId }), { flag: "wx" });
      const config = join3(root, "config");
      await mkdir2(config);
      const hooks = join3(config, "hooks");
      await mkdir2(hooks);
      const emptyFile = join3(config, "empty");
      await writeFile(emptyFile, "", { flag: "wx" });
      const remote = `https://dev.azure.com/${[profile.organization, profile.project, "_git", source.repository.id].map(encodeURIComponent).join("/")}`;
      environment = cloneEnvironment({ token: access.accessToken, remote, home: config, emptyFile });
      const policy = [
        "-c",
        "credential.helper=",
        "-c",
        "credential.interactive=false",
        "-c",
        `core.hooksPath=${hooks}`,
        "-c",
        `core.attributesFile=${emptyFile}`,
        "-c",
        `init.templateDir=${hooks}`,
        "-c",
        "protocol.allow=never",
        "-c",
        "protocol.https.allow=always",
        "-c",
        "http.followRedirects=false",
        "-c",
        "core.symlinks=false",
        "-c",
        "submodule.recurse=false",
        "-c",
        "gc.auto=0"
      ];
      const gitCommand = async (args, cwd = root) => {
        access.assertCurrent();
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        return runner({ executable: git, args: [...policy, ...args], cwd, env: environment, signal });
      };
      update(operation, "preparing");
      await gitCommand(["clone", "--no-checkout", "--no-recurse-submodules", "--single-branch", "--branch", source.repository.defaultBranch.slice(11), "--", remote, operation.public.destination]);
      update(operation, "verifying");
      try {
        await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination);
      } catch {
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        await gitCommand(["fetch", "--no-tags", "--no-recurse-submodules", "origin", source.sourceVersion], operation.public.destination);
        await gitCommand(["cat-file", "-e", `${source.sourceVersion}^{commit}`], operation.public.destination);
      }
      await gitCommand(["checkout", "--no-recurse-submodules", "-b", operation.public.localBranch, source.sourceVersion, "--"], operation.public.destination);
      const head = await gitCommand(["rev-parse", "HEAD"], operation.public.destination);
      const origin2 = await gitCommand(["remote", "get-url", "origin"], operation.public.destination);
      const branch = await gitCommand(["symbolic-ref", "--short", "HEAD"], operation.public.destination);
      if (head !== source.sourceVersion || origin2 !== remote || branch !== operation.public.localBranch) throw new RepositoryError("clone_conflict");
      const common = await gitCommand(["rev-parse", "--path-format=absolute", "--git-common-dir"], operation.public.destination);
      const gitDirectory = await realpath2(common);
      if (!inside(root, gitDirectory)) throw new RepositoryError("clone_conflict");
      access.assertCurrent();
      if (signal.aborted) throw new RepositoryError("clone_cancelled");
      if (onPrepared) {
        if (await gitCommand(["status", "--porcelain=v1", "--untracked-files=all"], operation.public.destination)) throw new RepositoryError("clone_identity_changed");
        const initialWorktreeFingerprint = await fingerprintCheckout(operation.public.destination, signal);
        access.assertCurrent();
        if (signal.aborted) throw new RepositoryError("clone_cancelled");
        await onPrepared({
          operationId: operation.public.operationId,
          repositoryId: source.repository.id,
          originIdentity: remote,
          defaultRef: source.repository.defaultBranch,
          sourceCommit: head,
          destination: await realpath2(operation.public.destination),
          gitCommonDirectory: gitDirectory,
          branch: `refs/heads/${branch}`,
          initialWorktreeFingerprint
        });
      } else {
        const metadataDirectory = join3(canonicalHome, ".speckit-canvas", "preparations");
        await ensureParents(metadataDirectory);
        await writeFile(join3(metadataDirectory, `${operation.public.operationId}.json`), JSON.stringify({
          schemaVersion: 1,
          operationId: operation.public.operationId,
          kind: "sdd-prepared-repository",
          gitDirectory,
          checkout: operation.public.destination,
          remote,
          repositoryId: source.repository.id,
          initialCommit: head,
          initialBranch: branch,
          createdAt: new Date(now()).toISOString()
        }), { flag: "wx" });
      }
      operation.durable = true;
      update(operation, onPrepared ? "prepared" : "prepared_for_manual_open");
    } catch (error) {
      const cancelled = controller.signal.aborted || deadline.aborted || error?.code === "clone_cancelled";
      update(operation, cancelled ? "cancelled" : "failed", cancelled ? "clone_cancelled" : "clone_conflict");
      if (operation.root && !operation.durable) await removeOwnedStage(operation.root, operation.public.operationId);
    } finally {
      if (environment) {
        delete environment.GIT_CONFIG_VALUE_0;
        delete environment.GIT_CONFIG_KEY_0;
      }
      if (active === operation) active = void 0;
    }
  }
  return {
    async confirm(contextId) {
      if (disposed || active) throw new RepositoryError("clone_conflict");
      const source = await readSource(contextId);
      if (!COMMIT2.test(source.sourceVersion) || !source.repository.defaultBranch || source.repository.operationalState !== "active") throw new RepositoryError("source_unavailable");
      const access = await connection.access();
      if (source.generation !== access.generation) throw new RepositoryError("invalid_context");
      const canonicalHome = await realpath2(homeDirectory);
      const operationId = randomBytes3(16).toString("hex");
      const confirmation = randomBytes3(32).toString("base64url");
      const state = {
        operationId,
        state: "awaiting_confirmation",
        repositoryName: source.repository.name,
        sourceCommit: source.sourceVersion,
        branch: source.repository.defaultBranch,
        localBranch: `speckit/canvas-${operationId}`,
        destination: join3(canonicalHome, "SpecKitCanvas", "repositories", operationId, "checkout")
      };
      for (const [key, operation] of operations) if (!operation.completion && operation.expiresAt <= now()) operations.delete(key);
      if (operations.size >= 32) throw new RepositoryError("clone_conflict");
      operations.set(operationId, { public: state, source, contextId, confirmation: digest(confirmation), account: identity2(access), expiresAt: now() + 12e4 });
      return { ...state, confirmation, accountLabel: connection.snapshot().accountLabel ?? "Microsoft account" };
    },
    async start(operationId, confirmation) {
      if (disposed || !operationIdPattern.test(operationId)) throw new RepositoryError("clone_conflict");
      const operation = operations.get(operationId);
      if (!operation || !sameSecret(confirmation, operation.confirmation)) throw new RepositoryError("clone_conflict");
      const access = await connection.access();
      if (operation.account !== identity2(access)) throw new RepositoryError("invalid_context");
      if (operation.completion) return { ...operation.public };
      if (operation.public.state === "cancelled") throw new RepositoryError("clone_cancelled");
      if (active || operation.expiresAt <= now()) throw new RepositoryError("clone_conflict");
      operation.controller = new AbortController();
      active = operation;
      update(operation, "preparing");
      operation.completion = prepare(operation);
      pending.add(operation.completion);
      void operation.completion.finally(() => pending.delete(operation.completion));
      return { ...operation.public };
    },
    status(operationId) {
      const operation = operations.get(operationId);
      if (!operation) throw new RepositoryError("invalid_context");
      return { ...operation.public };
    },
    async completion(operationId) {
      await operations.get(operationId)?.completion;
    },
    async settled() {
      await Promise.all(pending);
    },
    cancel(operationId) {
      const operation = operations.get(operationId);
      if (!operation) throw new RepositoryError("invalid_context");
      if (operation.durable) return;
      operation.controller?.abort();
      if (!operation.completion) update(operation, "cancelled", "clone_cancelled");
    },
    clear() {
      active?.controller?.abort();
      operations.clear();
    },
    dispose() {
      disposed = true;
      active?.controller?.abort();
      operations.clear();
    }
  };
}
function createEntryCloneService({ host, readSource, connection, profile, workspacePath, homeDirectory = homedir3(), now = Date.now, ...options }) {
  const consents = /* @__PURE__ */ new Map();
  const store = createPreparationStore({ homeDirectory });
  const profileFingerprint = digest(JSON.stringify(profile));
  let disposed = false;
  let starting;
  const identity2 = (access) => JSON.stringify([access.tenantId, access.accountId, access.connectionId, access.generation]);
  const accountKey = (access) => digest(JSON.stringify([access.tenantId, access.accountId]));
  function guard(snapshot, expected) {
    if (disposed) throw new RepositoryError("invalid_context");
    if (!supportsRepositoryCloning(snapshot)) throw new RepositoryError("activity_unknown");
    if (snapshot.activity !== "idle") throw new RepositoryError(snapshot.activity === "busy" ? "session_busy" : "activity_unknown");
    if (snapshot.sessionId !== expected.sessionId || snapshot.contextRevision !== expected.contextRevision || snapshot.workingDirectory !== expected.workingDirectory || snapshot.capabilityGeneration !== expected.capabilityGeneration || snapshot.activityRevision !== expected.activityRevision) throw new RepositoryError("context_changed");
  }
  const core = createCloneService({
    ...options,
    readSource,
    connection,
    profile,
    workspacePath,
    homeDirectory,
    now,
    onPrepared: async (target) => {
      const consent = consents.get(target.operationId);
      if (!consent) throw new RepositoryError("invalid_context");
      await store.write({
        ...target,
        schemaVersion: 2,
        kind: "sdd-prepared-repository",
        profileFingerprint,
        accountKey: consent.accountKey,
        createdAt: consent.createdAt,
        completedAt: now()
      });
    }
  });
  return {
    async confirm(selectionId, expected) {
      guard(await host.inspectCurrent(), expected);
      if (starting || consents.size >= 32) throw new RepositoryError("clone_conflict");
      const source = await readSource(selectionId);
      const access = await connection.access();
      const preview = await core.confirm(selectionId);
      access.assertCurrent();
      guard(await host.inspectCurrent(), expected);
      if (source.generation !== access.generation || source.sourceVersion !== preview.sourceCommit || source.repository.defaultBranch !== preview.branch) throw new RepositoryError("source_changed");
      for (const consent of consents.values()) if (!consent.start) consent.revoked = true;
      const createdAt = now();
      consents.set(preview.operationId, {
        selectionId,
        source,
        expected: structuredClone(expected),
        account: identity2(access),
        accountKey: accountKey(access),
        digest: digest(preview.confirmation),
        createdAt,
        expiresAt: createdAt + 12e4,
        revoked: false
      });
      return { ...preview, expiresAt: createdAt + 12e4 };
    },
    async start(operationId, confirmation, requestId) {
      const consent = consents.get(operationId);
      if (disposed || !consent || !requestId || requestId.length > 256 || !sameSecret(confirmation, consent.digest)) throw new RepositoryError("clone_conflict");
      const access = await connection.access();
      if (identity2(access) !== consent.account) throw new RepositoryError("invalid_context");
      if (consent.start) {
        if (consent.requestId !== requestId) throw new RepositoryError("clone_conflict");
        await consent.start;
        return core.status(operationId);
      }
      if (consent.revoked || now() >= consent.expiresAt) throw new RepositoryError("confirmation_expired");
      if (starting) throw new RepositoryError("clone_conflict");
      starting = operationId;
      consent.requestId = requestId;
      consent.start = (async () => {
        try {
          const source = await readSource(consent.selectionId);
          access.assertCurrent();
          if (source.sourceVersion !== consent.source.sourceVersion || source.repository.id !== consent.source.repository.id || source.repository.defaultBranch !== consent.source.repository.defaultBranch || source.generation !== consent.source.generation) throw new RepositoryError("source_changed");
          const snapshot = await host.inspectCurrent();
          guard(snapshot, consent.expected);
          if (now() >= consent.expiresAt) throw new RepositoryError("confirmation_expired");
          try {
            await lstat3(dirname3(core.status(operationId).destination));
            throw new RepositoryError("clone_conflict");
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
          const state = await host.admitPreparation({
            operationId,
            expectedSource: { sessionId: snapshot.sessionId, contextRevision: snapshot.contextRevision },
            capabilityGeneration: snapshot.capabilityGeneration,
            activityRevision: snapshot.activityRevision
          }, async () => {
            access.assertCurrent();
            if (disposed || consent.revoked) throw new RepositoryError("confirmation_expired");
            return core.start(operationId, confirmation);
          });
          return state;
        } catch (error) {
          consent.revoked = true;
          throw knownRepositoryError(error?.code);
        } finally {
          if (starting === operationId) starting = void 0;
        }
      })();
      return consent.start;
    },
    status: core.status,
    completion: core.completion,
    settled: core.settled,
    cancel(operationId) {
      const consent = consents.get(operationId);
      if (consent) consent.revoked = true;
      core.cancel(operationId);
    },
    async authorized(operationId) {
      const consent = consents.get(operationId);
      if (disposed || !consent) throw new RepositoryError("resource_unavailable");
      try {
        if (accountKey(await connection.access()) !== consent.accountKey) throw new Error();
      } catch {
        throw new RepositoryError("resource_unavailable");
      }
      return core.status(operationId);
    },
    invalidate() {
      if (disposed) return;
      for (const [operationId, consent] of consents) {
        consent.revoked = true;
        if (["preparing", "verifying"].includes(core.status(operationId).state)) core.cancel(operationId);
      }
    },
    dispose() {
      disposed = true;
      core.dispose();
    }
  };
}

// src/artifact-clock.ts
var ARTIFACT = /^specs\/[a-z0-9][a-z0-9-]*\/(?:spec|plan|tasks)\.md$/;
var blobHash = (bytes) => createHash2("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
async function createPreparedArtifactClock({ workspacePath, binding, executable, runner = runGit, homeDirectory = homedir4() }) {
  const entries = /* @__PURE__ */ new Map();
  if (binding.state !== "verified") return void 0;
  const root = await realpath3(workspacePath);
  try {
    const git = executable ?? await findGitExecutable(root);
    const empty = process.platform === "win32" ? "NUL" : "/dev/null";
    const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home: homeDirectory, emptyFile: empty });
    delete env.GIT_CONFIG_KEY_0;
    delete env.GIT_CONFIG_VALUE_0;
    env.GIT_CONFIG_COUNT = "0";
    const signal = AbortSignal.timeout(15e3);
    const execute = (args) => runner({ executable: git, args: ["-c", "core.hooksPath=", "-c", "core.fsmonitor=false", ...args], cwd: root, env, signal });
    const tree = await execute(["ls-tree", "-rz", "HEAD", "--", "specs"]);
    const candidates = tree.split("\0").flatMap((row) => {
      const match = /^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
      return match && ARTIFACT.test(match[2]) ? [{ objectId: match[1], path: match[2] }] : [];
    });
    if (candidates.length > 300) return void 0;
    for (const entry of candidates) {
      const timestamp = await execute(["log", "-1", "--format=%ct", "HEAD", "--", entry.path]);
      if (!/^\d{1,12}$/.test(timestamp)) return void 0;
      entries.set(entry.path, { objectId: entry.objectId, committedAt: Number(timestamp) * 1e3 });
    }
  } catch {
    return void 0;
  }
  return (relativePath, filesystemTime) => {
    const entry = entries.get(relativePath);
    if (!entry || !ARTIFACT.test(relativePath)) return filesystemTime;
    try {
      let path3 = root;
      for (const segment2 of relativePath.split("/")) {
        path3 = join4(path3, segment2);
        if (lstatSync(path3).isSymbolicLink()) return filesystemTime;
      }
      const actual = realpathSync(path3);
      const within = relative2(root, actual);
      if (isAbsolute5(within) || within === ".." || within.startsWith(`..${sep2}`) || actual !== resolve4(path3)) return filesystemTime;
      const stat = lstatSync(path3);
      if (!stat.isFile() || stat.size > 1048576) return filesystemTime;
      const bytes = readFileSync(path3);
      if (bytes.length > 1048576) return filesystemTime;
      if (blobHash(bytes) === entry.objectId) return entry.committedAt;
      const text2 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      const normalized = Buffer.from(text2.replace(/\r\n/g, "\n"));
      return blobHash(normalized) === entry.objectId ? entry.committedAt : filesystemTime;
    } catch {
      return filesystemTime;
    }
  };
}

// src/auth.ts
import { randomBytes as randomBytes5 } from "node:crypto";

// src/oauth-callback.ts
import { randomBytes as randomBytes4, timingSafeEqual as timingSafeEqual2 } from "node:crypto";
import { createServer } from "node:http";
var CALLBACK_PATH = "/speckit-canvas/oauth/callback";
var COMPLETION_PATH = "/speckit-canvas/oauth/complete";
var ALLOWED_PARAMETERS = /* @__PURE__ */ new Set(["code", "state", "error", "error_description", "error_uri", "session_state", "client_info", "clientdata"]);
async function startOAuthCallback({ state, signal, timeoutMs = 12e4 }) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(state) || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12e4) {
    throw new RepositoryError("invalid_request");
  }
  if (signal?.aborted) throw new RepositoryError("connection_required");
  let accept;
  let reject;
  const result = new Promise((resolve6, fail) => {
    accept = resolve6;
    reject = fail;
  });
  void result.catch(() => void 0);
  let settled = false;
  let closed = false;
  let host = "";
  let timer = void 0;
  const expectedState = Buffer.from(state);
  const securityHeaders = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Content-Type": "text/plain; charset=utf-8",
    "Connection": "close"
  };
  function respond(res, status) {
    res.writeHead(status, securityHeaders);
    res.end("Sign-in response not accepted.");
  }
  function close() {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    if (!settled) {
      settled = true;
      reject(new RepositoryError("connection_required"));
    }
    server.close();
    server.closeAllConnections();
  }
  function cancel() {
    close();
  }
  const server = createServer({ maxHeaderSize: 20480 }, (req, res) => {
    if (closed || settled || req.method !== "GET" || req.headers.host !== host || !req.url || req.url.length > 16384 || !req.url.startsWith(`${CALLBACK_PATH}?`)) {
      respond(res, 400);
      return;
    }
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname !== CALLBACK_PATH || url.hash || url.origin !== `http://${host}`) {
      respond(res, 400);
      return;
    }
    for (const key of url.searchParams.keys()) {
      if (!ALLOWED_PARAMETERS.has(key) || url.searchParams.getAll(key).length !== 1) {
        respond(res, 400);
        return;
      }
    }
    const actualState = Buffer.from(url.searchParams.get("state") ?? "");
    if (actualState.length !== expectedState.length || !timingSafeEqual2(actualState, expectedState)) {
      respond(res, 400);
      return;
    }
    const code = url.searchParams.get("code");
    const providerError = url.searchParams.get("error");
    if (Boolean(code) === Boolean(providerError) || code && !/^[A-Za-z0-9._~-]{1,12288}$/.test(code)) {
      respond(res, 400);
      return;
    }
    settled = true;
    const nonce = randomBytes4(24).toString("base64");
    res.writeHead(200, {
      ...securityHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`
    });
    res.once("finish", close);
    res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Microsoft connection</title><script nonce="${nonce}">history.replaceState(null,"","${COMPLETION_PATH}")</script><p>Sign-in response received. Return to the canvas.</p></html>`);
    if (code) accept(code);
    else reject(new RepositoryError("interaction_required"));
  });
  server.requestTimeout = 5e3;
  server.headersTimeout = 5e3;
  server.setTimeout(5e3, (socket) => socket.destroy());
  server.maxConnections = 8;
  server.on("clientError", (_error, socket) => socket.destroy());
  await new Promise((resolve6, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", fail);
      resolve6();
    });
  }).catch(() => {
    close();
    throw new RepositoryError("upstream_unavailable");
  });
  server.on("error", close);
  const address = server.address();
  if (!address || typeof address === "string") {
    close();
    throw new RepositoryError("upstream_unavailable");
  }
  host = `localhost:${address.port}`;
  signal?.addEventListener("abort", cancel, { once: true });
  timer = setTimeout(close, timeoutMs);
  timer.unref();
  if (signal?.aborted) close();
  return { redirectUri: `http://${host}${CALLBACK_PATH}`, result, close };
}

// src/auth.ts
var ADO_SCOPES = ["https://app.vssps.visualstudio.com/.default"];
function authenticationError(error) {
  if (error instanceof RepositoryError) return error;
  const code = error && typeof error === "object" ? error.errorCode : void 0;
  let failure = "interaction_required";
  if (["unauthorized_client", "access_denied", "blocked_by_conditional_access"].includes(String(code))) failure = "policy_blocked";
  return new RepositoryError(failure);
}
function validateResult(result, profile, expected, nonce) {
  const account = result.account;
  const claims = result.idTokenClaims;
  if (!account || account.tenantId.toLowerCase() !== profile.tenantId || result.tenantId.toLowerCase() !== profile.tenantId) {
    throw new RepositoryError("wrong_tenant");
  }
  if (!UUID.test(account.localAccountId) || !account.homeAccountId || !result.accessToken || !result.expiresOn || result.expiresOn.getTime() <= Date.now() || nonce !== void 0 && claims?.nonce !== nonce) throw new RepositoryError("connection_required");
  if (expected && (account.homeAccountId !== expected.homeAccountId || account.localAccountId !== expected.localAccountId || account.tenantId !== expected.tenantId)) throw new RepositoryError("invalid_context");
  return account;
}
function createRepositoryConnection(profile, dependencies) {
  let generation = 0;
  let disposed = false;
  let active;
  let pending;
  let snapshot = { state: "disconnected", generation, projectLabel: `${profile.organization}/${profile.project}` };
  function publish(next) {
    snapshot = { ...next, generation, projectLabel: `${profile.organization}/${profile.project}` };
    try {
      dependencies.onChange?.({ ...snapshot });
    } catch {
    }
  }
  function invalidate() {
    generation++;
    const previousPending = pending;
    const previousActive = active;
    pending = void 0;
    active = void 0;
    previousPending?.controller.abort();
    previousActive?.controller.abort();
    if (previousPending) void previousPending.client.clear().catch(() => void 0);
    if (previousActive) void previousActive.client.clear().catch(() => void 0);
  }
  function current(epoch, signal) {
    if (disposed || epoch !== generation || signal.aborted) throw new RepositoryError("invalid_context");
  }
  async function perform(client, controller, epoch) {
    const state = randomBytes5(32).toString("base64url");
    const nonce = randomBytes5(32).toString("base64url");
    const timeout = setTimeout(() => controller.abort(), 12e4);
    timeout.unref();
    let callback;
    try {
      const codes = await dependencies.generatePkce();
      current(epoch, controller.signal);
      callback = await (dependencies.callback ?? startOAuthCallback)({ state, signal: controller.signal });
      const authorizationUrl = await client.getAuthCodeUrl({
        scopes: [...ADO_SCOPES],
        redirectUri: callback.redirectUri,
        codeChallenge: codes.challenge,
        codeChallengeMethod: "S256",
        responseMode: "query",
        state,
        nonce
      });
      current(epoch, controller.signal);
      const url = new URL(authorizationUrl);
      if (url.origin !== "https://login.microsoftonline.com" || url.pathname !== `/${profile.tenantId}/oauth2/v2.0/authorize` || url.username || url.password || url.hash) throw new RepositoryError("invalid_request");
      await dependencies.openBrowser(url.href);
      const code = await callback.result;
      current(epoch, controller.signal);
      const result = await client.acquireTokenByCode({
        code,
        scopes: [...ADO_SCOPES],
        redirectUri: callback.redirectUri,
        codeVerifier: codes.verifier,
        nonce
      });
      current(epoch, controller.signal);
      const account = validateResult(result, profile, void 0, nonce);
      const accountLabel = (account.username || account.name || "Microsoft account").replace(/[\p{Cc}\p{Cf}]/gu, "").slice(0, 256);
      const connectionId = randomBytes5(24).toString("base64url");
      pending = void 0;
      active = { client, controller, account, connectionId };
      publish({ state: "connected", accountLabel, connectionId });
    } catch (error) {
      controller.abort();
      await client.clear().catch(() => void 0);
      const failure = authenticationError(error);
      if (!disposed && epoch === generation) {
        pending = void 0;
        publish({ state: "failed", error: errorEnvelope(failure).error });
      }
      throw failure;
    } finally {
      clearTimeout(timeout);
      callback?.close();
    }
  }
  return {
    snapshot: () => ({ ...snapshot }),
    connect() {
      if (disposed || !profile.enabled) throw new RepositoryError("connection_required");
      if (pending) return { transactionId: pending.id, completion: pending.completion };
      invalidate();
      const epoch = generation;
      const id = randomBytes5(24).toString("base64url");
      const controller = new AbortController();
      const client = dependencies.createClient(profile, controller.signal);
      publish({ state: "connecting", transactionId: id });
      const completion = perform(client, controller, epoch);
      void completion.catch(() => void 0);
      pending = { id, client, controller, completion };
      return { transactionId: id, completion };
    },
    async access() {
      const bound = active;
      const epoch = generation;
      if (!bound || disposed) throw new RepositoryError("connection_required");
      try {
        const result = await bound.client.acquireTokenSilent({ account: bound.account, scopes: [...ADO_SCOPES] });
        current(epoch, bound.controller.signal);
        validateResult(result, profile, bound.account);
        return {
          accessToken: result.accessToken,
          tenantId: profile.tenantId,
          accountId: bound.account.localAccountId,
          connectionId: bound.connectionId,
          generation: epoch,
          signal: bound.controller.signal,
          scopes: result.scopes,
          assertCurrent: () => current(epoch, bound.controller.signal)
        };
      } catch (error) {
        const failure = authenticationError(error);
        if (!disposed && generation === epoch) {
          invalidate();
          publish({ state: "failed", error: errorEnvelope(failure).error });
        }
        throw failure;
      }
    },
    disconnect() {
      invalidate();
      publish({ state: "disconnected" });
    },
    dispose() {
      disposed = true;
      invalidate();
      publish({ state: "disconnected" });
    }
  };
}

// src/discovery.ts
var import_yaml3 = __toESM(require_dist(), 1);
import { createHash as createHash4 } from "node:crypto";

// src/continuations.ts
import { createHash as createHash3, createHmac, randomBytes as randomBytes6, timingSafeEqual as timingSafeEqual3 } from "node:crypto";
function bindingHash(binding) {
  const ordered = Object.entries(binding).sort(([left], [right]) => left.localeCompare(right, "en"));
  return createHash3("sha256").update(JSON.stringify(ordered)).digest("hex");
}
function createContinuations({ now = Date.now, ttlMs = 6e5 } = {}) {
  const key = randomBytes6(32);
  let disposed = false;
  return {
    issue(kind, binding, position) {
      if (disposed || !Number.isSafeInteger(position) || position < 0) throw new RepositoryError("invalid_context");
      const encoded = Buffer.from(JSON.stringify({ version: 1, kind, binding: bindingHash(binding), position, expiresAt: now() + ttlMs })).toString("base64url");
      return `${encoded}.${createHmac("sha256", key).update(encoded).digest("base64url")}`;
    },
    verify(cursor, kind, binding) {
      if (disposed || typeof cursor !== "string" || cursor.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(cursor)) {
        throw new RepositoryError("invalid_context");
      }
      const [encoded, signature] = cursor.split(".");
      const expected = createHmac("sha256", key).update(encoded).digest();
      const actual = Buffer.from(signature, "base64url");
      if (actual.length !== expected.length || !timingSafeEqual3(actual, expected)) throw new RepositoryError("invalid_context");
      let payload;
      try {
        payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
      } catch {
        throw new RepositoryError("invalid_context");
      }
      if (payload.version !== 1 || payload.kind !== kind || payload.binding !== bindingHash(binding) || typeof payload.position !== "number" || !Number.isSafeInteger(payload.position) || payload.position < 0 || typeof payload.expiresAt !== "number" || !Number.isFinite(payload.expiresAt)) throw new RepositoryError("invalid_context");
      if (payload.expiresAt <= now()) throw new RepositoryError("expired_cursor");
      return payload.position;
    },
    dispose() {
      disposed = true;
      key.fill(0);
    }
  };
}

// src/discovery.ts
var fingerprint = (value) => createHash4("sha256").update(JSON.stringify(value)).digest("hex");
var object2 = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
function normalizeSearch(input) {
  if (typeof input !== "string") throw new RepositoryError("invalid_request");
  const normalized = input.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  if (normalized.length > 256 || /[\p{Cc}\p{Cf}]/u.test(normalized)) throw new RepositoryError("invalid_request");
  return normalized;
}
function matchesSearch(name3, query) {
  const normalized = name3.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  return query.split(" ").every((word) => normalized.includes(word));
}
function compare(left, right) {
  const leftName = normalizeSearch(left.name);
  const rightName = normalizeSearch(right.name);
  return leftName < rightName ? -1 : leftName > rightName ? 1 : left.id.localeCompare(right.id, "en");
}
async function boundedMap(inputs, run) {
  const results = [];
  for (let index = 0; index < inputs.length; index += 4) results.push(...await Promise.all(inputs.slice(index, index + 4).map(run)));
  return results;
}
function normalizeArea(value) {
  if (typeof value !== "string" || value.length > 2048 || /[\p{Cc}\p{Cf}/]/u.test(value)) throw new RepositoryError("upstream_unavailable");
  const parts = value.normalize("NFKC").split("\\").map((part) => part.trim().toLocaleLowerCase("en-US"));
  if (parts.some((part) => !part || part === "." || part === "..")) throw new RepositoryError("upstream_unavailable");
  return parts.join("\\");
}
function unsafeYaml(node, depth = 0) {
  if (depth > 40 || (0, import_yaml3.isAlias)(node)) return true;
  if (typeof object2(node).tag === "string" && String(object2(node).tag).startsWith("!")) return true;
  if ((0, import_yaml3.isPair)(node)) return (0, import_yaml3.isScalar)(node.key) && node.key.value === "<<" || unsafeYaml(node.key, depth + 1) || unsafeYaml(node.value, depth + 1);
  if ((0, import_yaml3.isMap)(node) || (0, import_yaml3.isSeq)(node)) return node.items.some((child) => unsafeYaml(child, depth + 1));
  return false;
}
function manifestArea(bytes, profile) {
  if (!bytes.length || bytes.length > 65536) return null;
  try {
    const parsed = (0, import_yaml3.parseAllDocuments)(new TextDecoder("utf-8", { fatal: true }).decode(bytes), { strict: true, uniqueKeys: true, prettyErrors: false });
    if (parsed.length !== 1 || parsed[0].errors.length || parsed[0].warnings.length || unsafeYaml(parsed[0].contents)) return null;
    const root = object2(parsed[0].toJS({ maxAliasCount: 0 }));
    let metadata = root;
    if (root.schemaVersion === "1.0.0") {
      const providers = Array.isArray(root.providers) ? root.providers.map(object2).filter((provider) => provider.provider === "InventoryAsCode") : [];
      if (providers.length !== 1) return null;
      metadata = object2(providers[0].metadata);
    } else if (root.schemaVersion !== "0.0.1") return null;
    const area = object2(object2(metadata.routing).defaultAreaPath);
    if (typeof area.org !== "string" || area.org.normalize("NFKC").trim().toLowerCase() !== profile.organization.toLowerCase() || typeof area.path !== "string") return null;
    const path3 = normalizeArea(area.path);
    return path3.split("\\")[0] === profile.project.toLowerCase() ? path3 : null;
  } catch {
    return null;
  }
}
function areaMatches(area, path3) {
  return path3 === area.path || area.includeChildren && path3.startsWith(`${area.path}\\`);
}
async function repositoryDetail(client, operation, id) {
  const repository = await client.repository(operation, id);
  const sourceVersion = await client.commit(operation, repository);
  if (!sourceVersion) return { ...repository, sourceVersion: null, speckitStatus: repository.operationalState === "maintenance" ? "unavailable" : "unscannable" };
  let enabled = false;
  try {
    const root = await client.item(operation, id, sourceVersion, "/.specify");
    enabled = root.path === "/.specify" && root.isFolder === true;
  } catch (error) {
    if (!(error instanceof RepositoryError) || error.code !== "resource_unavailable") throw error;
    await client.repository(operation, id);
  }
  operation.access.assertCurrent();
  return { ...repository, sourceVersion, speckitStatus: enabled ? "enabled" : "not_enabled" };
}
async function teamAreas(operation, profile) {
  const granted = operation.access.scopes.map((scope) => scope.toLowerCase().split("/").at(-1));
  if (!granted.includes(".default") && ["vso.project", "vso.work"].some((scope) => !granted.includes(scope))) throw new RepositoryError("insufficient_scope");
  const teams = /* @__PURE__ */ new Set();
  for (let offset = 0; ; offset += 100) {
    if (offset >= 1e5 || operation.signal.aborted) throw new RepositoryError("upstream_unavailable");
    const page = await operation.json(["_apis", "projects", profile.project, "teams"], { $mine: "true", $top: "100", $skip: String(offset) }, { personalization: true, maximumBytes: 2 * 1024 * 1024 });
    if (!Array.isArray(page.value) || page.value.length > 100) throw new RepositoryError("upstream_unavailable");
    for (const value of page.value) {
      const team = object2(value);
      if (typeof team.id !== "string" || !UUID.test(team.id) || typeof team.projectId !== "string" || !UUID.test(team.projectId)) throw new RepositoryError("upstream_unavailable");
      teams.add(team.id.toLowerCase());
    }
    if (page.value.length < 100) break;
  }
  const merged = /* @__PURE__ */ new Map();
  await boundedMap([...teams], async (team) => {
    const values = await operation.json([profile.project, team, "_apis", "work", "teamsettings", "teamfieldvalues"], {}, { personalization: true, maximumBytes: 2 * 1024 * 1024 });
    if (object2(values.field).referenceName !== "System.AreaPath" || !Array.isArray(values.values)) throw new RepositoryError("upstream_unavailable");
    for (const value of values.values) {
      const area = object2(value);
      if (typeof area.value !== "string" || typeof area.includeChildren !== "boolean") throw new RepositoryError("upstream_unavailable");
      const path3 = normalizeArea(area.value);
      if (path3.split("\\")[0] !== profile.project.toLowerCase()) throw new RepositoryError("upstream_unavailable");
      merged.set(path3, Boolean(merged.get(path3)) || area.includeChildren);
      if (merged.size > 1e3) throw new RepositoryError("upstream_unavailable");
    }
  });
  return [...merged].sort(([left], [right]) => left.localeCompare(right, "en")).map(([path3, includeChildren]) => ({ path: path3, includeChildren }));
}
function createRepositoryDiscovery({ client, profile, now = Date.now }) {
  const cursors = createContinuations({ now });
  const runs = /* @__PURE__ */ new Map();
  let sequence = 0;
  function binding(operation, pageSize) {
    return {
      tenant: operation.access.tenantId,
      account: operation.access.accountId,
      connection: operation.access.connectionId,
      generation: operation.access.generation,
      profile: fingerprint(profile),
      pageSize
    };
  }
  async function verifyCandidate(operation, id, areas) {
    try {
      const repository = await client.repository(operation, id);
      if (repository.operationalState !== "active") return null;
      const commit = await client.commit(operation, repository);
      if (!commit) return null;
      const item = await client.item(operation, id, commit, "/es-metadata.yml");
      if (item.path !== "/es-metadata.yml" || item.isFolder || typeof item.objectId !== "string" || !/^[a-f0-9]{40}$/i.test(item.objectId) || object2(item.contentMetadata).isBinary) return null;
      const bytes = await client.blob(operation, id, item.objectId, 65536);
      const path3 = manifestArea(bytes, profile);
      return path3 && areas.some((area) => areaMatches(area, path3)) ? repository : null;
    } catch (error) {
      if (error instanceof RepositoryError && ["resource_unavailable", "file_too_large", "unsupported_file"].includes(error.code)) return null;
      throw error;
    }
  }
  return {
    async search(query, cursor) {
      const normalized = normalizeSearch(query);
      if (!normalized) throw new RepositoryError("invalid_request");
      const operation = await client.open();
      const repositories = [...new Map((await client.list(operation)).map((repository) => [repository.id, repository])).values()].filter((repository) => matchesSearch(repository.name, normalized)).sort(compare);
      const context = { ...binding(operation, 100), query: normalized, fingerprint: fingerprint(repositories.map(({ id, name: name3 }) => [id, name3])) };
      const offset = cursor ? cursors.verify(cursor, "search", context) : 0;
      if (offset > repositories.length) throw new RepositoryError("invalid_context");
      const items = repositories.slice(offset, offset + 100);
      operation.access.assertCurrent();
      const hasMore = offset + items.length < repositories.length;
      return { items, hasMore, cursor: hasMore ? cursors.issue("search", context, offset + items.length) : null, outcome: "ready" };
    },
    async detail(id) {
      return repositoryDetail(client, await client.open(), id);
    },
    async relevant(cursor) {
      for (const [key, run2] of runs) if (run2.expiresAt <= now()) runs.delete(key);
      const operation = await client.open();
      const areas = await teamAreas(operation, profile);
      const digest2 = fingerprint(areas);
      const context = { ...binding(operation, 4), associationFingerprint: digest2 };
      let run;
      if (cursor) {
        cursors.verify(cursor, "relevant", context);
        const previous = runs.get(cursor);
        if (!previous || previous.fingerprint !== digest2) throw new RepositoryError("expired_cursor");
        run = { ...previous, areas, queue: [...previous.queue], seen: new Set(previous.seen) };
      } else run = { areas, fingerprint: digest2, areaOffset: 0, searchOffset: 0, queue: [], seen: /* @__PURE__ */ new Set(), returned: 0, expiresAt: now() + 6e5 };
      if (!areas.length) return { items: [], hasMore: false, cursor: null, outcome: "no_associations" };
      const items = [];
      let examined = 0;
      let associations = 0;
      let rawCandidates = 0;
      while (items.length < 4 && examined < 100 && associations < 100) {
        operation.access.assertCurrent();
        if (!run.queue.length) {
          if (run.areaOffset >= areas.length || rawCandidates >= 100) break;
          const batch = areas.slice(run.areaOffset, run.areaOffset + 20);
          const terms = [...new Set(batch.map((area) => area.path.split("\\").at(-1)))];
          const candidateLimit = Math.min(100 - examined, 100 - rawCandidates);
          const response = await operation.json([profile.project, "_apis", "search", "codesearchresults"], { "api-version": "7.1-preview.1" }, {
            search: true,
            personalization: true,
            maximumBytes: 2 * 1024 * 1024,
            body: {
              searchText: `(${terms.map((term) => JSON.stringify(term)).join(" OR ")}) path:"/es-metadata.yml"`,
              $top: candidateLimit,
              $skip: run.searchOffset,
              filters: { Project: [profile.project] },
              includeFacets: false,
              includeSnippet: false
            }
          });
          if (response.infoCode !== void 0 && response.infoCode !== 0 || !Array.isArray(response.results) || response.results.length > candidateLimit || typeof response.count !== "number" || !Number.isSafeInteger(response.count) || response.count < 0) throw new RepositoryError("upstream_unavailable");
          const raw = response.results;
          rawCandidates += raw.length;
          if (!raw.length && response.count > run.searchOffset) throw new RepositoryError("upstream_unavailable");
          for (const value of raw) {
            const hit = object2(value);
            const id = object2(hit.repository).id;
            if (hit.path !== "/es-metadata.yml" || String(object2(hit.project).name).toLowerCase() !== profile.project.toLowerCase() || typeof id !== "string" || !UUID.test(id)) continue;
            const normalizedId = id.toLowerCase();
            if (!run.seen.has(normalizedId) && !run.queue.includes(normalizedId)) run.queue.push(normalizedId);
          }
          run.searchOffset += raw.length;
          if (run.searchOffset >= response.count || !raw.length) {
            run.areaOffset += batch.length;
            run.searchOffset = 0;
          }
          associations += batch.length;
          if (!run.queue.length) {
            examined += raw.length;
            continue;
          }
        }
        const candidates = run.queue.splice(0, Math.min(4 - items.length, 4, 100 - examined));
        examined += candidates.length;
        for (const id of candidates) run.seen.add(id);
        if (run.seen.size > 1e4) throw new RepositoryError("upstream_unavailable");
        const verified = await boundedMap(candidates, (id) => verifyCandidate(operation, id, areas));
        items.push(...verified.filter((item) => item !== null));
      }
      operation.access.assertCurrent();
      run.returned += items.length;
      const hasMore = run.queue.length > 0 || run.areaOffset < areas.length;
      let next = null;
      if (hasMore) {
        next = cursors.issue("relevant", context, ++sequence);
        if (runs.size >= 32) runs.delete(runs.keys().next().value);
        runs.set(next, run);
      }
      return {
        items: items.sort(compare),
        hasMore,
        cursor: next,
        outcome: !run.returned && !hasMore ? "no_linked_repositories" : !items.length && hasMore ? "scanning" : "ready"
      };
    },
    clear() {
      runs.clear();
    },
    dispose() {
      runs.clear();
      cursors.dispose();
    }
  };
}

// node_modules/@azure/msal-node/dist/cache/serializer/Serializer.mjs
var Serializer = class {
  /**
   * serialize the JSON blob
   * @param data - JSON blob cache
   */
  static serializeJSONBlob(data) {
    return JSON.stringify(data);
  }
  /**
   * Serialize Accounts
   * @param accCache - cache of accounts
   */
  static serializeAccounts(accCache) {
    const accounts = {};
    Object.keys(accCache).map(function(key) {
      const accountEntity = accCache[key];
      accounts[key] = {
        home_account_id: accountEntity.homeAccountId,
        environment: accountEntity.environment,
        realm: accountEntity.realm,
        local_account_id: accountEntity.localAccountId,
        username: accountEntity.username,
        authority_type: accountEntity.authorityType,
        name: accountEntity.name,
        client_info: accountEntity.clientInfo,
        last_modification_time: accountEntity.lastModificationTime,
        last_modification_app: accountEntity.lastModificationApp,
        tenantProfiles: accountEntity.tenantProfiles?.map((tenantProfile) => {
          return JSON.stringify(tenantProfile);
        })
      };
    });
    return accounts;
  }
  /**
   * Serialize IdTokens
   * @param idTCache - cache of ID tokens
   */
  static serializeIdTokens(idTCache) {
    const idTokens = {};
    Object.keys(idTCache).map(function(key) {
      const idTEntity = idTCache[key];
      idTokens[key] = {
        home_account_id: idTEntity.homeAccountId,
        environment: idTEntity.environment,
        credential_type: idTEntity.credentialType,
        client_id: idTEntity.clientId,
        secret: idTEntity.secret,
        realm: idTEntity.realm
      };
    });
    return idTokens;
  }
  /**
   * Serializes AccessTokens
   * @param atCache - cache of access tokens
   */
  static serializeAccessTokens(atCache) {
    const accessTokens = {};
    Object.keys(atCache).map(function(key) {
      const atEntity = atCache[key];
      accessTokens[key] = {
        home_account_id: atEntity.homeAccountId,
        environment: atEntity.environment,
        credential_type: atEntity.credentialType,
        client_id: atEntity.clientId,
        secret: atEntity.secret,
        realm: atEntity.realm,
        target: atEntity.target,
        cached_at: atEntity.cachedAt,
        expires_on: atEntity.expiresOn,
        extended_expires_on: atEntity.extendedExpiresOn,
        refresh_on: atEntity.refreshOn,
        key_id: atEntity.keyId,
        token_type: atEntity.tokenType,
        userAssertionHash: atEntity.userAssertionHash,
        resource: atEntity.resource,
        additionalCacheKeyComponents: atEntity.additionalCacheKeyComponents
      };
    });
    return accessTokens;
  }
  /**
   * Serialize refreshTokens
   * @param rtCache - cache of refresh tokens
   */
  static serializeRefreshTokens(rtCache) {
    const refreshTokens = {};
    Object.keys(rtCache).map(function(key) {
      const rtEntity = rtCache[key];
      refreshTokens[key] = {
        home_account_id: rtEntity.homeAccountId,
        environment: rtEntity.environment,
        credential_type: rtEntity.credentialType,
        client_id: rtEntity.clientId,
        secret: rtEntity.secret,
        family_id: rtEntity.familyId,
        target: rtEntity.target,
        realm: rtEntity.realm
      };
    });
    return refreshTokens;
  }
  /**
   * Serialize amdtCache
   * @param amdtCache - cache of app metadata
   */
  static serializeAppMetadata(amdtCache) {
    const appMetadata = {};
    Object.keys(amdtCache).map(function(key) {
      const amdtEntity = amdtCache[key];
      appMetadata[key] = {
        client_id: amdtEntity.clientId,
        environment: amdtEntity.environment,
        family_id: amdtEntity.familyId
      };
    });
    return appMetadata;
  }
  /**
   * Serialize the cache
   * @param inMemCache - itemised cache read from the JSON
   */
  static serializeAllCache(inMemCache) {
    return {
      Account: this.serializeAccounts(inMemCache.accounts),
      IdToken: this.serializeIdTokens(inMemCache.idTokens),
      AccessToken: this.serializeAccessTokens(inMemCache.accessTokens),
      RefreshToken: this.serializeRefreshTokens(inMemCache.refreshTokens),
      AppMetadata: this.serializeAppMetadata(inMemCache.appMetadata)
    };
  }
};

// node_modules/@azure/msal-common/dist/constants/AADServerParamKeys.mjs
var AADServerParamKeys_exports = {};
__export(AADServerParamKeys_exports, {
  ACCESS_TOKEN: () => ACCESS_TOKEN,
  ATTRIBUTE_TOKENS: () => ATTRIBUTE_TOKENS,
  BROKER_CLIENT_ID: () => BROKER_CLIENT_ID,
  BROKER_REDIRECT_URI: () => BROKER_REDIRECT_URI,
  CCS_HEADER: () => CCS_HEADER,
  CLAIMS: () => CLAIMS,
  CLIENT_ASSERTION: () => CLIENT_ASSERTION,
  CLIENT_ASSERTION_TYPE: () => CLIENT_ASSERTION_TYPE,
  CLIENT_ID: () => CLIENT_ID,
  CLIENT_INFO: () => CLIENT_INFO,
  CLIENT_REQUEST_ID: () => CLIENT_REQUEST_ID,
  CLIENT_SECRET: () => CLIENT_SECRET,
  CLI_DATA: () => CLI_DATA,
  CODE: () => CODE,
  CODE_CHALLENGE: () => CODE_CHALLENGE,
  CODE_CHALLENGE_METHOD: () => CODE_CHALLENGE_METHOD,
  CODE_VERIFIER: () => CODE_VERIFIER,
  DEVICE_CODE: () => DEVICE_CODE,
  DOMAIN_HINT: () => DOMAIN_HINT,
  DPOP_JKT: () => DPOP_JKT,
  EAR_JWE_CRYPTO: () => EAR_JWE_CRYPTO,
  EAR_JWK: () => EAR_JWK,
  ERROR: () => ERROR,
  ERROR_DESCRIPTION: () => ERROR_DESCRIPTION,
  EXPIRES_IN: () => EXPIRES_IN,
  FMI_PATH: () => FMI_PATH,
  FOCI: () => FOCI,
  GRANT_TYPE: () => GRANT_TYPE,
  ID_TOKEN: () => ID_TOKEN,
  ID_TOKEN_HINT: () => ID_TOKEN_HINT,
  INSTANCE_AWARE: () => INSTANCE_AWARE,
  LOGIN_HINT: () => LOGIN_HINT,
  LOGOUT_HINT: () => LOGOUT_HINT,
  NATIVE_BROKER: () => NATIVE_BROKER,
  NONCE: () => NONCE,
  OBO_ASSERTION: () => OBO_ASSERTION,
  ON_BEHALF_OF: () => ON_BEHALF_OF,
  POST_LOGOUT_URI: () => POST_LOGOUT_URI,
  PROMPT: () => PROMPT,
  REDIRECT_URI: () => REDIRECT_URI,
  REFRESH_TOKEN: () => REFRESH_TOKEN,
  REFRESH_TOKEN_EXPIRES_IN: () => REFRESH_TOKEN_EXPIRES_IN,
  REQUESTED_TOKEN_USE: () => REQUESTED_TOKEN_USE,
  REQ_CNF: () => REQ_CNF,
  RESOURCE: () => RESOURCE,
  RESPONSE_MODE: () => RESPONSE_MODE,
  RESPONSE_TYPE: () => RESPONSE_TYPE,
  RETURN_SPA_CODE: () => RETURN_SPA_CODE,
  SCOPE: () => SCOPE,
  SESSION_STATE: () => SESSION_STATE,
  SID: () => SID,
  STATE: () => STATE,
  TOKEN_TYPE: () => TOKEN_TYPE,
  USERNAME: () => USERNAME,
  USER_FEDERATED_IDENTITY_CREDENTIAL: () => USER_FEDERATED_IDENTITY_CREDENTIAL,
  USER_ID: () => USER_ID,
  X_APP_NAME: () => X_APP_NAME,
  X_APP_VER: () => X_APP_VER,
  X_CLIENT_CPU: () => X_CLIENT_CPU,
  X_CLIENT_CURR_TELEM: () => X_CLIENT_CURR_TELEM,
  X_CLIENT_EXTRA_SKU: () => X_CLIENT_EXTRA_SKU,
  X_CLIENT_LAST_TELEM: () => X_CLIENT_LAST_TELEM,
  X_CLIENT_OS: () => X_CLIENT_OS,
  X_CLIENT_SKU: () => X_CLIENT_SKU,
  X_CLIENT_VER: () => X_CLIENT_VER,
  X_MS_LIB_CAPABILITY: () => X_MS_LIB_CAPABILITY
});
var CLIENT_ID = "client_id";
var REDIRECT_URI = "redirect_uri";
var RESPONSE_TYPE = "response_type";
var RESPONSE_MODE = "response_mode";
var GRANT_TYPE = "grant_type";
var CLAIMS = "claims";
var SCOPE = "scope";
var ERROR = "error";
var ERROR_DESCRIPTION = "error_description";
var ACCESS_TOKEN = "access_token";
var ID_TOKEN = "id_token";
var REFRESH_TOKEN = "refresh_token";
var EXPIRES_IN = "expires_in";
var REFRESH_TOKEN_EXPIRES_IN = "refresh_token_expires_in";
var STATE = "state";
var NONCE = "nonce";
var PROMPT = "prompt";
var SESSION_STATE = "session_state";
var CLIENT_INFO = "client_info";
var CODE = "code";
var CODE_CHALLENGE = "code_challenge";
var CODE_CHALLENGE_METHOD = "code_challenge_method";
var CODE_VERIFIER = "code_verifier";
var CLIENT_REQUEST_ID = "client-request-id";
var X_CLIENT_SKU = "x-client-SKU";
var X_CLIENT_VER = "x-client-VER";
var X_CLIENT_OS = "x-client-OS";
var X_CLIENT_CPU = "x-client-CPU";
var X_CLIENT_CURR_TELEM = "x-client-current-telemetry";
var X_CLIENT_LAST_TELEM = "x-client-last-telemetry";
var X_MS_LIB_CAPABILITY = "x-ms-lib-capability";
var X_APP_NAME = "x-app-name";
var X_APP_VER = "x-app-ver";
var POST_LOGOUT_URI = "post_logout_redirect_uri";
var ID_TOKEN_HINT = "id_token_hint";
var DEVICE_CODE = "device_code";
var CLIENT_SECRET = "client_secret";
var CLIENT_ASSERTION = "client_assertion";
var CLIENT_ASSERTION_TYPE = "client_assertion_type";
var TOKEN_TYPE = "token_type";
var REQ_CNF = "req_cnf";
var DPOP_JKT = "dpop_jkt";
var OBO_ASSERTION = "assertion";
var REQUESTED_TOKEN_USE = "requested_token_use";
var ON_BEHALF_OF = "on_behalf_of";
var FOCI = "foci";
var CCS_HEADER = "X-AnchorMailbox";
var RETURN_SPA_CODE = "return_spa_code";
var NATIVE_BROKER = "nativebroker";
var LOGOUT_HINT = "logout_hint";
var SID = "sid";
var LOGIN_HINT = "login_hint";
var DOMAIN_HINT = "domain_hint";
var X_CLIENT_EXTRA_SKU = "x-client-xtra-sku";
var BROKER_CLIENT_ID = "brk_client_id";
var BROKER_REDIRECT_URI = "brk_redirect_uri";
var INSTANCE_AWARE = "instance_aware";
var EAR_JWK = "ear_jwk";
var EAR_JWE_CRYPTO = "ear_jwe_crypto";
var RESOURCE = "resource";
var CLI_DATA = "clidata";
var USER_FEDERATED_IDENTITY_CREDENTIAL = "user_federated_identity_credential";
var USERNAME = "username";
var USER_ID = "user_id";
var FMI_PATH = "fmi_path";
var ATTRIBUTE_TOKENS = "attribute_tokens";

// node_modules/@azure/msal-common/dist/cache/utils/AccountEntityUtils.mjs
var AccountEntityUtils_exports = {};
__export(AccountEntityUtils_exports, {
  createAccountEntity: () => createAccountEntity,
  createAccountEntityFromAccountInfo: () => createAccountEntityFromAccountInfo,
  generateAccountId: () => generateAccountId,
  generateHomeAccountId: () => generateHomeAccountId,
  getAccountInfo: () => getAccountInfo,
  isAccountEntity: () => isAccountEntity,
  isSingleTenant: () => isSingleTenant
});

// node_modules/@azure/msal-common/dist/utils/Constants.mjs
var Constants_exports = {};
__export(Constants_exports, {
  AADAuthority: () => AADAuthority,
  AAD_INSTANCE_DISCOVERY_ENDPT: () => AAD_INSTANCE_DISCOVERY_ENDPT,
  AAD_TENANT_DOMAIN_SUFFIX: () => AAD_TENANT_DOMAIN_SUFFIX,
  ADFS: () => ADFS,
  APP_METADATA: () => APP_METADATA,
  AUTHORITY_METADATA_CACHE_KEY: () => AUTHORITY_METADATA_CACHE_KEY,
  AUTHORITY_METADATA_REFRESH_TIME_SECONDS: () => AUTHORITY_METADATA_REFRESH_TIME_SECONDS,
  AUTHORIZATION_PENDING: () => AUTHORIZATION_PENDING,
  AZURE_REGION_AUTO_DISCOVER_FLAG: () => AZURE_REGION_AUTO_DISCOVER_FLAG,
  AuthenticationScheme: () => AuthenticationScheme,
  AuthorityMetadataSource: () => AuthorityMetadataSource,
  CACHE_ACCOUNT_TYPE_ADFS: () => CACHE_ACCOUNT_TYPE_ADFS,
  CACHE_ACCOUNT_TYPE_GENERIC: () => CACHE_ACCOUNT_TYPE_GENERIC,
  CACHE_ACCOUNT_TYPE_MSAV1: () => CACHE_ACCOUNT_TYPE_MSAV1,
  CACHE_ACCOUNT_TYPE_MSSTS: () => CACHE_ACCOUNT_TYPE_MSSTS,
  CACHE_KEY_SEPARATOR: () => CACHE_KEY_SEPARATOR,
  CIAM_AUTH_URL: () => CIAM_AUTH_URL,
  CLIENT_INFO: () => CLIENT_INFO2,
  CLIENT_INFO_SEPARATOR: () => CLIENT_INFO_SEPARATOR,
  CLIENT_MISMATCH_ERROR: () => CLIENT_MISMATCH_ERROR,
  CODE_GRANT_TYPE: () => CODE_GRANT_TYPE,
  CONSUMER_UTID: () => CONSUMER_UTID,
  CacheOutcome: () => CacheOutcome,
  CacheType: () => CacheType,
  ClaimsRequestKeys: () => ClaimsRequestKeys,
  CodeChallengeMethodValues: () => CodeChallengeMethodValues,
  CredentialType: () => CredentialType,
  DEFAULT_AUTHORITY: () => DEFAULT_AUTHORITY,
  DEFAULT_AUTHORITY_HOST: () => DEFAULT_AUTHORITY_HOST,
  DEFAULT_COMMON_TENANT: () => DEFAULT_COMMON_TENANT,
  DEFAULT_MAX_THROTTLE_TIME_SECONDS: () => DEFAULT_MAX_THROTTLE_TIME_SECONDS,
  DEFAULT_THROTTLE_TIME_SECONDS: () => DEFAULT_THROTTLE_TIME_SECONDS,
  DEFAULT_TOKEN_RENEWAL_OFFSET_SEC: () => DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
  EMAIL_SCOPE: () => EMAIL_SCOPE,
  EncodingTypes: () => EncodingTypes,
  FORWARD_SLASH: () => FORWARD_SLASH,
  GrantType: () => GrantType,
  HTTP_BAD_REQUEST: () => HTTP_BAD_REQUEST,
  HTTP_CLIENT_ERROR: () => HTTP_CLIENT_ERROR,
  HTTP_CLIENT_ERROR_RANGE_END: () => HTTP_CLIENT_ERROR_RANGE_END,
  HTTP_CLIENT_ERROR_RANGE_START: () => HTTP_CLIENT_ERROR_RANGE_START,
  HTTP_GATEWAY_TIMEOUT: () => HTTP_GATEWAY_TIMEOUT,
  HTTP_GONE: () => HTTP_GONE,
  HTTP_MULTI_SIDED_ERROR: () => HTTP_MULTI_SIDED_ERROR,
  HTTP_NOT_FOUND: () => HTTP_NOT_FOUND,
  HTTP_REDIRECT: () => HTTP_REDIRECT,
  HTTP_REQUEST_TIMEOUT: () => HTTP_REQUEST_TIMEOUT,
  HTTP_SERVER_ERROR: () => HTTP_SERVER_ERROR,
  HTTP_SERVER_ERROR_RANGE_END: () => HTTP_SERVER_ERROR_RANGE_END,
  HTTP_SERVER_ERROR_RANGE_START: () => HTTP_SERVER_ERROR_RANGE_START,
  HTTP_SERVICE_UNAVAILABLE: () => HTTP_SERVICE_UNAVAILABLE,
  HTTP_SUCCESS: () => HTTP_SUCCESS,
  HTTP_SUCCESS_RANGE_END: () => HTTP_SUCCESS_RANGE_END,
  HTTP_SUCCESS_RANGE_START: () => HTTP_SUCCESS_RANGE_START,
  HTTP_TOO_MANY_REQUESTS: () => HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED: () => HTTP_UNAUTHORIZED,
  HeaderNames: () => HeaderNames,
  HttpMethod: () => HttpMethod,
  IMDS_ENDPOINT: () => IMDS_ENDPOINT,
  IMDS_TIMEOUT: () => IMDS_TIMEOUT,
  IMDS_VERSION: () => IMDS_VERSION,
  INVALID_GRANT_ERROR: () => INVALID_GRANT_ERROR,
  INVALID_INSTANCE: () => INVALID_INSTANCE,
  JsonWebTokenTypes: () => JsonWebTokenTypes,
  KNOWN_PUBLIC_CLOUDS: () => KNOWN_PUBLIC_CLOUDS,
  NOT_APPLICABLE: () => NOT_APPLICABLE,
  NOT_AVAILABLE: () => NOT_AVAILABLE,
  OAuthResponseType: () => OAuthResponseType,
  OFFLINE_ACCESS_SCOPE: () => OFFLINE_ACCESS_SCOPE,
  OIDC_DEFAULT_SCOPES: () => OIDC_DEFAULT_SCOPES,
  OIDC_SCOPES: () => OIDC_SCOPES,
  ONE_DAY_IN_MS: () => ONE_DAY_IN_MS,
  OPENID_SCOPE: () => OPENID_SCOPE,
  PROFILE_SCOPE: () => PROFILE_SCOPE,
  PasswordGrantConstants: () => PasswordGrantConstants,
  PersistentCacheKeys: () => PersistentCacheKeys,
  PromptValue: () => PromptValue,
  REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: () => REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX,
  RESOURCE_DELIM: () => RESOURCE_DELIM,
  RegionDiscoveryOutcomes: () => RegionDiscoveryOutcomes,
  RegionDiscoverySources: () => RegionDiscoverySources,
  ResponseMode: () => ResponseMode,
  S256_CODE_CHALLENGE_METHOD: () => S256_CODE_CHALLENGE_METHOD,
  SERVER_TELEM_CACHE_KEY: () => SERVER_TELEM_CACHE_KEY,
  SERVER_TELEM_CATEGORY_SEPARATOR: () => SERVER_TELEM_CATEGORY_SEPARATOR,
  SERVER_TELEM_MAX_CACHED_ERRORS: () => SERVER_TELEM_MAX_CACHED_ERRORS,
  SERVER_TELEM_MAX_CUR_HEADER_BYTES: () => SERVER_TELEM_MAX_CUR_HEADER_BYTES,
  SERVER_TELEM_MAX_LAST_HEADER_BYTES: () => SERVER_TELEM_MAX_LAST_HEADER_BYTES,
  SERVER_TELEM_OVERFLOW_FALSE: () => SERVER_TELEM_OVERFLOW_FALSE,
  SERVER_TELEM_OVERFLOW_TRUE: () => SERVER_TELEM_OVERFLOW_TRUE,
  SERVER_TELEM_SCHEMA_VERSION: () => SERVER_TELEM_SCHEMA_VERSION,
  SERVER_TELEM_UNKNOWN_ERROR: () => SERVER_TELEM_UNKNOWN_ERROR,
  SERVER_TELEM_VALUE_SEPARATOR: () => SERVER_TELEM_VALUE_SEPARATOR,
  SHR_NONCE_VALIDITY: () => SHR_NONCE_VALIDITY,
  SKU: () => SKU,
  THE_FAMILY_ID: () => THE_FAMILY_ID,
  THROTTLING_PREFIX: () => THROTTLING_PREFIX,
  URL_FORM_CONTENT_TYPE: () => URL_FORM_CONTENT_TYPE,
  X_MS_LIB_CAPABILITY_VALUE: () => X_MS_LIB_CAPABILITY_VALUE
});
var SKU = "msal.js.common";
var DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common/";
var DEFAULT_AUTHORITY_HOST = "login.microsoftonline.com";
var DEFAULT_COMMON_TENANT = "common";
var ADFS = "adfs";
var AAD_INSTANCE_DISCOVERY_ENDPT = `${DEFAULT_AUTHORITY}discovery/instance?api-version=1.1&authorization_endpoint=`;
var CIAM_AUTH_URL = ".ciamlogin.com";
var AAD_TENANT_DOMAIN_SUFFIX = ".onmicrosoft.com";
var RESOURCE_DELIM = "|";
var CONSUMER_UTID = "9188040d-6c67-4c5b-b112-36a304b66dad";
var OPENID_SCOPE = "openid";
var PROFILE_SCOPE = "profile";
var OFFLINE_ACCESS_SCOPE = "offline_access";
var EMAIL_SCOPE = "email";
var CODE_GRANT_TYPE = "authorization_code";
var S256_CODE_CHALLENGE_METHOD = "S256";
var URL_FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
var AUTHORIZATION_PENDING = "authorization_pending";
var NOT_APPLICABLE = "N/A";
var NOT_AVAILABLE = "Not Available";
var FORWARD_SLASH = "/";
var IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute";
var IMDS_VERSION = "2021-02-01";
var IMDS_TIMEOUT = 2e3;
var AZURE_REGION_AUTO_DISCOVER_FLAG = "TryAutoDetect";
var REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX = "login.microsoft.com";
var KNOWN_PUBLIC_CLOUDS = [
  "login.microsoftonline.com",
  "login.windows.net",
  "login.microsoft.com",
  "sts.windows.net"
];
var SHR_NONCE_VALIDITY = 240;
var INVALID_INSTANCE = "invalid_instance";
var HTTP_SUCCESS = 200;
var HTTP_SUCCESS_RANGE_START = 200;
var HTTP_SUCCESS_RANGE_END = 299;
var HTTP_REDIRECT = 302;
var HTTP_CLIENT_ERROR = 400;
var HTTP_CLIENT_ERROR_RANGE_START = 400;
var HTTP_BAD_REQUEST = 400;
var HTTP_UNAUTHORIZED = 401;
var HTTP_NOT_FOUND = 404;
var HTTP_REQUEST_TIMEOUT = 408;
var HTTP_GONE = 410;
var HTTP_TOO_MANY_REQUESTS = 429;
var HTTP_CLIENT_ERROR_RANGE_END = 499;
var HTTP_SERVER_ERROR = 500;
var HTTP_SERVER_ERROR_RANGE_START = 500;
var HTTP_SERVICE_UNAVAILABLE = 503;
var HTTP_GATEWAY_TIMEOUT = 504;
var HTTP_SERVER_ERROR_RANGE_END = 599;
var HTTP_MULTI_SIDED_ERROR = 600;
var HttpMethod = {
  GET: "GET",
  POST: "POST"
};
var OIDC_DEFAULT_SCOPES = [
  OPENID_SCOPE,
  PROFILE_SCOPE,
  OFFLINE_ACCESS_SCOPE
];
var OIDC_SCOPES = [...OIDC_DEFAULT_SCOPES, EMAIL_SCOPE];
var HeaderNames = {
  CONTENT_TYPE: "Content-Type",
  CONTENT_LENGTH: "Content-Length",
  DPOP: "DPoP",
  RETRY_AFTER: "Retry-After",
  CCS_HEADER: "X-AnchorMailbox",
  WWWAuthenticate: "WWW-Authenticate",
  AuthenticationInfo: "Authentication-Info",
  X_MS_REQUEST_ID: "x-ms-request-id",
  X_MS_HTTP_VERSION: "x-ms-httpver"
};
var PersistentCacheKeys = {
  ACTIVE_ACCOUNT_FILTERS: "active-account-filters"
  // new cache entry for active_account for a more robust version for browser
};
var AADAuthority = {
  COMMON: "common",
  ORGANIZATIONS: "organizations",
  CONSUMERS: "consumers"
};
var ClaimsRequestKeys = {
  ACCESS_TOKEN: "access_token",
  XMS_CC: "xms_cc",
  ID_TOKEN: "id_token",
  SIGNIN_STATE: "signin_state",
  LOGIN_HINT: "login_hint",
  TENANT_REGION_SUB_SCOPE: "tenant_region_sub_scope"
};
var PromptValue = {
  LOGIN: "login",
  SELECT_ACCOUNT: "select_account",
  CONSENT: "consent",
  NONE: "none",
  CREATE: "create",
  NO_SESSION: "no_session"
};
var CodeChallengeMethodValues = {
  PLAIN: "plain",
  S256: "S256"
};
var OAuthResponseType = {
  CODE: "code",
  IDTOKEN_TOKEN: "id_token token",
  IDTOKEN_TOKEN_REFRESHTOKEN: "id_token token refresh_token"
};
var ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post"
};
var GrantType = {
  IMPLICIT_GRANT: "implicit",
  AUTHORIZATION_CODE_GRANT: "authorization_code",
  CLIENT_CREDENTIALS_GRANT: "client_credentials",
  RESOURCE_OWNER_PASSWORD_GRANT: "password",
  REFRESH_TOKEN_GRANT: "refresh_token",
  DEVICE_CODE_GRANT: "device_code",
  JWT_BEARER: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  USER_FIC: "user_fic"
};
var CACHE_ACCOUNT_TYPE_MSSTS = "MSSTS";
var CACHE_ACCOUNT_TYPE_ADFS = "ADFS";
var CACHE_ACCOUNT_TYPE_MSAV1 = "MSA";
var CACHE_ACCOUNT_TYPE_GENERIC = "Generic";
var CACHE_KEY_SEPARATOR = "-";
var CLIENT_INFO_SEPARATOR = ".";
var CredentialType = {
  ID_TOKEN: "IdToken",
  ACCESS_TOKEN: "AccessToken",
  ACCESS_TOKEN_WITH_AUTH_SCHEME: "AccessToken_With_AuthScheme",
  REFRESH_TOKEN: "RefreshToken"
};
var CacheType = {
  ADFS: 1001,
  MSA: 1002,
  MSSTS: 1003,
  GENERIC: 1004,
  ACCESS_TOKEN: 2001,
  REFRESH_TOKEN: 2002,
  ID_TOKEN: 2003,
  APP_METADATA: 3001,
  UNDEFINED: 9999
};
var APP_METADATA = "appmetadata";
var CLIENT_INFO2 = "client_info";
var THE_FAMILY_ID = "1";
var AUTHORITY_METADATA_CACHE_KEY = "authority-metadata";
var AUTHORITY_METADATA_REFRESH_TIME_SECONDS = 3600 * 24;
var AuthorityMetadataSource = {
  CONFIG: "config",
  CACHE: "cache",
  NETWORK: "network",
  HARDCODED_VALUES: "hardcoded_values"
};
var SERVER_TELEM_SCHEMA_VERSION = 5;
var SERVER_TELEM_MAX_CUR_HEADER_BYTES = 80;
var SERVER_TELEM_MAX_LAST_HEADER_BYTES = 330;
var SERVER_TELEM_MAX_CACHED_ERRORS = 50;
var SERVER_TELEM_CACHE_KEY = "server-telemetry";
var SERVER_TELEM_CATEGORY_SEPARATOR = "|";
var SERVER_TELEM_VALUE_SEPARATOR = ",";
var SERVER_TELEM_OVERFLOW_TRUE = "1";
var SERVER_TELEM_OVERFLOW_FALSE = "0";
var SERVER_TELEM_UNKNOWN_ERROR = "unknown_error";
var AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  DPOP: "DPoP",
  SSH: "ssh-cert"
};
var DEFAULT_THROTTLE_TIME_SECONDS = 60;
var DEFAULT_MAX_THROTTLE_TIME_SECONDS = 3600;
var THROTTLING_PREFIX = "throttling";
var X_MS_LIB_CAPABILITY_VALUE = "retry-after, h429";
var INVALID_GRANT_ERROR = "invalid_grant";
var CLIENT_MISMATCH_ERROR = "client_mismatch";
var PasswordGrantConstants = {
  username: "username",
  password: "password"
};
var RegionDiscoverySources = {
  FAILED_AUTO_DETECTION: "1",
  INTERNAL_CACHE: "2",
  ENVIRONMENT_VARIABLE: "3",
  IMDS: "4"
};
var RegionDiscoveryOutcomes = {
  CONFIGURED_MATCHES_DETECTED: "1",
  CONFIGURED_NO_AUTO_DETECTION: "2",
  CONFIGURED_NOT_DETECTED: "3",
  AUTO_DETECTION_REQUESTED_SUCCESSFUL: "4",
  AUTO_DETECTION_REQUESTED_FAILED: "5"
};
var CacheOutcome = {
  // When a token is found in the cache or the cache is not supposed to be hit when making the request
  NOT_APPLICABLE: "0",
  // When the token request goes to the identity provider because force_refresh was set to true. Also occurs if claims were requested
  FORCE_REFRESH_OR_CLAIMS: "1",
  // When the token request goes to the identity provider because no cached access token exists
  NO_CACHED_ACCESS_TOKEN: "2",
  // When the token request goes to the identity provider because cached access token expired
  CACHED_ACCESS_TOKEN_EXPIRED: "3",
  // When the token request goes to the identity provider because refresh_in was used and the existing token needs to be refreshed
  PROACTIVELY_REFRESHED: "4"
};
var JsonWebTokenTypes = {
  Jwt: "JWT",
  Jwk: "JWK",
  Pop: "pop",
  Dpop: "dpop+jwt"
};
var ONE_DAY_IN_MS = 864e5;
var DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;
var EncodingTypes = {
  BASE64: "base64",
  HEX: "hex",
  UTF8: "utf-8"
};

// node_modules/@azure/msal-common/dist/error/AuthError.mjs
function getDefaultErrorMessage(code) {
  return `See https://aka.ms/msal.js.errors#${code} for details`;
}
var AuthError = class _AuthError extends Error {
  constructor(errorCode, correlationId, errorMessage, suberror) {
    const message = errorMessage || (errorCode ? getDefaultErrorMessage(errorCode) : "");
    const errorString = message ? `${errorCode}: ${message}` : errorCode;
    super(errorString);
    Object.setPrototypeOf(this, _AuthError.prototype);
    this.errorCode = errorCode || "";
    this.errorMessage = message || "";
    this.subError = suberror || "";
    this.correlationId = correlationId;
    this.name = "AuthError";
  }
};
function createAuthError(code, correlationId, additionalMessage) {
  return new AuthError(code, correlationId, additionalMessage || getDefaultErrorMessage(code));
}

// node_modules/@azure/msal-common/dist/error/ClientAuthError.mjs
var ClientAuthError = class _ClientAuthError extends AuthError {
  constructor(errorCode, correlationId, additionalMessage) {
    super(errorCode, correlationId, additionalMessage);
    this.name = "ClientAuthError";
    Object.setPrototypeOf(this, _ClientAuthError.prototype);
  }
};
function createClientAuthError(errorCode, correlationId, additionalMessage) {
  return new ClientAuthError(errorCode, correlationId, additionalMessage);
}

// node_modules/@azure/msal-common/dist/error/ClientAuthErrorCodes.mjs
var ClientAuthErrorCodes_exports = {};
__export(ClientAuthErrorCodes_exports, {
  authorizationCodeMissingFromServerResponse: () => authorizationCodeMissingFromServerResponse,
  bindingKeyNotRemoved: () => bindingKeyNotRemoved,
  cannotAppendScopeSet: () => cannotAppendScopeSet,
  cannotRemoveEmptyScope: () => cannotRemoveEmptyScope,
  clientInfoDecodingError: () => clientInfoDecodingError,
  clientInfoEmptyError: () => clientInfoEmptyError,
  dpopTokenTypeMismatch: () => dpopTokenTypeMismatch,
  emptyInputScopeSet: () => emptyInputScopeSet,
  endSessionEndpointNotSupported: () => endSessionEndpointNotSupported,
  endpointResolutionError: () => endpointResolutionError,
  hashNotDeserialized: () => hashNotDeserialized,
  invalidCacheEnvironment: () => invalidCacheEnvironment,
  invalidCacheRecord: () => invalidCacheRecord,
  invalidState: () => invalidState,
  keyIdMissing: () => keyIdMissing,
  methodNotImplemented: () => methodNotImplemented,
  misplacedResourceParam: () => misplacedResourceParam,
  multipleMatchingAppMetadata: () => multipleMatchingAppMetadata,
  multipleMatchingTokens: () => multipleMatchingTokens,
  nestedAppAuthBridgeDisabled: () => nestedAppAuthBridgeDisabled,
  networkError: () => networkError,
  noAccountFound: () => noAccountFound,
  noAccountInSilentRequest: () => noAccountInSilentRequest,
  noCryptoObject: () => noCryptoObject,
  noNetworkConnectivity: () => noNetworkConnectivity,
  nonceMismatch: () => nonceMismatch,
  nullOrEmptyToken: () => nullOrEmptyToken,
  openIdConfigError: () => openIdConfigError,
  platformBrokerError: () => platformBrokerError,
  requestCannotBeMade: () => requestCannotBeMade,
  resourceParameterRequired: () => resourceParameterRequired,
  stateMismatch: () => stateMismatch,
  stateNotFound: () => stateNotFound,
  tokenClaimsCnfRequiredForSignedJwt: () => tokenClaimsCnfRequiredForSignedJwt,
  tokenParsingError: () => tokenParsingError,
  tokenRefreshRequired: () => tokenRefreshRequired,
  unexpectedCredentialType: () => unexpectedCredentialType,
  userCanceled: () => userCanceled
});
var clientInfoDecodingError = "client_info_decoding_error";
var clientInfoEmptyError = "client_info_empty_error";
var tokenParsingError = "token_parsing_error";
var nullOrEmptyToken = "null_or_empty_token";
var endpointResolutionError = "endpoints_resolution_error";
var networkError = "network_error";
var openIdConfigError = "openid_config_error";
var hashNotDeserialized = "hash_not_deserialized";
var invalidState = "invalid_state";
var stateMismatch = "state_mismatch";
var stateNotFound = "state_not_found";
var nonceMismatch = "nonce_mismatch";
var multipleMatchingTokens = "multiple_matching_tokens";
var multipleMatchingAppMetadata = "multiple_matching_appMetadata";
var requestCannotBeMade = "request_cannot_be_made";
var cannotRemoveEmptyScope = "cannot_remove_empty_scope";
var cannotAppendScopeSet = "cannot_append_scopeset";
var emptyInputScopeSet = "empty_input_scopeset";
var noAccountInSilentRequest = "no_account_in_silent_request";
var invalidCacheRecord = "invalid_cache_record";
var invalidCacheEnvironment = "invalid_cache_environment";
var noAccountFound = "no_account_found";
var noCryptoObject = "no_crypto_object";
var unexpectedCredentialType = "unexpected_credential_type";
var dpopTokenTypeMismatch = "dpop_token_type_mismatch";
var tokenRefreshRequired = "token_refresh_required";
var tokenClaimsCnfRequiredForSignedJwt = "token_claims_cnf_required_for_signedjwt";
var authorizationCodeMissingFromServerResponse = "authorization_code_missing_from_server_response";
var bindingKeyNotRemoved = "binding_key_not_removed";
var endSessionEndpointNotSupported = "end_session_endpoint_not_supported";
var keyIdMissing = "key_id_missing";
var noNetworkConnectivity = "no_network_connectivity";
var userCanceled = "user_canceled";
var methodNotImplemented = "method_not_implemented";
var nestedAppAuthBridgeDisabled = "nested_app_auth_bridge_disabled";
var platformBrokerError = "platform_broker_error";
var resourceParameterRequired = "resource_parameter_required";
var misplacedResourceParam = "misplaced_resource_parameter";

// node_modules/@azure/msal-common/dist/account/ClientInfo.mjs
function buildClientInfo(rawClientInfo, base64Decode) {
  if (!rawClientInfo) {
    throw createClientAuthError(clientInfoEmptyError, "");
  }
  try {
    const decodedClientInfo = base64Decode(rawClientInfo);
    return JSON.parse(decodedClientInfo);
  } catch (e) {
    throw createClientAuthError(clientInfoDecodingError, "");
  }
}
function buildClientInfoFromHomeAccountId(homeAccountId) {
  if (!homeAccountId) {
    throw createClientAuthError(clientInfoDecodingError, "");
  }
  const clientInfoParts = homeAccountId.split(CLIENT_INFO_SEPARATOR, 2);
  return {
    uid: clientInfoParts[0],
    utid: clientInfoParts.length < 2 ? "" : clientInfoParts[1]
  };
}

// node_modules/@azure/msal-common/dist/account/AuthToken.mjs
function extractTokenClaims(encodedToken, base64Decode, correlationId) {
  const jswPayload = getJWSPayload(encodedToken, correlationId);
  try {
    const base64Decoded = base64Decode(jswPayload);
    return JSON.parse(base64Decoded);
  } catch (err) {
    throw createClientAuthError(tokenParsingError, correlationId);
  }
}
function isKmsi(idTokenClaims) {
  if (!idTokenClaims.signin_state) {
    return false;
  }
  const kmsiClaims = ["kmsi", "dvc_dmjd"];
  return idTokenClaims.signin_state.some((value) => kmsiClaims.includes(value.trim().toLowerCase()));
}
function getJWSPayload(authToken, correlationId) {
  if (!authToken) {
    throw createClientAuthError(nullOrEmptyToken, correlationId);
  }
  const tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
  const matches = tokenPartsRegex.exec(authToken);
  if (!matches || matches.length < 4) {
    throw createClientAuthError(tokenParsingError, correlationId);
  }
  return matches[2];
}

// node_modules/@azure/msal-common/dist/account/AccountInfo.mjs
function tenantIdMatchesHomeTenant(tenantId, homeAccountId) {
  return !!tenantId && !!homeAccountId && tenantId === homeAccountId.split(".")[1];
}
function buildTenantProfile(homeAccountId, localAccountId, tenantId, nativeAccountId, idTokenClaims) {
  if (idTokenClaims) {
    const { oid, sub, tid, name: name3, tfp, acr, preferred_username, upn, login_hint } = idTokenClaims;
    const tenantId2 = tid || tfp || acr || "";
    return {
      tenantId: tenantId2,
      localAccountId: oid || sub || "",
      name: name3,
      username: preferred_username || upn || "",
      loginHint: login_hint,
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId2, homeAccountId),
      upn,
      ...nativeAccountId && { nativeAccountId }
    };
  } else {
    return {
      tenantId,
      localAccountId,
      username: "",
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId),
      ...nativeAccountId && { nativeAccountId }
    };
  }
}
function updateAccountTenantProfileData(baseAccountInfo, tenantProfile, idTokenClaims, idTokenSecret) {
  let updatedAccountInfo = baseAccountInfo;
  if (tenantProfile) {
    const { isHomeTenant, ...tenantProfileOverride } = tenantProfile;
    updatedAccountInfo = { ...baseAccountInfo, ...tenantProfileOverride };
  }
  if (idTokenClaims) {
    const { isHomeTenant, ...claimsSourcedTenantProfile } = buildTenantProfile(baseAccountInfo.homeAccountId, baseAccountInfo.localAccountId, baseAccountInfo.tenantId, updatedAccountInfo.nativeAccountId, idTokenClaims);
    updatedAccountInfo = {
      ...updatedAccountInfo,
      ...claimsSourcedTenantProfile,
      idTokenClaims,
      idToken: idTokenSecret,
      kmsi: isKmsi(idTokenClaims)
    };
    return updatedAccountInfo;
  }
  return updatedAccountInfo;
}

// node_modules/@azure/msal-common/dist/authority/AuthorityType.mjs
var AuthorityType = {
  Default: 0,
  Adfs: 1,
  Ciam: 3
};

// node_modules/@azure/msal-common/dist/account/TokenClaims.mjs
function getTenantIdFromIdTokenClaims(idTokenClaims) {
  if (idTokenClaims) {
    const tenantId = idTokenClaims.tid || idTokenClaims.tfp || idTokenClaims.acr;
    return tenantId || null;
  }
  return null;
}

// node_modules/@azure/msal-common/dist/authority/ProtocolMode.mjs
var ProtocolMode = {
  /**
   * Auth Code + PKCE with Entra ID (formerly AAD) specific optimizations and features
   */
  AAD: "AAD",
  /**
   * Auth Code + PKCE without Entra ID specific optimizations and features. For use only with non-Microsoft owned authorities.
   * Support is limited for this mode.
   */
  OIDC: "OIDC",
  /**
   * Encrypted Authorize Response (EAR) with Entra ID specific optimizations and features
   */
  EAR: "EAR"
};

// node_modules/@azure/msal-common/dist/cache/utils/AccountEntityUtils.mjs
function generateAccountId(accountEntity) {
  const accountId = [
    accountEntity.homeAccountId,
    accountEntity.environment
  ];
  return accountId.join(CACHE_KEY_SEPARATOR).toLowerCase();
}
function getAccountInfo(accountEntity) {
  const tenantProfiles = accountEntity.tenantProfiles || [];
  if (tenantProfiles.length === 0 && accountEntity.realm && accountEntity.localAccountId) {
    tenantProfiles.push(buildTenantProfile(accountEntity.homeAccountId, accountEntity.localAccountId, accountEntity.realm, accountEntity.nativeAccountId));
  }
  const homeTenantProfile = tenantProfiles.find((tp) => tp.tenantId === accountEntity.realm);
  const nativeAccountId = homeTenantProfile?.nativeAccountId || accountEntity.nativeAccountId;
  return {
    homeAccountId: accountEntity.homeAccountId,
    environment: accountEntity.environment,
    tenantId: accountEntity.realm,
    username: accountEntity.username,
    localAccountId: accountEntity.localAccountId,
    loginHint: accountEntity.loginHint,
    name: accountEntity.name,
    nativeAccountId,
    authorityType: accountEntity.authorityType,
    // Deserialize tenant profiles array into a Map
    tenantProfiles: new Map(tenantProfiles.map((tenantProfile) => {
      return [tenantProfile.tenantId, tenantProfile];
    })),
    dataBoundary: accountEntity.dataBoundary
  };
}
function isSingleTenant(accountEntity) {
  return !accountEntity.tenantProfiles;
}
function createAccountEntity(accountDetails, authority, correlationId, base64Decode) {
  let authorityType;
  if (authority.authorityType === AuthorityType.Adfs) {
    authorityType = CACHE_ACCOUNT_TYPE_ADFS;
  } else if (authority.protocolMode === ProtocolMode.OIDC) {
    authorityType = CACHE_ACCOUNT_TYPE_GENERIC;
  } else {
    authorityType = CACHE_ACCOUNT_TYPE_MSSTS;
  }
  let clientInfo;
  let dataBoundary;
  if (accountDetails.clientInfo && base64Decode) {
    clientInfo = buildClientInfo(accountDetails.clientInfo, base64Decode);
    if (clientInfo.xms_tdbr) {
      dataBoundary = clientInfo.xms_tdbr === "EU" ? "EU" : "None";
    }
  }
  const env = accountDetails.environment || authority && authority.getPreferredCache();
  if (!env) {
    throw createClientAuthError(invalidCacheEnvironment, correlationId);
  }
  const preferredUsername = accountDetails.idTokenClaims?.preferred_username || accountDetails.idTokenClaims?.upn;
  const email = accountDetails.idTokenClaims?.emails ? accountDetails.idTokenClaims.emails[0] : null;
  const username = preferredUsername || email || "";
  const loginHint = accountDetails.idTokenClaims?.login_hint;
  const realm = clientInfo?.utid || getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) || "";
  const localAccountId = clientInfo?.uid || accountDetails.idTokenClaims?.oid || accountDetails.idTokenClaims?.sub || "";
  let tenantProfiles;
  if (accountDetails.tenantProfiles) {
    tenantProfiles = accountDetails.tenantProfiles;
  } else {
    const tenantProfile = buildTenantProfile(accountDetails.homeAccountId, localAccountId, realm, accountDetails.nativeAccountId, accountDetails.idTokenClaims);
    tenantProfiles = [tenantProfile];
  }
  return {
    homeAccountId: accountDetails.homeAccountId,
    environment: env,
    realm,
    localAccountId,
    username,
    authorityType,
    loginHint,
    clientInfo: accountDetails.clientInfo,
    name: accountDetails.idTokenClaims?.name || "",
    lastModificationTime: void 0,
    lastModificationApp: void 0,
    cloudGraphHostName: accountDetails.cloudGraphHostName,
    msGraphHost: accountDetails.msGraphHost,
    nativeAccountId: accountDetails.nativeAccountId,
    tenantProfiles,
    dataBoundary
  };
}
function createAccountEntityFromAccountInfo(accountInfo, cloudGraphHostName, msGraphHost) {
  const tenantProfiles = Array.from(accountInfo.tenantProfiles?.values() || []);
  if (tenantProfiles.length === 0 && accountInfo.tenantId && accountInfo.localAccountId) {
    tenantProfiles.push(buildTenantProfile(accountInfo.homeAccountId, accountInfo.localAccountId, accountInfo.tenantId, accountInfo.nativeAccountId, accountInfo.idTokenClaims));
  } else if (accountInfo.nativeAccountId) {
    const matchingProfile = tenantProfiles.find((tp) => tp.tenantId === accountInfo.tenantId);
    if (matchingProfile && !matchingProfile.nativeAccountId) {
      matchingProfile.nativeAccountId = accountInfo.nativeAccountId;
    }
  }
  return {
    authorityType: accountInfo.authorityType || CACHE_ACCOUNT_TYPE_GENERIC,
    homeAccountId: accountInfo.homeAccountId,
    localAccountId: accountInfo.localAccountId,
    nativeAccountId: accountInfo.nativeAccountId,
    realm: accountInfo.tenantId,
    environment: accountInfo.environment,
    username: accountInfo.username,
    loginHint: accountInfo.loginHint,
    name: accountInfo.name,
    cloudGraphHostName,
    msGraphHost,
    tenantProfiles,
    dataBoundary: accountInfo.dataBoundary
  };
}
function generateHomeAccountId(serverClientInfo, authType, logger, cryptoObj, correlationId, idTokenClaims) {
  if (authType !== AuthorityType.Adfs) {
    if (serverClientInfo) {
      try {
        const clientInfo = buildClientInfo(serverClientInfo, cryptoObj.base64Decode);
        if (clientInfo.uid && clientInfo.utid) {
          return `${clientInfo.uid}.${clientInfo.utid}`;
        }
      } catch (e) {
      }
    }
    logger.warning("No client info in response", correlationId);
  }
  return idTokenClaims?.sub || "";
}
function isAccountEntity(entity) {
  if (!entity) {
    return false;
  }
  return entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("realm") && entity.hasOwnProperty("localAccountId") && entity.hasOwnProperty("username") && entity.hasOwnProperty("authorityType");
}

// node_modules/@azure/msal-common/dist/error/AuthErrorCodes.mjs
var AuthErrorCodes_exports = {};
__export(AuthErrorCodes_exports, {
  postRequestFailed: () => postRequestFailed,
  unexpectedError: () => unexpectedError
});
var unexpectedError = "unexpected_error";
var postRequestFailed = "post_request_failed";

// node_modules/@azure/msal-common/dist/error/ClientConfigurationError.mjs
var ClientConfigurationError = class _ClientConfigurationError extends AuthError {
  constructor(errorCode, correlationId) {
    super(errorCode, correlationId);
    this.name = "ClientConfigurationError";
    Object.setPrototypeOf(this, _ClientConfigurationError.prototype);
  }
};
function createClientConfigurationError(errorCode, correlationId) {
  return new ClientConfigurationError(errorCode, correlationId);
}

// node_modules/@azure/msal-common/dist/error/ClientConfigurationErrorCodes.mjs
var ClientConfigurationErrorCodes_exports = {};
__export(ClientConfigurationErrorCodes_exports, {
  authorityMismatch: () => authorityMismatch,
  authorityUriInsecure: () => authorityUriInsecure,
  cannotAllowPlatformBroker: () => cannotAllowPlatformBroker,
  cannotSetOIDCOptions: () => cannotSetOIDCOptions,
  claimsRequestParsingError: () => claimsRequestParsingError,
  dpopMissingResourceContext: () => dpopMissingResourceContext,
  emptyInputScopesError: () => emptyInputScopesError,
  invalidAuthenticationHeader: () => invalidAuthenticationHeader,
  invalidAuthorityMetadata: () => invalidAuthorityMetadata,
  invalidClaims: () => invalidClaims,
  invalidCloudDiscoveryMetadata: () => invalidCloudDiscoveryMetadata,
  invalidCodeChallengeMethod: () => invalidCodeChallengeMethod,
  invalidDpopHtm: () => invalidDpopHtm,
  invalidDpopHtu: () => invalidDpopHtu,
  invalidDpopNonce: () => invalidDpopNonce,
  invalidPlatformBrokerConfiguration: () => invalidPlatformBrokerConfiguration,
  invalidRequestMethodForEAR: () => invalidRequestMethodForEAR,
  invalidResponseMode: () => invalidResponseMode,
  issuerValidationFailed: () => issuerValidationFailed,
  logoutRequestEmpty: () => logoutRequestEmpty,
  missingNonceAuthenticationHeader: () => missingNonceAuthenticationHeader,
  missingSshJwk: () => missingSshJwk,
  missingSshKid: () => missingSshKid,
  pkceParamsMissing: () => pkceParamsMissing,
  redirectUriEmpty: () => redirectUriEmpty,
  tokenRequestEmpty: () => tokenRequestEmpty,
  unsupportedAuthenticationScheme: () => unsupportedAuthenticationScheme,
  untrustedAuthority: () => untrustedAuthority,
  urlEmptyError: () => urlEmptyError,
  urlParseError: () => urlParseError
});
var redirectUriEmpty = "redirect_uri_empty";
var claimsRequestParsingError = "claims_request_parsing_error";
var authorityUriInsecure = "authority_uri_insecure";
var urlParseError = "url_parse_error";
var urlEmptyError = "empty_url_error";
var emptyInputScopesError = "empty_input_scopes_error";
var invalidClaims = "invalid_claims";
var tokenRequestEmpty = "token_request_empty";
var logoutRequestEmpty = "logout_request_empty";
var invalidCodeChallengeMethod = "invalid_code_challenge_method";
var pkceParamsMissing = "pkce_params_missing";
var invalidCloudDiscoveryMetadata = "invalid_cloud_discovery_metadata";
var invalidAuthorityMetadata = "invalid_authority_metadata";
var untrustedAuthority = "untrusted_authority";
var missingSshJwk = "missing_ssh_jwk";
var missingSshKid = "missing_ssh_kid";
var unsupportedAuthenticationScheme = "unsupported_authentication_scheme";
var missingNonceAuthenticationHeader = "missing_nonce_authentication_header";
var invalidAuthenticationHeader = "invalid_authentication_header";
var cannotSetOIDCOptions = "cannot_set_OIDCOptions";
var cannotAllowPlatformBroker = "cannot_allow_platform_broker";
var authorityMismatch = "authority_mismatch";
var invalidRequestMethodForEAR = "invalid_request_method_for_EAR";
var invalidPlatformBrokerConfiguration = "invalid_platform_broker_configuration";
var issuerValidationFailed = "issuer_validation_failed";
var invalidResponseMode = "invalid_response_mode";
var invalidDpopHtm = "invalid_dpop_htm";
var invalidDpopHtu = "invalid_dpop_htu";
var invalidDpopNonce = "invalid_dpop_nonce";
var dpopMissingResourceContext = "dpop_missing_resource_context";

// node_modules/@azure/msal-common/dist/authority/OpenIdConfigResponse.mjs
function isOpenIdConfigResponse(response) {
  return response.hasOwnProperty("authorization_endpoint") && response.hasOwnProperty("token_endpoint") && response.hasOwnProperty("issuer") && response.hasOwnProperty("jwks_uri");
}

// node_modules/@azure/msal-common/dist/utils/StringUtils.mjs
var StringUtils = class {
  /**
   * Check if stringified object is empty
   * @param strObj
   */
  static isEmptyObj(strObj) {
    if (strObj) {
      try {
        const obj = JSON.parse(strObj);
        return Object.keys(obj).length === 0;
      } catch (e) {
      }
    }
    return true;
  }
  static startsWith(str, search) {
    return str.indexOf(search) === 0;
  }
  static endsWith(str, search) {
    return str.length >= search.length && str.lastIndexOf(search) === str.length - search.length;
  }
  /**
   * Parses string into an object.
   *
   * @param query
   */
  static queryStringToObject(query) {
    const obj = {};
    const params = query.split("&");
    const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
    params.forEach((pair) => {
      if (pair.trim()) {
        const [key, value] = pair.split(/=(.+)/g, 2);
        if (key && value) {
          obj[decode(key)] = decode(value);
        }
      }
    });
    return obj;
  }
  /**
   * Trims entries in an array.
   *
   * @param arr
   */
  static trimArrayEntries(arr) {
    return arr.map((entry) => entry.trim());
  }
  /**
   * Removes empty strings from array
   * @param arr
   */
  static removeEmptyStringsFromArray(arr) {
    return arr.filter((entry) => {
      return !!entry;
    });
  }
  /**
   * Attempts to parse a string into JSON
   * @param str
   */
  static jsonParseHelper(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }
};

// node_modules/@azure/msal-common/dist/url/UrlString.mjs
var UrlString = class _UrlString {
  get urlString() {
    return this._urlString;
  }
  constructor(url, correlationId) {
    this._urlString = url;
    this.correlationId = correlationId;
    if (!this._urlString) {
      throw createClientConfigurationError(urlEmptyError, correlationId);
    }
    if (!url.includes("#")) {
      this._urlString = _UrlString.canonicalizeUri(url);
    }
  }
  /**
   * Ensure urls are lower case and end with a / character.
   * @param url
   */
  static canonicalizeUri(url) {
    if (url) {
      let lowerCaseUrl = url.toLowerCase();
      if (StringUtils.endsWith(lowerCaseUrl, "?")) {
        lowerCaseUrl = lowerCaseUrl.slice(0, -1);
      } else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
        lowerCaseUrl = lowerCaseUrl.slice(0, -2);
      }
      if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
        lowerCaseUrl += "/";
      }
      return lowerCaseUrl;
    }
    return url;
  }
  /**
   * Throws if urlString passed is not a valid authority URI string.
   */
  validateAsUri() {
    let components;
    try {
      components = this.getUrlComponents();
    } catch (e) {
      throw createClientConfigurationError(urlParseError, this.correlationId);
    }
    if (!components.HostNameAndPort || !components.PathSegments) {
      throw createClientConfigurationError(urlParseError, this.correlationId);
    }
    if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
      throw createClientConfigurationError(authorityUriInsecure, this.correlationId);
    }
  }
  /**
   * Given a url and a query string return the url with provided query string appended
   * @param url
   * @param queryString
   */
  static appendQueryString(url, queryString) {
    if (!queryString) {
      return url;
    }
    return url.indexOf("?") < 0 ? `${url}?${queryString}` : `${url}&${queryString}`;
  }
  /**
   * Returns a url with the hash removed
   * @param url
   */
  static removeHashFromUrl(url) {
    return _UrlString.canonicalizeUri(url.split("#")[0]);
  }
  /**
   * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
   * @param href The url
   * @param tenantId The tenant id to replace
   */
  replaceTenantPath(tenantId) {
    const urlObject = this.getUrlComponents();
    const pathArray = urlObject.PathSegments;
    if (tenantId && pathArray.length !== 0 && (pathArray[0] === AADAuthority.COMMON || pathArray[0] === AADAuthority.ORGANIZATIONS)) {
      pathArray[0] = tenantId;
    }
    return _UrlString.constructAuthorityUriFromObject(urlObject, this.correlationId);
  }
  /**
   * Parses out the components from a url string.
   * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
   */
  getUrlComponents() {
    const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    const match = this.urlString.match(regEx);
    if (!match) {
      throw createClientConfigurationError(urlParseError, this.correlationId);
    }
    const urlComponents = {
      Protocol: match[1],
      HostNameAndPort: match[4],
      AbsolutePath: match[5],
      QueryString: match[7]
    };
    let pathSegments = urlComponents.AbsolutePath.split("/");
    pathSegments = pathSegments.filter((val) => val && val.length > 0);
    urlComponents.PathSegments = pathSegments;
    if (urlComponents.QueryString && urlComponents.QueryString.endsWith("/")) {
      urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length - 1);
    }
    return urlComponents;
  }
  static getDomainFromUrl(url, correlationId) {
    const regEx = RegExp("^([^:/?#]+://)?([^/?#]*)");
    const match = url.match(regEx);
    if (!match) {
      throw createClientConfigurationError(urlParseError, correlationId);
    }
    return match[2];
  }
  static getAbsoluteUrl(relativeUrl, baseUrl, correlationId) {
    if (relativeUrl[0] === FORWARD_SLASH) {
      const url = new _UrlString(baseUrl, correlationId);
      const baseComponents = url.getUrlComponents();
      return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
    }
    return relativeUrl;
  }
  static constructAuthorityUriFromObject(urlObject, correlationId) {
    return new _UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"), correlationId);
  }
};

// node_modules/@azure/msal-common/dist/authority/AuthorityMetadata.mjs
var endpointHosts = [
  { host: "login.microsoftonline.com" },
  { host: "login.partner.microsoftonline.cn" },
  { host: "login.microsoftonline.us" },
  { host: "login.sovcloud-identity.fr" },
  { host: "login.sovcloud-identity.de" },
  { host: "login.sovcloud-identity.sg" }
];
function buildOpenIdConfig(host, issuerHost) {
  return {
    token_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/token`,
    jwks_uri: `https://${host}/{tenantid}/discovery/v2.0/keys`,
    issuer: `https://${issuerHost}/{tenantid}/v2.0`,
    authorization_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/authorize`,
    end_session_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/logout`
  };
}
var dynamicEndpointMetadata = endpointHosts.reduce((acc, { host, issuerHost }) => {
  acc[host] = buildOpenIdConfig(host, issuerHost || host);
  return acc;
}, {});
var rawMetdataJSON = {
  endpointMetadata: dynamicEndpointMetadata,
  instanceDiscoveryMetadata: {
    metadata: [
      {
        preferred_network: "login.microsoftonline.com",
        preferred_cache: "login.windows.net",
        aliases: [
          "login.microsoftonline.com",
          "login.windows.net",
          "login.microsoft.com",
          "sts.windows.net"
        ]
      },
      {
        preferred_network: "login.partner.microsoftonline.cn",
        preferred_cache: "login.partner.microsoftonline.cn",
        aliases: [
          "login.partner.microsoftonline.cn",
          "login.chinacloudapi.cn"
        ]
      },
      {
        preferred_network: "login.microsoftonline.de",
        preferred_cache: "login.microsoftonline.de",
        aliases: ["login.microsoftonline.de"]
      },
      {
        preferred_network: "login.microsoftonline.us",
        preferred_cache: "login.microsoftonline.us",
        aliases: [
          "login.microsoftonline.us",
          "login.usgovcloudapi.net"
        ]
      },
      {
        preferred_network: "login-us.microsoftonline.com",
        preferred_cache: "login-us.microsoftonline.com",
        aliases: ["login-us.microsoftonline.com"]
      },
      {
        preferred_network: "login.sovcloud-identity.fr",
        preferred_cache: "login.sovcloud-identity.fr",
        aliases: ["login.sovcloud-identity.fr"]
      },
      {
        preferred_network: "login.sovcloud-identity.de",
        preferred_cache: "login.sovcloud-identity.de",
        aliases: ["login.sovcloud-identity.de"]
      },
      {
        preferred_network: "login.sovcloud-identity.sg",
        preferred_cache: "login.sovcloud-identity.sg",
        aliases: ["login.sovcloud-identity.sg"]
      }
    ]
  }
};
var EndpointMetadata = rawMetdataJSON.endpointMetadata;
var InstanceDiscoveryMetadata = rawMetdataJSON.instanceDiscoveryMetadata;
var InstanceDiscoveryMetadataAliases = /* @__PURE__ */ new Set();
InstanceDiscoveryMetadata.metadata.forEach((metadataEntry) => {
  metadataEntry.aliases.forEach((alias) => {
    InstanceDiscoveryMetadataAliases.add(alias);
  });
});
function getAliasesFromStaticSources(staticAuthorityOptions, logger, correlationId) {
  let staticAliases;
  const canonicalAuthority = staticAuthorityOptions.canonicalAuthority;
  if (canonicalAuthority) {
    const authorityHost = new UrlString(canonicalAuthority, correlationId).getUrlComponents().HostNameAndPort;
    staticAliases = getAliasesFromMetadata(logger, correlationId, authorityHost, staticAuthorityOptions.cloudDiscoveryMetadata?.metadata, AuthorityMetadataSource.CONFIG) || getAliasesFromMetadata(logger, correlationId, authorityHost, InstanceDiscoveryMetadata.metadata, AuthorityMetadataSource.HARDCODED_VALUES) || staticAuthorityOptions.knownAuthorities;
  }
  return staticAliases || [];
}
function getAliasesFromMetadata(logger, correlationId, authorityHost, cloudDiscoveryMetadata, source) {
  logger.trace(`getAliasesFromMetadata called with source: '${source}'`, correlationId);
  if (authorityHost && cloudDiscoveryMetadata) {
    const metadata = getCloudDiscoveryMetadataFromNetworkResponse(cloudDiscoveryMetadata, authorityHost);
    if (metadata) {
      logger.trace(`getAliasesFromMetadata: found cloud discovery metadata in '${source}', returning aliases`, correlationId);
      return metadata.aliases;
    } else {
      logger.trace(`getAliasesFromMetadata: did not find cloud discovery metadata in '${source}'`, correlationId);
    }
  }
  return null;
}
function getCloudDiscoveryMetadataFromHardcodedValues(authorityHost) {
  const metadata = getCloudDiscoveryMetadataFromNetworkResponse(InstanceDiscoveryMetadata.metadata, authorityHost);
  return metadata;
}
function getCloudDiscoveryMetadataFromNetworkResponse(response, authorityHost) {
  for (let i = 0; i < response.length; i++) {
    const metadata = response[i];
    if (metadata.aliases.includes(authorityHost)) {
      return metadata;
    }
  }
  return null;
}

// node_modules/@azure/msal-common/dist/authority/AuthorityOptions.mjs
var AzureCloudInstance = {
  // AzureCloudInstance is not specified.
  None: "none",
  // Microsoft Azure public cloud
  AzurePublic: "https://login.microsoftonline.com",
  // Microsoft Chinese national/regional cloud
  AzureChina: "https://login.chinacloudapi.cn",
  // Microsoft German national/regional cloud ("Black Forest")
  AzureGermany: "https://login.microsoftonline.de",
  // US Government cloud
  AzureUsGovernment: "https://login.microsoftonline.us"
};

// node_modules/@azure/msal-common/dist/authority/CloudInstanceDiscoveryResponse.mjs
function isCloudInstanceDiscoveryResponse(response) {
  return response.hasOwnProperty("tenant_discovery_endpoint") && response.hasOwnProperty("metadata");
}

// node_modules/@azure/msal-common/dist/authority/CloudInstanceDiscoveryErrorResponse.mjs
function isCloudInstanceDiscoveryErrorResponse(response) {
  return response.hasOwnProperty("error") && response.hasOwnProperty("error_description");
}

// node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvents.mjs
var NetworkClientSendPostRequestAsync = "networkClientSendPostRequestAsync";
var RefreshTokenClientExecutePostToTokenEndpoint = "refreshTokenClientExecutePostToTokenEndpoint";
var AuthorizationCodeClientExecutePostToTokenEndpoint = "authorizationCodeClientExecutePostToTokenEndpoint";
var RefreshTokenClientExecuteTokenRequest = "refreshTokenClientExecuteTokenRequest";
var RefreshTokenClientAcquireToken = "refreshTokenClientAcquireToken";
var RefreshTokenClientAcquireTokenWithCachedRefreshToken = "refreshTokenClientAcquireTokenWithCachedRefreshToken";
var RefreshTokenClientCreateTokenRequestBody = "refreshTokenClientCreateTokenRequestBody";
var SilentFlowClientGenerateResultFromCacheRecord = "silentFlowClientGenerateResultFromCacheRecord";
var AuthClientExecuteTokenRequest = "authClientExecuteTokenRequest";
var AuthClientCreateTokenRequestBody = "authClientCreateTokenRequestBody";
var UpdateTokenEndpointAuthority = "updateTokenEndpointAuthority";
var PopTokenGenerateCnf = "popTokenGenerateCnf";
var HandleServerTokenResponse = "handleServerTokenResponse";
var AuthorityResolveEndpointsAsync = "authorityResolveEndpointsAsync";
var AuthorityGetCloudDiscoveryMetadataFromNetwork = "authorityGetCloudDiscoveryMetadataFromNetwork";
var AuthorityUpdateCloudDiscoveryMetadata = "authorityUpdateCloudDiscoveryMetadata";
var AuthorityGetEndpointMetadataFromNetwork = "authorityGetEndpointMetadataFromNetwork";
var AuthorityUpdateEndpointMetadata = "authorityUpdateEndpointMetadata";
var AuthorityUpdateMetadataWithRegionalInformation = "authorityUpdateMetadataWithRegionalInformation";
var RegionDiscoveryDetectRegion = "regionDiscoveryDetectRegion";
var RegionDiscoveryGetRegionFromIMDS = "regionDiscoveryGetRegionFromIMDS";
var RegionDiscoveryGetCurrentVersion = "regionDiscoveryGetCurrentVersion";
var CacheManagerGetRefreshToken = "cacheManagerGetRefreshToken";

// node_modules/@azure/msal-common/dist/utils/FunctionWrappers.mjs
var invoke = (callback, eventName, logger, telemetryClient, correlationId) => {
  return (...args) => {
    logger.trace(`Executing function '${eventName}'`, correlationId);
    const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
    if (correlationId) {
      telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);
    }
    try {
      const result = callback(...args);
      inProgressEvent.end({
        success: true
      });
      logger.trace(`Returning result from '${eventName}'`, correlationId);
      return result;
    } catch (e) {
      logger.trace(`Error occurred in '${eventName}'`, correlationId);
      try {
        logger.trace(JSON.stringify(e), correlationId);
      } catch (e2) {
        logger.trace("Unable to print error message.", correlationId);
      }
      inProgressEvent.end({
        success: false
      }, e);
      throw e;
    }
  };
};
var invokeAsync = (callback, eventName, logger, telemetryClient, correlationId) => {
  return (...args) => {
    logger.trace(`Executing function '${eventName}'`, correlationId);
    const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
    if (correlationId) {
      telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);
    }
    return callback(...args).then((response) => {
      logger.trace(`Returning result from '${eventName}'`, correlationId);
      inProgressEvent.end({
        success: true
      });
      return response;
    }).catch((e) => {
      logger.trace(`Error occurred in '${eventName}'`, correlationId);
      try {
        logger.trace(JSON.stringify(e), correlationId);
      } catch (e2) {
        logger.trace("Unable to print error message.", correlationId);
      }
      inProgressEvent.end({
        success: false
      }, e);
      throw e;
    });
  };
};

// node_modules/@azure/msal-common/dist/authority/RegionDiscovery.mjs
var RegionDiscovery = class _RegionDiscovery {
  constructor(networkInterface, logger, performanceClient, correlationId) {
    this.networkInterface = networkInterface;
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.correlationId = correlationId;
  }
  /**
   * Detect the region from the application's environment.
   *
   * @returns Promise<string | null>
   */
  async detectRegion(environmentRegion, regionDiscoveryMetadata) {
    let autodetectedRegionName = environmentRegion;
    if (!autodetectedRegionName) {
      const options = _RegionDiscovery.IMDS_OPTIONS;
      try {
        const localIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(IMDS_VERSION, options);
        if (localIMDSVersionResponse.status === HTTP_SUCCESS) {
          autodetectedRegionName = localIMDSVersionResponse.body?.location;
          if (autodetectedRegionName) {
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
          }
        }
        if (localIMDSVersionResponse.status === HTTP_BAD_REQUEST) {
          const currentIMDSVersion = await invokeAsync(this.getCurrentVersion.bind(this), RegionDiscoveryGetCurrentVersion, this.logger, this.performanceClient, this.correlationId)(options);
          if (!currentIMDSVersion) {
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
            return null;
          }
          const currentIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(currentIMDSVersion, options);
          if (currentIMDSVersionResponse.status === HTTP_SUCCESS) {
            autodetectedRegionName = currentIMDSVersionResponse.body?.location;
            if (autodetectedRegionName) {
              regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
            }
          }
        }
      } catch (e) {
        regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
        return null;
      }
    } else {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources.ENVIRONMENT_VARIABLE;
    }
    if (!autodetectedRegionName) {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
    }
    return autodetectedRegionName || null;
  }
  /**
   * Make the call to the IMDS endpoint
   *
   * @param version
   * @param options
   * @returns Promise<NetworkResponse<ImdsComputeResponse>>
   */
  async getRegionFromIMDS(version3, options) {
    return this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?api-version=${version3}`, options, IMDS_TIMEOUT);
  }
  /**
   * Get the most recent version of the IMDS endpoint available
   *
   * @returns Promise<string | null>
   */
  async getCurrentVersion(options) {
    try {
      const response = await this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?format=json`, options);
      if (response.status === HTTP_BAD_REQUEST && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0) {
        return response.body["newest-versions"][0];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};
RegionDiscovery.IMDS_OPTIONS = {
  headers: {
    Metadata: "true"
  }
};

// node_modules/@azure/msal-common/dist/cache/utils/CacheHelpers.mjs
var CacheHelpers_exports = {};
__export(CacheHelpers_exports, {
  createAccessTokenEntity: () => createAccessTokenEntity,
  createIdTokenEntity: () => createIdTokenEntity,
  createRefreshTokenEntity: () => createRefreshTokenEntity,
  generateAppMetadataKey: () => generateAppMetadataKey,
  generateAuthorityMetadataExpiresAt: () => generateAuthorityMetadataExpiresAt,
  isAccessTokenEntity: () => isAccessTokenEntity,
  isAppMetadataEntity: () => isAppMetadataEntity,
  isAuthorityMetadataEntity: () => isAuthorityMetadataEntity,
  isAuthorityMetadataExpired: () => isAuthorityMetadataExpired,
  isCredentialEntity: () => isCredentialEntity,
  isIdTokenEntity: () => isIdTokenEntity,
  isRefreshTokenEntity: () => isRefreshTokenEntity,
  isServerTelemetryEntity: () => isServerTelemetryEntity,
  isThrottlingEntity: () => isThrottlingEntity,
  serializeAttributeTokens: () => serializeAttributeTokens,
  updateAuthorityEndpointMetadata: () => updateAuthorityEndpointMetadata,
  updateCloudDiscoveryMetadata: () => updateCloudDiscoveryMetadata
});

// node_modules/@azure/msal-common/dist/utils/TimeUtils.mjs
var TimeUtils_exports = {};
__export(TimeUtils_exports, {
  delay: () => delay2,
  isCacheExpired: () => isCacheExpired,
  isTokenExpired: () => isTokenExpired,
  nowSeconds: () => nowSeconds,
  toDateFromSeconds: () => toDateFromSeconds,
  toSecondsFromDate: () => toSecondsFromDate,
  wasClockTurnedBack: () => wasClockTurnedBack
});
function nowSeconds() {
  return Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
}
function toSecondsFromDate(date) {
  return date.getTime() / 1e3;
}
function toDateFromSeconds(seconds) {
  if (seconds) {
    return new Date(Number(seconds) * 1e3);
  }
  return /* @__PURE__ */ new Date();
}
function isTokenExpired(expiresOn, offset) {
  const expirationSec = Number(expiresOn) || 0;
  const offsetCurrentTimeSec = nowSeconds() + offset;
  return offsetCurrentTimeSec > expirationSec;
}
function isCacheExpired(lastUpdatedAt, cacheRetentionDays) {
  const cacheExpirationTimestamp = Number(lastUpdatedAt) + cacheRetentionDays * 24 * 60 * 60 * 1e3;
  return Date.now() > cacheExpirationTimestamp;
}
function wasClockTurnedBack(cachedAt) {
  const cachedAtSec = Number(cachedAt);
  return cachedAtSec > nowSeconds();
}
function delay2(t, value) {
  return new Promise((resolve6) => setTimeout(() => resolve6(value), t));
}

// node_modules/@azure/msal-common/dist/cache/utils/CacheHelpers.mjs
function createIdTokenEntity(homeAccountId, environment, idToken, clientId, tenantId) {
  const idTokenEntity = {
    credentialType: CredentialType.ID_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: idToken,
    realm: tenantId,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  return idTokenEntity;
}
function createAccessTokenEntity(homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, base64Decode, correlationId, refreshOn, tokenType, userAssertionHash, keyId, additionalCacheKeyComponents) {
  const atEntity = {
    homeAccountId,
    credentialType: CredentialType.ACCESS_TOKEN,
    secret: accessToken,
    cachedAt: nowSeconds().toString(),
    expiresOn: expiresOn.toString(),
    extendedExpiresOn: extExpiresOn.toString(),
    environment,
    clientId,
    realm: tenantId,
    target: scopes,
    tokenType: tokenType || AuthenticationScheme.BEARER,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  if (userAssertionHash) {
    atEntity.userAssertionHash = userAssertionHash;
  }
  if (refreshOn) {
    atEntity.refreshOn = refreshOn.toString();
  }
  const normalizedTokenType = atEntity.tokenType?.toLowerCase();
  if (atEntity.tokenType?.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase()) {
    atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
    switch (normalizedTokenType) {
      case AuthenticationScheme.POP:
        const tokenClaims = extractTokenClaims(accessToken, base64Decode, correlationId);
        if (!tokenClaims?.cnf?.kid) {
          throw createClientAuthError(tokenClaimsCnfRequiredForSignedJwt, correlationId);
        }
        atEntity.keyId = tokenClaims.cnf.kid;
        break;
      case "dpop":
        if (!keyId) {
          throw createClientAuthError(keyIdMissing, correlationId);
        }
        atEntity.keyId = keyId;
        break;
      case AuthenticationScheme.SSH:
        atEntity.keyId = keyId;
    }
  }
  if (additionalCacheKeyComponents && Object.keys(additionalCacheKeyComponents).length > 0) {
    atEntity.additionalCacheKeyComponents = additionalCacheKeyComponents;
  }
  return atEntity;
}
function createRefreshTokenEntity(homeAccountId, environment, refreshToken, clientId, familyId, userAssertionHash, expiresOn) {
  const rtEntity = {
    credentialType: CredentialType.REFRESH_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: refreshToken,
    lastUpdatedAt: Date.now().toString()
  };
  if (userAssertionHash) {
    rtEntity.userAssertionHash = userAssertionHash;
  }
  if (familyId) {
    rtEntity.familyId = familyId;
  }
  if (expiresOn) {
    rtEntity.expiresOn = expiresOn.toString();
  }
  return rtEntity;
}
function isCredentialEntity(entity) {
  return entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("credentialType") && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("secret");
}
function isAccessTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity.hasOwnProperty("target") && (entity["credentialType"] === CredentialType.ACCESS_TOKEN || entity["credentialType"] === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
}
function isIdTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity["credentialType"] === CredentialType.ID_TOKEN;
}
function isRefreshTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity["credentialType"] === CredentialType.REFRESH_TOKEN;
}
function isServerTelemetryEntity(key, entity) {
  const validateKey = key.indexOf(SERVER_TELEM_CACHE_KEY) === 0;
  let validateEntity = true;
  if (entity) {
    validateEntity = entity.hasOwnProperty("failedRequests") && entity.hasOwnProperty("errors") && entity.hasOwnProperty("cacheHits");
  }
  return validateKey && validateEntity;
}
function isThrottlingEntity(key, entity) {
  let validateKey = false;
  if (key) {
    validateKey = key.indexOf(THROTTLING_PREFIX) === 0;
  }
  let validateEntity = true;
  if (entity) {
    validateEntity = entity.hasOwnProperty("throttleTime");
  }
  return validateKey && validateEntity;
}
function generateAppMetadataKey({ environment, clientId }) {
  const appMetaDataKeyArray = [
    APP_METADATA,
    environment,
    clientId
  ];
  return appMetaDataKeyArray.join(CACHE_KEY_SEPARATOR).toLowerCase();
}
function isAppMetadataEntity(key, entity) {
  if (!entity) {
    return false;
  }
  return key.indexOf(APP_METADATA) === 0 && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("environment");
}
function isAuthorityMetadataEntity(key, entity) {
  if (!entity) {
    return false;
  }
  return key.indexOf(AUTHORITY_METADATA_CACHE_KEY) === 0 && entity.hasOwnProperty("aliases") && entity.hasOwnProperty("preferred_cache") && entity.hasOwnProperty("preferred_network") && entity.hasOwnProperty("canonical_authority") && entity.hasOwnProperty("authorization_endpoint") && entity.hasOwnProperty("token_endpoint") && entity.hasOwnProperty("issuer") && entity.hasOwnProperty("aliasesFromNetwork") && entity.hasOwnProperty("endpointsFromNetwork") && entity.hasOwnProperty("expiresAt") && entity.hasOwnProperty("jwks_uri");
}
function generateAuthorityMetadataExpiresAt() {
  return nowSeconds() + AUTHORITY_METADATA_REFRESH_TIME_SECONDS;
}
function updateAuthorityEndpointMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.authorization_endpoint = updatedValues.authorization_endpoint;
  authorityMetadata.token_endpoint = updatedValues.token_endpoint;
  authorityMetadata.end_session_endpoint = updatedValues.end_session_endpoint;
  authorityMetadata.issuer = updatedValues.issuer;
  authorityMetadata.endpointsFromNetwork = fromNetwork;
  authorityMetadata.jwks_uri = updatedValues.jwks_uri;
}
function updateCloudDiscoveryMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.aliases = updatedValues.aliases;
  authorityMetadata.preferred_cache = updatedValues.preferred_cache;
  authorityMetadata.preferred_network = updatedValues.preferred_network;
  authorityMetadata.aliasesFromNetwork = fromNetwork;
}
function isAuthorityMetadataExpired(metadata) {
  return metadata.expiresAt <= nowSeconds();
}
function serializeAttributeTokens(attributeTokens) {
  if (!attributeTokens || attributeTokens.length === 0) {
    return void 0;
  }
  return [...attributeTokens].sort().join(" ");
}

// node_modules/@azure/msal-common/dist/authority/Authority.mjs
var Authority = class _Authority {
  constructor(authority, networkInterface, cacheManager, authorityOptions, logger, correlationId, performanceClient, managedIdentity) {
    this.canonicalAuthority = authority;
    this._canonicalAuthority.validateAsUri();
    this.networkInterface = networkInterface;
    this.cacheManager = cacheManager;
    this.authorityOptions = authorityOptions;
    this.regionDiscoveryMetadata = {
      region_used: void 0,
      region_source: void 0,
      region_outcome: void 0
    };
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.correlationId = correlationId;
    this.managedIdentity = managedIdentity || false;
    this.regionDiscovery = new RegionDiscovery(networkInterface, this.logger, this.performanceClient, this.correlationId);
  }
  /**
   * Get {@link AuthorityType:type}
   * @param authorityUri {@link IUri}
   * @private
   */
  getAuthorityType(authorityUri) {
    if (authorityUri.HostNameAndPort.endsWith(CIAM_AUTH_URL)) {
      return AuthorityType.Ciam;
    }
    const pathSegments = authorityUri.PathSegments;
    if (pathSegments.length) {
      switch (pathSegments[0].toLowerCase()) {
        case ADFS:
          return AuthorityType.Adfs;
      }
    }
    return AuthorityType.Default;
  }
  // See above for AuthorityType
  get authorityType() {
    return this.getAuthorityType(this.canonicalAuthorityUrlComponents);
  }
  /**
   * ProtocolMode enum representing the way endpoints are constructed.
   */
  get protocolMode() {
    return this.authorityOptions.protocolMode;
  }
  /**
   * Returns authorityOptions which can be used to reinstantiate a new authority instance
   */
  get options() {
    return this.authorityOptions;
  }
  /**
   * A URL that is the authority set by the developer
   */
  get canonicalAuthority() {
    return this._canonicalAuthority.urlString;
  }
  /**
   * Sets canonical authority.
   */
  set canonicalAuthority(url) {
    this._canonicalAuthority = new UrlString(url, this.correlationId);
    this._canonicalAuthority.validateAsUri();
    this._canonicalAuthorityUrlComponents = null;
  }
  /**
   * Get authority components.
   */
  get canonicalAuthorityUrlComponents() {
    if (!this._canonicalAuthorityUrlComponents) {
      this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
    }
    return this._canonicalAuthorityUrlComponents;
  }
  /**
   * Get hostname and port i.e. login.microsoftonline.com
   */
  get hostnameAndPort() {
    return this.canonicalAuthorityUrlComponents.HostNameAndPort.toLowerCase();
  }
  /**
   * Get tenant for authority.
   */
  get tenant() {
    return this.canonicalAuthorityUrlComponents.PathSegments[0];
  }
  /**
   * OAuth /authorize endpoint for requests
   */
  get authorizationEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.authorization_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * OAuth /token endpoint for requests
   */
  get tokenEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  get deviceCodeEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint.replace("/token", "/devicecode"));
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * OAuth logout endpoint for requests
   */
  get endSessionEndpoint() {
    if (this.discoveryComplete()) {
      if (!this.metadata.end_session_endpoint) {
        throw createClientAuthError(endSessionEndpointNotSupported, this.correlationId);
      }
      return this.replacePath(this.metadata.end_session_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * OAuth issuer for requests
   */
  get selfSignedJwtAudience() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.issuer);
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * Jwks_uri for token signing keys
   */
  get jwksUri() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.jwks_uri);
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * Returns a flag indicating that tenant name can be replaced in authority {@link IUri}
   * @param authorityUri {@link IUri}
   * @private
   */
  canReplaceTenant(authorityUri) {
    return authorityUri.PathSegments.length === 1 && !_Authority.reservedTenantDomains.has(authorityUri.PathSegments[0]) && this.getAuthorityType(authorityUri) === AuthorityType.Default && this.protocolMode !== ProtocolMode.OIDC;
  }
  /**
   * Replaces tenant in url path with current tenant. Defaults to common.
   * @param urlString
   */
  replaceTenant(urlString) {
    return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
  }
  /**
   * Replaces path such as tenant or policy with the current tenant or policy.
   * @param urlString
   */
  replacePath(urlString) {
    let endpoint = urlString;
    const cachedAuthorityUrl = new UrlString(this.metadata.canonical_authority, this.correlationId);
    const cachedAuthorityUrlComponents = cachedAuthorityUrl.getUrlComponents();
    const cachedAuthorityParts = cachedAuthorityUrlComponents.PathSegments;
    const currentAuthorityParts = this.canonicalAuthorityUrlComponents.PathSegments;
    currentAuthorityParts.forEach((currentPart, index) => {
      let cachedPart = cachedAuthorityParts[index];
      if (index === 0 && this.canReplaceTenant(cachedAuthorityUrlComponents)) {
        const tenantId = new UrlString(this.metadata.authorization_endpoint, this.correlationId).getUrlComponents().PathSegments[0];
        if (cachedPart !== tenantId) {
          this.logger.verbose(`Replacing tenant domain name '${cachedPart}' with id '${tenantId}'`, this.correlationId);
          cachedPart = tenantId;
        }
      }
      if (currentPart !== cachedPart) {
        endpoint = endpoint.replace(`/${cachedPart}/`, `/${currentPart}/`);
      }
    });
    return this.replaceTenant(endpoint);
  }
  /**
   * The default open id configuration endpoint for any canonical authority.
   */
  get defaultOpenIdConfigurationEndpoint() {
    const canonicalAuthorityHost = this.hostnameAndPort;
    if (this.canonicalAuthority.endsWith("v2.0/") || this.authorityType === AuthorityType.Adfs || this.protocolMode === ProtocolMode.OIDC && !this.isAliasOfKnownMicrosoftAuthority(canonicalAuthorityHost)) {
      return `${this.canonicalAuthority}.well-known/openid-configuration`;
    }
    return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
  }
  /**
   * Boolean that returns whether or not tenant discovery has been completed.
   */
  discoveryComplete() {
    return !!this.metadata;
  }
  /**
   * Perform endpoint discovery to discover aliases, preferred_cache, preferred_network
   * and the /authorize, /token and logout endpoints.
   */
  async resolveEndpointsAsync() {
    const metadataEntity = this.getCurrentMetadataEntity();
    const cloudDiscoverySource = await invokeAsync(this.updateCloudDiscoveryMetadata.bind(this), AuthorityUpdateCloudDiscoveryMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
    const endpointSource = await invokeAsync(this.updateEndpointMetadata.bind(this), AuthorityUpdateEndpointMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.updateCachedMetadata(metadataEntity, cloudDiscoverySource, {
      source: endpointSource
    });
    this.performanceClient?.addFields({
      cloudDiscoverySource,
      authorityEndpointSource: endpointSource
    }, this.correlationId);
  }
  /**
   * Returns metadata entity from cache if it exists, otherwise returns a new metadata entity built
   * from the configured canonical authority
   * @returns
   */
  getCurrentMetadataEntity() {
    let metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort, this.correlationId);
    if (!metadataEntity) {
      metadataEntity = {
        aliases: [],
        preferred_cache: this.hostnameAndPort,
        preferred_network: this.hostnameAndPort,
        canonical_authority: this.canonicalAuthority,
        authorization_endpoint: "",
        token_endpoint: "",
        end_session_endpoint: "",
        issuer: "",
        aliasesFromNetwork: false,
        endpointsFromNetwork: false,
        expiresAt: generateAuthorityMetadataExpiresAt(),
        jwks_uri: ""
      };
    }
    return metadataEntity;
  }
  /**
   * Updates cached metadata based on metadata source and sets the instance's metadata
   * property to the same value
   * @param metadataEntity
   * @param cloudDiscoverySource
   * @param endpointMetadataResult
   */
  updateCachedMetadata(metadataEntity, cloudDiscoverySource, endpointMetadataResult) {
    if (cloudDiscoverySource !== AuthorityMetadataSource.CACHE && endpointMetadataResult?.source !== AuthorityMetadataSource.CACHE) {
      metadataEntity.expiresAt = generateAuthorityMetadataExpiresAt();
      metadataEntity.canonical_authority = this.canonicalAuthority;
    }
    const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache, this.correlationId);
    this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity, this.correlationId);
    this.metadata = metadataEntity;
  }
  /**
   * Update AuthorityMetadataEntity with new endpoints and return where the information came from
   * @param metadataEntity
   */
  async updateEndpointMetadata(metadataEntity) {
    const localMetadata = this.updateEndpointMetadataFromLocalSources(metadataEntity);
    if (localMetadata) {
      if (localMetadata.source === AuthorityMetadataSource.HARDCODED_VALUES) {
        if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
          if (localMetadata.metadata) {
            const hardcodedMetadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(localMetadata.metadata);
            updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, false);
            metadataEntity.canonical_authority = this.canonicalAuthority;
          }
        }
      }
      return localMetadata.source;
    }
    let metadata = await invokeAsync(this.getEndpointMetadataFromNetwork.bind(this), AuthorityGetEndpointMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      this.validateIssuer(metadata.issuer);
      if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
        metadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(metadata);
      }
      updateAuthorityEndpointMetadata(metadataEntity, metadata, true);
      return AuthorityMetadataSource.NETWORK;
    } else {
      throw createClientAuthError(openIdConfigError, this.defaultOpenIdConfigurationEndpoint, this.correlationId);
    }
  }
  /**
   * Updates endpoint metadata from local sources and returns where the information was retrieved from and the metadata config
   * response if the source is hardcoded metadata
   * @param metadataEntity
   * @returns
   */
  updateEndpointMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get endpoint metadata from authority configuration", this.correlationId);
    const configMetadata = this.getEndpointMetadataFromConfig();
    if (configMetadata) {
      this.logger.verbose("Found endpoint metadata in authority configuration", this.correlationId);
      updateAuthorityEndpointMetadata(metadataEntity, configMetadata, false);
      return {
        source: AuthorityMetadataSource.CONFIG
      };
    }
    this.logger.verbose("Did not find endpoint metadata in the config... Attempting to get endpoint metadata from the hardcoded values.", this.correlationId);
    const hardcodedMetadata = this.getEndpointMetadataFromHardcodedValues();
    if (hardcodedMetadata) {
      updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, false);
      return {
        source: AuthorityMetadataSource.HARDCODED_VALUES,
        metadata: hardcodedMetadata
      };
    } else {
      this.logger.verbose("Did not find endpoint metadata in hardcoded values... Attempting to get endpoint metadata from the network metadata cache.", this.correlationId);
    }
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    if (this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntityExpired) {
      this.logger.verbose("Found endpoint metadata in the cache.", "");
      return { source: AuthorityMetadataSource.CACHE };
    } else if (metadataEntityExpired) {
      this.logger.verbose("The metadata entity is expired.", "");
    }
    return null;
  }
  /**
   * Compares the number of url components after the domain to determine if the cached
   * authority metadata can be used for the requested authority. Protects against same domain different
   * authority such as login.microsoftonline.com/tenant and login.microsoftonline.com/tfp/tenant/policy
   * @param metadataEntity
   */
  isAuthoritySameType(metadataEntity) {
    const cachedAuthorityUrl = new UrlString(metadataEntity.canonical_authority, this.correlationId);
    const cachedParts = cachedAuthorityUrl.getUrlComponents().PathSegments;
    return cachedParts.length === this.canonicalAuthorityUrlComponents.PathSegments.length;
  }
  /**
   * Parse authorityMetadata config option
   */
  getEndpointMetadataFromConfig() {
    if (this.authorityOptions.authorityMetadata) {
      try {
        return JSON.parse(this.authorityOptions.authorityMetadata);
      } catch (e) {
        throw createClientConfigurationError(invalidAuthorityMetadata, this.correlationId);
      }
    }
    return null;
  }
  /**
   * Gets OAuth endpoints from the given OpenID configuration endpoint.
   *
   * @param hasHardcodedMetadata boolean
   */
  async getEndpointMetadataFromNetwork() {
    const options = {};
    const openIdConfigurationEndpoint = this.defaultOpenIdConfigurationEndpoint;
    this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: attempting to retrieve OAuth endpoints from '${openIdConfigurationEndpoint}'`, this.correlationId);
    try {
      const response = await this.networkInterface.sendGetRequestAsync(openIdConfigurationEndpoint, options);
      const isValidResponse = isOpenIdConfigResponse(response.body);
      if (isValidResponse) {
        return response.body;
      } else {
        this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: could not parse response as OpenID configuration`, this.correlationId);
        return null;
      }
    } catch (e) {
      this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: '${e}'`, this.correlationId);
      return null;
    }
  }
  /**
   * Get OAuth endpoints for common authorities.
   */
  getEndpointMetadataFromHardcodedValues() {
    if (this.hostnameAndPort in EndpointMetadata) {
      return EndpointMetadata[this.hostnameAndPort];
    }
    return null;
  }
  /**
   * Update the retrieved metadata with regional information.
   * User selected Azure region will be used if configured.
   */
  async updateMetadataWithRegionalInformation(metadata) {
    const userConfiguredAzureRegion = this.authorityOptions.azureRegionConfiguration?.azureRegion;
    if (userConfiguredAzureRegion) {
      if (userConfiguredAzureRegion !== AZURE_REGION_AUTO_DISCOVER_FLAG) {
        this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.CONFIGURED_NO_AUTO_DETECTION;
        this.regionDiscoveryMetadata.region_used = userConfiguredAzureRegion;
        return _Authority.replaceWithRegionalInformation(metadata, userConfiguredAzureRegion, this.correlationId);
      }
      const autodetectedRegionName = await invokeAsync(this.regionDiscovery.detectRegion.bind(this.regionDiscovery), RegionDiscoveryDetectRegion, this.logger, this.performanceClient, this.correlationId)(this.authorityOptions.azureRegionConfiguration?.environmentRegion, this.regionDiscoveryMetadata);
      if (autodetectedRegionName) {
        this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_SUCCESSFUL;
        this.regionDiscoveryMetadata.region_used = autodetectedRegionName;
        return _Authority.replaceWithRegionalInformation(metadata, autodetectedRegionName, this.correlationId);
      }
      this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_FAILED;
    }
    return metadata;
  }
  /**
   * Updates the AuthorityMetadataEntity with new aliases, preferred_network and preferred_cache
   * and returns where the information was retrieved from
   * @param metadataEntity
   * @returns AuthorityMetadataSource
   */
  async updateCloudDiscoveryMetadata(metadataEntity) {
    const localMetadataSource = this.updateCloudDiscoveryMetadataFromLocalSources(metadataEntity);
    if (localMetadataSource) {
      return localMetadataSource;
    }
    const metadata = await invokeAsync(this.getCloudDiscoveryMetadataFromNetwork.bind(this), AuthorityGetCloudDiscoveryMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      updateCloudDiscoveryMetadata(metadataEntity, metadata, true);
      return AuthorityMetadataSource.NETWORK;
    }
    throw createClientConfigurationError(untrustedAuthority, this.correlationId);
  }
  updateCloudDiscoveryMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get cloud discovery metadata from authority configuration", this.correlationId);
    this.logger.verbosePii(`Known Authorities: '${this.authorityOptions.knownAuthorities || NOT_APPLICABLE}'`, this.correlationId);
    this.logger.verbosePii(`Authority Metadata: '${this.authorityOptions.authorityMetadata || NOT_APPLICABLE}'`, this.correlationId);
    this.logger.verbosePii(`Canonical Authority: '${metadataEntity.canonical_authority || NOT_APPLICABLE}'`, this.correlationId);
    const metadata = this.getCloudDiscoveryMetadataFromConfig();
    if (metadata) {
      this.logger.verbose("Found cloud discovery metadata in authority configuration", this.correlationId);
      updateCloudDiscoveryMetadata(metadataEntity, metadata, false);
      return AuthorityMetadataSource.CONFIG;
    }
    this.logger.verbose("Did not find cloud discovery metadata in the config... Attempting to get cloud discovery metadata from the hardcoded values.", this.correlationId);
    const hardcodedMetadata = getCloudDiscoveryMetadataFromHardcodedValues(this.hostnameAndPort);
    if (hardcodedMetadata) {
      this.logger.verbose("Found cloud discovery metadata from hardcoded values.", this.correlationId);
      updateCloudDiscoveryMetadata(metadataEntity, hardcodedMetadata, false);
      return AuthorityMetadataSource.HARDCODED_VALUES;
    }
    this.logger.verbose("Did not find cloud discovery metadata in hardcoded values... Attempting to get cloud discovery metadata from the network metadata cache.", this.correlationId);
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    if (this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntityExpired) {
      this.logger.verbose("Found cloud discovery metadata in the cache.", "");
      return AuthorityMetadataSource.CACHE;
    } else if (metadataEntityExpired) {
      this.logger.verbose("The metadata entity is expired.", "");
    }
    return null;
  }
  /**
   * Parse cloudDiscoveryMetadata config or check knownAuthorities
   */
  getCloudDiscoveryMetadataFromConfig() {
    if (this.authorityType === AuthorityType.Ciam) {
      this.logger.verbose("CIAM authorities do not support cloud discovery metadata, generate the aliases from authority host.", this.correlationId);
      return _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    if (this.authorityOptions.cloudDiscoveryMetadata) {
      this.logger.verbose("The cloud discovery metadata has been provided as a network response, in the config.", this.correlationId);
      try {
        this.logger.verbose("Attempting to parse the cloud discovery metadata.", this.correlationId);
        const parsedResponse = JSON.parse(this.authorityOptions.cloudDiscoveryMetadata);
        const metadata = getCloudDiscoveryMetadataFromNetworkResponse(parsedResponse.metadata, this.hostnameAndPort);
        this.logger.verbose("Parsed the cloud discovery metadata.", "");
        if (metadata) {
          this.logger.verbose("There is returnable metadata attached to the parsed cloud discovery metadata.", this.correlationId);
          return metadata;
        } else {
          this.logger.verbose("There is no metadata attached to the parsed cloud discovery metadata.", this.correlationId);
        }
      } catch (e) {
        this.logger.verbose("Unable to parse the cloud discovery metadata. Throwing Invalid Cloud Discovery Metadata Error.", this.correlationId);
        throw createClientConfigurationError(invalidCloudDiscoveryMetadata, this.correlationId);
      }
    }
    if (this.isInKnownAuthorities(this.hostnameAndPort)) {
      this.logger.verbose("The host is included in knownAuthorities. Creating new cloud discovery metadata from the host.", this.correlationId);
      return _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    return null;
  }
  /**
   * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
   *
   * @param hasHardcodedMetadata boolean
   */
  async getCloudDiscoveryMetadataFromNetwork() {
    const instanceDiscoveryEndpoint = `${AAD_INSTANCE_DISCOVERY_ENDPT}${this.canonicalAuthority}oauth2/v2.0/authorize`;
    const options = {};
    let match = null;
    try {
      const response = await this.networkInterface.sendGetRequestAsync(instanceDiscoveryEndpoint, options);
      let typedResponseBody;
      let metadata;
      if (isCloudInstanceDiscoveryResponse(response.body)) {
        typedResponseBody = response.body;
        metadata = typedResponseBody.metadata;
        this.logger.verbosePii(`tenant_discovery_endpoint is: '${typedResponseBody.tenant_discovery_endpoint}'`, this.correlationId);
      } else if (isCloudInstanceDiscoveryErrorResponse(response.body)) {
        this.logger.warning(`A CloudInstanceDiscoveryErrorResponse was returned. The cloud instance discovery network request's status code is: '${response.status}'`, this.correlationId);
        typedResponseBody = response.body;
        if (typedResponseBody.error === INVALID_INSTANCE) {
          this.logger.error("The CloudInstanceDiscoveryErrorResponse error is invalid_instance.", this.correlationId);
          return null;
        }
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error is '${typedResponseBody.error}'`, this.correlationId);
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error description is '${typedResponseBody.error_description}'`, this.correlationId);
        this.logger.warning("Setting the value of the CloudInstanceDiscoveryMetadata (returned from the network, correlationId) to []", this.correlationId);
        metadata = [];
      } else {
        this.logger.error("AAD did not return a CloudInstanceDiscoveryResponse or CloudInstanceDiscoveryErrorResponse", this.correlationId);
        return null;
      }
      this.logger.verbose("Attempting to find a match between the developer's authority and the CloudInstanceDiscoveryMetadata returned from the network request.", this.correlationId);
      match = getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
    } catch (error) {
      if (error instanceof AuthError) {
        this.logger.error(`There was a network error while attempting to get the cloud discovery instance metadata.
Error: '${error.errorCode}'
Error Description: '${error.errorMessage}'`, this.correlationId);
      } else {
        const typedError = error;
        this.logger.error(`A non-MSALJS error was thrown while attempting to get the cloud instance discovery metadata.
Error: '${typedError.name}'
Error Description: '${typedError.message}'`, this.correlationId);
      }
      return null;
    }
    if (!match) {
      this.logger.warning("The developer's authority was not found within the CloudInstanceDiscoveryMetadata returned from the network request.", this.correlationId);
      this.logger.verbose("Creating custom Authority for custom domain scenario.", this.correlationId);
      match = _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    return match;
  }
  /**
   * Helper function to determine if a host is included in the knownAuthorities config option.
   */
  isInKnownAuthorities(host) {
    const normalizedHost = host.toLowerCase();
    const matches = this.authorityOptions.knownAuthorities.filter((authority) => {
      return authority && UrlString.getDomainFromUrl(authority, this.correlationId).toLowerCase() === normalizedHost;
    });
    return matches.length > 0;
  }
  /**
   * helper function to populate the authority based on azureCloudOptions
   * @param authorityString
   * @param azureCloudOptions
   */
  static generateAuthority(authorityString, azureCloudOptions) {
    let authorityAzureCloudInstance;
    if (azureCloudOptions && azureCloudOptions.azureCloudInstance !== AzureCloudInstance.None) {
      const tenant = azureCloudOptions.tenant ? azureCloudOptions.tenant : DEFAULT_COMMON_TENANT;
      authorityAzureCloudInstance = `${azureCloudOptions.azureCloudInstance}/${tenant}/`;
    }
    return authorityAzureCloudInstance ? authorityAzureCloudInstance : authorityString;
  }
  /**
   * Creates cloud discovery metadata object from a given host
   * @param host
   */
  static createCloudDiscoveryMetadataFromHost(host) {
    return {
      preferred_network: host,
      preferred_cache: host,
      aliases: [host]
    };
  }
  /**
   * helper function to generate environment from authority object
   */
  getPreferredCache() {
    if (this.managedIdentity) {
      return DEFAULT_AUTHORITY_HOST;
    } else if (this.discoveryComplete()) {
      return this.metadata.preferred_cache;
    } else {
      throw createClientAuthError(endpointResolutionError, this.correlationId);
    }
  }
  /**
   * Returns whether or not the provided host is an alias of this authority instance
   * @param host
   */
  isAlias(host) {
    return this.metadata.aliases.indexOf(host) > -1;
  }
  /**
   * Returns whether or not the provided host is an alias of a known Microsoft authority for purposes of endpoint discovery
   * @param host
   */
  isAliasOfKnownMicrosoftAuthority(host) {
    return InstanceDiscoveryMetadataAliases.has(host);
  }
  /**
   * Validates the `issuer` returned by an OIDC discovery document against
   * this authority, per
   * https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation
   *
   * The issuer is accepted when ANY of the following holds:
   *  1. The issuer scheme + host + port match the authority's (path may
   *     differ). Applies to all authorities.
   *  2. The authority is a Microsoft cloud authority (public, sovereign,
   *     or CIAM), the issuer is HTTPS, and the issuer host is in the known
   *     Microsoft authority host set.
   *  3. Same as (2), but the issuer host is a single-label regional variant
   *     of a known Microsoft host (e.g. `westus.login.microsoftonline.com`).
   *  4. Same as (2), but the issuer host matches the CIAM tenant pattern
   *     `{tenant}.ciamlogin.com` with an optional `/{tenant}[.onmicrosoft.com][/v2.0]`
   *     path.
   *  5. The issuer host is HTTPS and is explicitly listed in the
   *     developer-configured `knownAuthorities`. This covers scenarios where
   *     the OIDC discovery document returns an issuer host that differs from
   *     the authority (e.g., a GUID-based issuer for a name-based CIAM authority).
   *
   * @param issuer The `issuer` value returned in the OIDC discovery document.
   * @throws ClientConfigurationError("issuer_validation_failed") on failure.
   */
  validateIssuer(issuer) {
    if (!issuer) {
      throw createClientConfigurationError(issuerValidationFailed, this.correlationId);
    }
    let issuerUrl;
    try {
      issuerUrl = new URL(issuer);
    } catch {
      throw createClientConfigurationError(issuerValidationFailed, this.correlationId);
    }
    const issuerScheme = issuerUrl.protocol;
    const issuerHost = issuerUrl.host;
    const authorityScheme = (this.canonicalAuthorityUrlComponents.Protocol || "").toLowerCase();
    const authorityHost = (this.canonicalAuthorityUrlComponents.HostNameAndPort || "").toLowerCase();
    const matchesAuthorityOrigin = this.matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost);
    const matchesKnownMicrosoftHost = issuerScheme === "https:" && this.isAliasOfKnownMicrosoftAuthority(issuerHost);
    const matchesRegionalMicrosoftHost = issuerScheme === "https:" && this.matchesRegionalMicrosoftHost(issuerHost);
    const matchesCiamTenantPattern = this.matchesCiamTenantPattern(issuerUrl, authorityHost, this.canonicalAuthorityUrlComponents.PathSegments);
    const matchesKnownAuthority = issuerScheme === "https:" && this.isInKnownAuthorities(issuerHost);
    if (matchesAuthorityOrigin || matchesKnownMicrosoftHost || matchesRegionalMicrosoftHost || matchesCiamTenantPattern || matchesKnownAuthority) {
      return;
    }
    throw createClientConfigurationError(issuerValidationFailed, this.correlationId);
  }
  /**
   * Rule 1: The issuer scheme + host (and port) match the authority's. Path
   * may differ. Applies to all authorities.
   */
  matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost) {
    return issuerScheme === authorityScheme && issuerHost === authorityHost;
  }
  /**
   * Rule 3: The issuer host is a regional variant
   * (`{region}.{host}`) of a known Microsoft authority host.
   * E.g. `westus2.login.microsoft.com`.
   */
  matchesRegionalMicrosoftHost(issuerHost) {
    const firstDot = issuerHost.indexOf(".");
    if (firstDot > 0 && firstDot < issuerHost.length - 1) {
      const hostWithoutRegion = issuerHost.substring(firstDot + 1);
      return this.isAliasOfKnownMicrosoftAuthority(hostWithoutRegion);
    }
    return false;
  }
  /**
   * Rule 4: The issuer matches one of the well-known CIAM tenant patterns
   * (`https://{tenant}.ciamlogin.com[/{tenant}[.onmicrosoft.com][/v2.0]]`).
   *
   * The bare tenant name is extracted from the authority's first path segment
   * when available (stripping the `.onmicrosoft.com` suffix that
   * `transformCIAMAuthority` adds), or otherwise from the leftmost label of
   * the authority host (to support CIAM custom domain scenarios).
   *
   * Both `/{tenant}` and `/{tenant}.onmicrosoft.com` path forms are accepted
   * because the OIDC issuer may use either form depending on the authority URL
   * that was used to trigger discovery.
   */
  matchesCiamTenantPattern(issuerUrl, authorityHost, authorityPathSegments) {
    const pathSegment = authorityPathSegments[0];
    const tenantName = pathSegment ? pathSegment.endsWith(AAD_TENANT_DOMAIN_SUFFIX) ? pathSegment.slice(0, -AAD_TENANT_DOMAIN_SUFFIX.length) : pathSegment : authorityHost.split(".")[0];
    if (!tenantName) {
      return false;
    }
    const ciamBaseURL = `https://${tenantName}${CIAM_AUTH_URL}`;
    const validCiamPatterns = [
      ciamBaseURL,
      `${ciamBaseURL}/${tenantName}`,
      `${ciamBaseURL}/${tenantName}/v2.0`,
      `${ciamBaseURL}/${tenantName}${AAD_TENANT_DOMAIN_SUFFIX}`,
      `${ciamBaseURL}/${tenantName}${AAD_TENANT_DOMAIN_SUFFIX}/v2.0`
      // https://{tenant}.ciamlogin.com/{tenant}.onmicrosoft.com/v2.0
    ];
    const issuerPath = issuerUrl.pathname.replace(/\/+$/, "");
    const normalizedIssuer = `${issuerUrl.protocol}//${issuerUrl.host}${issuerPath}`;
    return validCiamPatterns.some((pattern) => pattern === normalizedIssuer);
  }
  /**
   * Checks whether the provided host is that of a public cloud authority
   *
   * @param authority string
   * @returns bool
   */
  static isPublicCloudAuthority(host) {
    return KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
  }
  /**
   * Rebuild the authority string with the region
   *
   * @param host string
   * @param region string
   */
  static buildRegionalAuthorityString(host, region, correlationId, queryString) {
    const authorityUrlInstance = new UrlString(host, correlationId);
    authorityUrlInstance.validateAsUri();
    const authorityUrlParts = authorityUrlInstance.getUrlComponents();
    let hostNameAndPort = `${region}.${authorityUrlParts.HostNameAndPort}`;
    if (this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort)) {
      hostNameAndPort = `${region}.${REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX}`;
    }
    const url = UrlString.constructAuthorityUriFromObject({
      ...authorityUrlInstance.getUrlComponents(),
      HostNameAndPort: hostNameAndPort
    }, correlationId).urlString;
    if (queryString)
      return `${url}?${queryString}`;
    return url;
  }
  /**
   * Replace the endpoints in the metadata object with their regional equivalents.
   *
   * @param metadata OpenIdConfigResponse
   * @param azureRegion string
   */
  static replaceWithRegionalInformation(metadata, azureRegion, correlationId) {
    const regionalMetadata = { ...metadata };
    regionalMetadata.authorization_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.authorization_endpoint, azureRegion, correlationId);
    regionalMetadata.token_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.token_endpoint, azureRegion, correlationId);
    if (regionalMetadata.end_session_endpoint) {
      regionalMetadata.end_session_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.end_session_endpoint, azureRegion, correlationId);
    }
    return regionalMetadata;
  }
  /**
   * Transform CIAM_AUTHORIY as per the below rules:
   * If no path segments found and it is a CIAM authority (hostname ends with .ciamlogin.com), then transform it
   *
   * NOTE: The transformation path should go away once STS supports CIAM with the format: `tenantIdorDomain.ciamlogin.com`
   * `ciamlogin.com` can also change in the future and we should accommodate the same
   *
   * @param authority
   */
  static transformCIAMAuthority(authority, correlationId) {
    let ciamAuthority = authority;
    const authorityUrl = new UrlString(authority, correlationId);
    const authorityUrlComponents = authorityUrl.getUrlComponents();
    if (authorityUrlComponents.PathSegments.length === 0 && authorityUrlComponents.HostNameAndPort.endsWith(CIAM_AUTH_URL)) {
      const tenantIdOrDomain = authorityUrlComponents.HostNameAndPort.split(".")[0];
      ciamAuthority = `${ciamAuthority}${tenantIdOrDomain}${AAD_TENANT_DOMAIN_SUFFIX}`;
    }
    return ciamAuthority;
  }
};
Authority.reservedTenantDomains = /* @__PURE__ */ new Set([
  "{tenant}",
  "{tenantid}",
  AADAuthority.COMMON,
  AADAuthority.CONSUMERS,
  AADAuthority.ORGANIZATIONS
]);
function getTenantFromAuthorityString(authority, correlationId) {
  const authorityUrl = new UrlString(authority, correlationId);
  const authorityUrlComponents = authorityUrl.getUrlComponents();
  const tenantId = authorityUrlComponents.PathSegments.slice(-1)[0]?.toLowerCase();
  switch (tenantId) {
    case AADAuthority.COMMON:
    case AADAuthority.ORGANIZATIONS:
    case AADAuthority.CONSUMERS:
      return void 0;
    default:
      return tenantId;
  }
}
function formatAuthorityUri(authorityUri) {
  return authorityUri.endsWith(FORWARD_SLASH) ? authorityUri : `${authorityUri}${FORWARD_SLASH}`;
}
function buildStaticAuthorityOptions(authOptions) {
  const rawCloudDiscoveryMetadata = authOptions.cloudDiscoveryMetadata;
  let cloudDiscoveryMetadata = void 0;
  if (rawCloudDiscoveryMetadata) {
    try {
      cloudDiscoveryMetadata = JSON.parse(rawCloudDiscoveryMetadata);
    } catch (e) {
      throw createClientConfigurationError(invalidCloudDiscoveryMetadata, "");
    }
  }
  return {
    canonicalAuthority: authOptions.authority ? formatAuthorityUri(authOptions.authority) : void 0,
    knownAuthorities: authOptions.knownAuthorities,
    cloudDiscoveryMetadata
  };
}

// node_modules/@azure/msal-common/dist/authority/AuthorityFactory.mjs
var AuthorityFactory_exports = {};
__export(AuthorityFactory_exports, {
  createDiscoveredInstance: () => createDiscoveredInstance
});
async function createDiscoveredInstance(authorityUri, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient) {
  const authorityUriFinal = Authority.transformCIAMAuthority(formatAuthorityUri(authorityUri), correlationId);
  const acquireTokenAuthority = new Authority(authorityUriFinal, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient);
  try {
    await invokeAsync(acquireTokenAuthority.resolveEndpointsAsync.bind(acquireTokenAuthority), AuthorityResolveEndpointsAsync, logger, performanceClient, correlationId)();
    return acquireTokenAuthority;
  } catch (e) {
    throw createClientAuthError(endpointResolutionError, correlationId);
  }
}

// node_modules/@azure/msal-common/dist/request/RequestParameterBuilder.mjs
var RequestParameterBuilder_exports = {};
__export(RequestParameterBuilder_exports, {
  addApplicationTelemetry: () => addApplicationTelemetry,
  addAttributeTokens: () => addAttributeTokens,
  addAuthorizationCode: () => addAuthorizationCode,
  addBrokerParameters: () => addBrokerParameters,
  addCcsOid: () => addCcsOid,
  addCcsUpn: () => addCcsUpn,
  addClaims: () => addClaims,
  addCliData: () => addCliData,
  addClientAssertion: () => addClientAssertion,
  addClientAssertionType: () => addClientAssertionType,
  addClientId: () => addClientId,
  addClientInfo: () => addClientInfo,
  addClientSecret: () => addClientSecret,
  addCodeChallengeParams: () => addCodeChallengeParams,
  addCodeVerifier: () => addCodeVerifier,
  addCorrelationId: () => addCorrelationId,
  addDeviceCode: () => addDeviceCode,
  addDomainHint: () => addDomainHint,
  addEARParameters: () => addEARParameters,
  addExtraParameters: () => addExtraParameters,
  addGrantType: () => addGrantType,
  addIdTokenHint: () => addIdTokenHint,
  addInstanceAware: () => addInstanceAware,
  addLibraryInfo: () => addLibraryInfo,
  addLoginHint: () => addLoginHint,
  addLogoutHint: () => addLogoutHint,
  addNativeBroker: () => addNativeBroker,
  addNonce: () => addNonce,
  addOboAssertion: () => addOboAssertion,
  addPassword: () => addPassword,
  addPopToken: () => addPopToken,
  addPostLogoutRedirectUri: () => addPostLogoutRedirectUri,
  addPrompt: () => addPrompt,
  addRedirectUri: () => addRedirectUri,
  addRefreshToken: () => addRefreshToken,
  addRequestTokenUse: () => addRequestTokenUse,
  addResource: () => addResource,
  addResponseMode: () => addResponseMode,
  addResponseType: () => addResponseType,
  addScopes: () => addScopes,
  addServerTelemetry: () => addServerTelemetry,
  addSid: () => addSid,
  addSshJwk: () => addSshJwk,
  addState: () => addState,
  addThrottling: () => addThrottling,
  addUsername: () => addUsername,
  buildMergedClaims: () => buildMergedClaims,
  instrumentBrokerParams: () => instrumentBrokerParams
});

// node_modules/@azure/msal-common/dist/request/ScopeSet.mjs
var ScopeSet = class _ScopeSet {
  constructor(inputScopes, correlationId) {
    this.correlationId = correlationId;
    const scopeArr = inputScopes ? StringUtils.trimArrayEntries([...inputScopes]) : [];
    const filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
    if (!filteredInput || !filteredInput.length) {
      throw createClientConfigurationError(emptyInputScopesError, correlationId);
    }
    this.scopes = /* @__PURE__ */ new Set();
    filteredInput.forEach((scope) => this.scopes.add(scope));
  }
  /**
   * Factory method to create ScopeSet from space-delimited string
   * @param inputScopeString
   * @param appClientId
   * @param scopesRequired
   */
  static fromString(inputScopeString, correlationId) {
    const scopeString = inputScopeString || "";
    const inputScopes = scopeString.split(" ");
    return new _ScopeSet(inputScopes, correlationId);
  }
  /**
   * Creates the set of scopes to search for in cache lookups
   * @param inputScopeString
   * @returns
   */
  static createSearchScopes(inputScopeString, correlationId) {
    const scopesToUse = inputScopeString && inputScopeString.length > 0 ? inputScopeString : [...OIDC_DEFAULT_SCOPES];
    const scopeSet = new _ScopeSet(scopesToUse, correlationId);
    if (!scopeSet.containsOnlyOIDCScopes()) {
      scopeSet.removeOIDCScopes();
    } else {
      scopeSet.removeScope(OFFLINE_ACCESS_SCOPE);
    }
    return scopeSet;
  }
  /**
   * Check if a given scope is present in this set of scopes.
   * @param scope
   */
  containsScope(scope) {
    const lowerCaseScopes = this.printScopesLowerCase().split(" ");
    const lowerCaseScopesSet = new _ScopeSet(lowerCaseScopes, this.correlationId);
    return scope ? lowerCaseScopesSet.scopes.has(scope.toLowerCase()) : false;
  }
  /**
   * Check if a set of scopes is present in this set of scopes.
   * @param scopeSet
   */
  containsScopeSet(scopeSet) {
    if (!scopeSet || scopeSet.scopes.size <= 0) {
      return false;
    }
    return this.scopes.size >= scopeSet.scopes.size && scopeSet.asArray().every((scope) => this.containsScope(scope));
  }
  /**
   * Check if set of scopes contains only the defaults
   */
  containsOnlyOIDCScopes() {
    let defaultScopeCount = 0;
    OIDC_SCOPES.forEach((defaultScope) => {
      if (this.containsScope(defaultScope)) {
        defaultScopeCount += 1;
      }
    });
    return this.scopes.size === defaultScopeCount;
  }
  /**
   * Appends single scope if passed
   * @param newScope
   */
  appendScope(newScope) {
    if (newScope) {
      this.scopes.add(newScope.trim());
    }
  }
  /**
   * Appends multiple scopes if passed
   * @param newScopes
   */
  appendScopes(newScopes) {
    try {
      newScopes.forEach((newScope) => this.appendScope(newScope));
    } catch (e) {
      throw createClientAuthError(cannotAppendScopeSet, this.correlationId);
    }
  }
  /**
   * Removes element from set of scopes.
   * @param scope
   */
  removeScope(scope) {
    if (!scope) {
      throw createClientAuthError(cannotRemoveEmptyScope, this.correlationId);
    }
    this.scopes.delete(scope.trim());
  }
  /**
   * Removes default scopes from set of scopes
   * Primarily used to prevent cache misses if the default scopes are not returned from the server
   */
  removeOIDCScopes() {
    OIDC_SCOPES.forEach((defaultScope) => {
      this.scopes.delete(defaultScope);
    });
  }
  /**
   * Combines an array of scopes with the current set of scopes.
   * @param otherScopes
   */
  unionScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError(emptyInputScopeSet, this.correlationId);
    }
    const unionScopes = /* @__PURE__ */ new Set();
    otherScopes.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
    this.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
    return unionScopes;
  }
  /**
   * Check if scopes intersect between this set and another.
   * @param otherScopes
   */
  intersectingScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError(emptyInputScopeSet, this.correlationId);
    }
    if (!otherScopes.containsOnlyOIDCScopes()) {
      otherScopes.removeOIDCScopes();
    }
    const unionScopes = this.unionScopeSets(otherScopes);
    const sizeOtherScopes = otherScopes.getScopeCount();
    const sizeThisScopes = this.getScopeCount();
    const sizeUnionScopes = unionScopes.size;
    return sizeUnionScopes < sizeThisScopes + sizeOtherScopes;
  }
  /**
   * Returns size of set of scopes.
   */
  getScopeCount() {
    return this.scopes.size;
  }
  /**
   * Returns the scopes as an array of string values
   */
  asArray() {
    const array = [];
    this.scopes.forEach((val) => array.push(val));
    return array;
  }
  /**
   * Prints scopes into a space-delimited string
   */
  printScopes() {
    if (this.scopes) {
      const scopeArr = this.asArray();
      return scopeArr.join(" ");
    }
    return "";
  }
  /**
   * Prints scopes into a space-delimited lower-case string (used for caching)
   */
  printScopesLowerCase() {
    return this.printScopes().toLowerCase();
  }
};

// node_modules/@azure/msal-common/dist/request/RequestParameterBuilder.mjs
function instrumentBrokerParams(parameters, correlationId, performanceClient) {
  if (!correlationId) {
    return;
  }
  const clientId = parameters.get(CLIENT_ID);
  if (clientId && parameters.has(BROKER_CLIENT_ID)) {
    performanceClient?.addFields({
      embeddedClientId: clientId,
      embeddedRedirectUri: parameters.get(REDIRECT_URI)
    }, correlationId);
  }
}
function addResponseType(parameters, responseType) {
  parameters.set(RESPONSE_TYPE, responseType);
}
function addResponseMode(parameters, responseMode) {
  parameters.set(RESPONSE_MODE, responseMode ? responseMode : ResponseMode.QUERY);
}
function addNativeBroker(parameters) {
  parameters.set(NATIVE_BROKER, "1");
}
function addScopes(parameters, scopes, correlationId, addOidcScopes = true, defaultScopes = OIDC_DEFAULT_SCOPES) {
  if (addOidcScopes && !defaultScopes.includes("openid") && !scopes.includes("openid")) {
    defaultScopes.push("openid");
  }
  const requestScopes = addOidcScopes ? [...scopes || [], ...defaultScopes] : scopes || [];
  const scopeSet = new ScopeSet(requestScopes, correlationId);
  parameters.set(SCOPE, scopeSet.printScopes());
}
function addClientId(parameters, clientId) {
  parameters.set(CLIENT_ID, clientId);
}
function addRedirectUri(parameters, redirectUri) {
  parameters.set(REDIRECT_URI, redirectUri);
}
function addPostLogoutRedirectUri(parameters, redirectUri) {
  parameters.set(POST_LOGOUT_URI, redirectUri);
}
function addIdTokenHint(parameters, idTokenHint) {
  parameters.set(ID_TOKEN_HINT, idTokenHint);
}
function addDomainHint(parameters, domainHint) {
  parameters.set(DOMAIN_HINT, domainHint);
}
function addLoginHint(parameters, loginHint) {
  parameters.set(LOGIN_HINT, loginHint);
}
function addCcsUpn(parameters, loginHint) {
  parameters.set(HeaderNames.CCS_HEADER, `UPN:${loginHint}`);
}
function addCcsOid(parameters, clientInfo) {
  parameters.set(HeaderNames.CCS_HEADER, `Oid:${clientInfo.uid}@${clientInfo.utid}`);
}
function addSid(parameters, sid) {
  parameters.set(SID, sid);
}
function addClaims(parameters, correlationId, claims, clientCapabilities, skipBrokerClaims, claimsToMerge) {
  const configClaims = skipBrokerClaims && parameters.has(BROKER_CLIENT_ID) ? void 0 : clientCapabilities;
  const mergedClaims = buildMergedClaims(claims, configClaims, correlationId, claimsToMerge);
  parameters.set(CLAIMS, mergedClaims);
}
function addCorrelationId(parameters, correlationId) {
  parameters.set(CLIENT_REQUEST_ID, correlationId);
}
function addLibraryInfo(parameters, libraryInfo) {
  parameters.set(X_CLIENT_SKU, libraryInfo.sku);
  parameters.set(X_CLIENT_VER, libraryInfo.version);
  if (libraryInfo.os) {
    parameters.set(X_CLIENT_OS, libraryInfo.os);
  }
  if (libraryInfo.cpu) {
    parameters.set(X_CLIENT_CPU, libraryInfo.cpu);
  }
}
function addApplicationTelemetry(parameters, appTelemetry) {
  if (appTelemetry?.appName) {
    parameters.set(X_APP_NAME, appTelemetry.appName);
  }
  if (appTelemetry?.appVersion) {
    parameters.set(X_APP_VER, appTelemetry.appVersion);
  }
}
function addPrompt(parameters, prompt) {
  parameters.set(PROMPT, prompt);
}
function addState(parameters, state) {
  if (state) {
    parameters.set(STATE, state);
  }
}
function addNonce(parameters, nonce) {
  parameters.set(NONCE, nonce);
}
function addCodeChallengeParams(parameters, codeChallenge, codeChallengeMethod) {
  if (codeChallenge && codeChallengeMethod) {
    parameters.set(CODE_CHALLENGE, codeChallenge);
    parameters.set(CODE_CHALLENGE_METHOD, codeChallengeMethod);
  } else {
    throw createClientConfigurationError(pkceParamsMissing, "");
  }
}
function addAuthorizationCode(parameters, code) {
  parameters.set(CODE, code);
}
function addDeviceCode(parameters, code) {
  parameters.set(DEVICE_CODE, code);
}
function addRefreshToken(parameters, refreshToken) {
  parameters.set(REFRESH_TOKEN, refreshToken);
}
function addCodeVerifier(parameters, codeVerifier) {
  parameters.set(CODE_VERIFIER, codeVerifier);
}
function addClientSecret(parameters, clientSecret) {
  parameters.set(CLIENT_SECRET, clientSecret);
}
function addClientAssertion(parameters, clientAssertion) {
  if (clientAssertion) {
    parameters.set(CLIENT_ASSERTION, clientAssertion);
  }
}
function addClientAssertionType(parameters, clientAssertionType) {
  if (clientAssertionType) {
    parameters.set(CLIENT_ASSERTION_TYPE, clientAssertionType);
  }
}
function addOboAssertion(parameters, oboAssertion) {
  parameters.set(OBO_ASSERTION, oboAssertion);
}
function addRequestTokenUse(parameters, tokenUse) {
  parameters.set(REQUESTED_TOKEN_USE, tokenUse);
}
function addGrantType(parameters, grantType) {
  parameters.set(GRANT_TYPE, grantType);
}
function addClientInfo(parameters) {
  parameters.set(CLIENT_INFO2, "1");
}
function addCliData(parameters) {
  parameters.set(CLI_DATA, "1");
}
function addInstanceAware(parameters) {
  if (!parameters.has(INSTANCE_AWARE)) {
    parameters.set(INSTANCE_AWARE, "true");
  }
}
function addExtraParameters(parameters, extraParams) {
  Object.entries(extraParams).forEach(([key, value]) => {
    if (!parameters.has(key) && value) {
      parameters.set(key, value);
    }
  });
}
var DEFAULT_ID_TOKEN_CLAIMS = {
  [ClaimsRequestKeys.SIGNIN_STATE]: { essential: false },
  [ClaimsRequestKeys.LOGIN_HINT]: { essential: false },
  [ClaimsRequestKeys.TENANT_REGION_SUB_SCOPE]: {
    essential: false
  }
};
function parseClaims(claims, correlationId = "") {
  let parsed;
  try {
    parsed = JSON.parse(claims);
  } catch (e) {
    throw createClientConfigurationError(invalidClaims, correlationId);
  }
  if (!isPlainObject(parsed)) {
    throw createClientConfigurationError(invalidClaims, correlationId);
  }
  return parsed;
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function deepMergeClaims(baseClaims, claimsToMerge) {
  const merged = { ...baseClaims };
  for (const [key, mergeInValue] of Object.entries(claimsToMerge)) {
    const baseValue = merged[key];
    if (isPlainObject(baseValue) && isPlainObject(mergeInValue)) {
      merged[key] = deepMergeClaims(baseValue, mergeInValue);
    } else {
      merged[key] = mergeInValue;
    }
  }
  return merged;
}
function buildMergedClaims(claims, clientCapabilities, correlationId = "", claimsToMerge) {
  let mergedClaims = claims ? parseClaims(claims, correlationId) : {};
  if (claimsToMerge?.trim()) {
    mergedClaims = deepMergeClaims(mergedClaims, parseClaims(claimsToMerge, correlationId));
  }
  if (!Object.prototype.hasOwnProperty.call(mergedClaims, ClaimsRequestKeys.ID_TOKEN)) {
    mergedClaims[ClaimsRequestKeys.ID_TOKEN] = {};
  }
  const idTokenClaims = mergedClaims[ClaimsRequestKeys.ID_TOKEN];
  for (const [key, value] of Object.entries(DEFAULT_ID_TOKEN_CLAIMS)) {
    if (!(key in idTokenClaims)) {
      idTokenClaims[key] = value;
    }
  }
  if (clientCapabilities && clientCapabilities.length > 0) {
    if (!Object.prototype.hasOwnProperty.call(mergedClaims, ClaimsRequestKeys.ACCESS_TOKEN)) {
      mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
    }
    mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][ClaimsRequestKeys.XMS_CC] = {
      values: clientCapabilities
    };
  }
  return JSON.stringify(mergedClaims);
}
function addUsername(parameters, username) {
  parameters.set(PasswordGrantConstants.username, username);
}
function addPassword(parameters, password) {
  parameters.set(PasswordGrantConstants.password, password);
}
function addPopToken(parameters, cnfString) {
  if (cnfString) {
    parameters.set(TOKEN_TYPE, AuthenticationScheme.POP);
    parameters.set(REQ_CNF, cnfString);
  }
}
function addSshJwk(parameters, sshJwkString) {
  if (sshJwkString) {
    parameters.set(TOKEN_TYPE, AuthenticationScheme.SSH);
    parameters.set(REQ_CNF, sshJwkString);
  }
}
function addServerTelemetry(parameters, serverTelemetryManager) {
  parameters.set(X_CLIENT_CURR_TELEM, serverTelemetryManager.generateCurrentRequestHeaderValue());
  parameters.set(X_CLIENT_LAST_TELEM, serverTelemetryManager.generateLastRequestHeaderValue());
}
function addThrottling(parameters) {
  parameters.set(X_MS_LIB_CAPABILITY, X_MS_LIB_CAPABILITY_VALUE);
}
function addLogoutHint(parameters, logoutHint) {
  parameters.set(LOGOUT_HINT, logoutHint);
}
function addBrokerParameters(parameters, brokerClientId, brokerRedirectUri) {
  if (!parameters.has(BROKER_CLIENT_ID)) {
    parameters.set(BROKER_CLIENT_ID, brokerClientId);
  }
  if (!parameters.has(BROKER_REDIRECT_URI)) {
    parameters.set(BROKER_REDIRECT_URI, brokerRedirectUri);
  }
}
function addEARParameters(parameters, jwk) {
  parameters.set(EAR_JWK, encodeURIComponent(jwk));
  const jweCryptoB64Encoded = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0";
  parameters.set(EAR_JWE_CRYPTO, jweCryptoB64Encoded);
}
function addResource(parameters, resource) {
  if (resource) {
    parameters.set(RESOURCE, resource);
  }
}
function addAttributeTokens(parameters, attributeTokens) {
  const serialized = serializeAttributeTokens(attributeTokens);
  if (serialized) {
    parameters.set(ATTRIBUTE_TOKENS, serialized);
  } else {
    parameters.delete(ATTRIBUTE_TOKENS);
  }
}

// node_modules/@azure/msal-common/dist/utils/UrlUtils.mjs
var UrlUtils_exports = {};
__export(UrlUtils_exports, {
  getDeserializedResponse: () => getDeserializedResponse,
  mapToQueryString: () => mapToQueryString,
  normalizeUrlForComparison: () => normalizeUrlForComparison,
  stripLeadingHashOrQuery: () => stripLeadingHashOrQuery,
  validateUrl: () => validateUrl
});
function stripLeadingHashOrQuery(responseString) {
  if (responseString.startsWith("#/")) {
    return responseString.substring(2);
  } else if (responseString.startsWith("#") || responseString.startsWith("?")) {
    return responseString.substring(1);
  }
  return responseString;
}
function getDeserializedResponse(responseString) {
  if (!responseString || responseString.indexOf("=") < 0) {
    return null;
  }
  try {
    const normalizedResponse = stripLeadingHashOrQuery(responseString);
    const deserializedHash = Object.fromEntries(new URLSearchParams(normalizedResponse));
    if (deserializedHash.code || deserializedHash.ear_jwe || deserializedHash.error || deserializedHash.error_description || deserializedHash.state) {
      return deserializedHash;
    }
  } catch (e) {
    throw createClientAuthError(hashNotDeserialized, "");
  }
  return null;
}
function mapToQueryString(parameters) {
  const queryParameterArray = new Array();
  parameters.forEach((value, key) => {
    queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
  });
  return queryParameterArray.join("&");
}
function normalizeUrlForComparison(url, logger, correlationId) {
  if (!url) {
    return url;
  }
  const urlWithoutHash = url.split("#")[0];
  if (!urlWithoutHash) {
    return urlWithoutHash;
  }
  try {
    const urlObj = new URL(urlWithoutHash);
    if (!urlObj.search) {
      urlObj.search = "";
    }
    let pathname;
    try {
      pathname = decodeURIComponent(urlObj.pathname);
    } catch (e) {
      pathname = urlObj.pathname;
    }
    if (!pathname.endsWith("/")) {
      pathname += "/";
    }
    urlObj.pathname = pathname;
    return urlObj.href;
  } catch (e) {
    logger?.error(`Failed to normalize URL for comparison: '${e}'`, correlationId || "");
    throw createClientConfigurationError(urlParseError, correlationId || "");
  }
}
function validateUrl(url, logger, correlationId) {
  try {
    new URL(url);
  } catch (e) {
    logger?.error(`Failed to validate URL: '${e}'`, correlationId || "");
    throw createClientConfigurationError(urlParseError, correlationId || "");
  }
}

// node_modules/@azure/msal-common/dist/crypto/ICrypto.mjs
var JsonWebTokenAlgorithms = {
  ES256: "ES256",
  RS256: "RS256"
};
var DEFAULT_CRYPTO_IMPLEMENTATION = {
  createNewGuid: () => {
    throw createClientAuthError(methodNotImplemented, "");
  },
  base64Decode: () => {
    throw createClientAuthError(methodNotImplemented, "");
  },
  base64Encode: () => {
    throw createClientAuthError(methodNotImplemented, "");
  },
  base64UrlEncode: () => {
    throw createClientAuthError(methodNotImplemented, "");
  },
  encodeKid: () => {
    throw createClientAuthError(methodNotImplemented, "");
  },
  async removeTokenBindingKey(kid, correlationId) {
    throw createClientAuthError(methodNotImplemented, correlationId);
  },
  async clearKeystore(correlationId) {
    throw createClientAuthError(methodNotImplemented, correlationId);
  },
  async signTokenBindingJwt(header, payload, kid, correlationId) {
    throw createClientAuthError(methodNotImplemented, correlationId);
  },
  async hashString() {
    throw createClientAuthError(methodNotImplemented, "");
  }
};

// node_modules/@azure/msal-common/dist/crypto/ITokenBindingKeyManager.mjs
var DEFAULT_TOKEN_BINDING_KEY_MANAGER = {
  async provisionTokenBindingKey(request) {
    throw createClientAuthError(methodNotImplemented, request.correlationId);
  },
  async removeTokenBindingKey(_kid, correlationId) {
    throw createClientAuthError(methodNotImplemented, correlationId);
  },
  async getTokenBindingPublicKeyJwk(_kid, correlationId) {
    throw createClientAuthError(methodNotImplemented, correlationId);
  }
};

// node_modules/@azure/msal-common/dist/logger/Logger.mjs
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["Error"] = 0] = "Error";
  LogLevel2[LogLevel2["Warning"] = 1] = "Warning";
  LogLevel2[LogLevel2["Info"] = 2] = "Info";
  LogLevel2[LogLevel2["Verbose"] = 3] = "Verbose";
  LogLevel2[LogLevel2["Trace"] = 4] = "Trace";
})(LogLevel || (LogLevel = {}));
var CACHE_CAPACITY = 50;
var MAX_LOGS_PER_CORRELATION = 500;
var correlationCache = /* @__PURE__ */ new Map();
function markAsRecentlyUsed(correlationId, data) {
  correlationCache.delete(correlationId);
  correlationCache.set(correlationId, data);
}
function addLogToCache(correlationId, loggedMessage) {
  const currentTime = Date.now();
  let data = correlationCache.get(correlationId);
  if (data) {
    markAsRecentlyUsed(correlationId, data);
  } else {
    data = { logs: [], firstEventTime: currentTime };
    correlationCache.set(correlationId, data);
    if (correlationCache.size > CACHE_CAPACITY) {
      const firstKey = correlationCache.keys().next().value;
      if (firstKey !== void 0) {
        correlationCache.delete(firstKey);
      }
    }
  }
  data.logs.push({
    ...loggedMessage,
    milliseconds: currentTime - data.firstEventTime
  });
  if (data.logs.length > MAX_LOGS_PER_CORRELATION) {
    data.logs.shift();
  }
}
function getMessageHash(str) {
  if (str.length < 6) {
    return null;
  }
  if (str.length > 6 && str[6] !== " ") {
    return null;
  }
  for (let i = 0; i < 6; i++) {
    const char = str[i];
    const isAlphaNumeric = char >= "a" && char <= "z" || char >= "A" && char <= "Z" || char >= "0" && char <= "9";
    if (!isAlphaNumeric) {
      return null;
    }
  }
  return str.substring(0, 6);
}
var Logger = class _Logger {
  constructor(loggerOptions, packageName, packageVersion) {
    this.level = LogLevel.Info;
    const defaultLoggerCallback = () => {
      return;
    };
    const setLoggerOptions = loggerOptions || _Logger.createDefaultLoggerOptions();
    this.localCallback = setLoggerOptions.loggerCallback || defaultLoggerCallback;
    this.piiLoggingEnabled = setLoggerOptions.piiLoggingEnabled || false;
    this.level = typeof setLoggerOptions.logLevel === "number" ? setLoggerOptions.logLevel : LogLevel.Info;
    this.packageName = packageName || "";
    this.packageVersion = packageVersion || "";
  }
  static createDefaultLoggerOptions() {
    return {
      loggerCallback: () => {
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info
    };
  }
  /**
   * Create new Logger with existing configurations.
   */
  clone(packageName, packageVersion) {
    return new _Logger({
      loggerCallback: this.localCallback,
      piiLoggingEnabled: this.piiLoggingEnabled,
      logLevel: this.level
    }, packageName, packageVersion);
  }
  /**
   * Log message with required options.
   */
  logMessage(logMessage, options) {
    const correlationId = options.correlationId;
    const messageHash = getMessageHash(logMessage);
    if (messageHash) {
      const loggedMessage = {
        hash: messageHash,
        level: options.logLevel,
        containsPii: options.containsPii || false,
        milliseconds: 0
        // Will be calculated in addLogToCache
      };
      addLogToCache(correlationId, loggedMessage);
    }
    if (options.logLevel > this.level || !this.piiLoggingEnabled && options.containsPii) {
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toUTCString();
    const logHeader = `[${timestamp}] : [${correlationId}]`;
    const log = `${logHeader} : ${this.packageName}@${this.packageVersion} : ${LogLevel[options.logLevel]} - ${logMessage}`;
    this.executeCallback(options.logLevel, log, options.containsPii || false);
  }
  /**
   * Execute callback with message.
   */
  executeCallback(level, message, containsPii) {
    if (this.localCallback) {
      this.localCallback(level, message, containsPii);
    }
  }
  /**
   * Logs error messages.
   */
  error(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs error messages with PII.
   */
  errorPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs warning messages.
   */
  warning(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs warning messages with PII.
   */
  warningPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs info messages.
   */
  info(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs info messages with PII.
   */
  infoPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs verbose messages.
   */
  verbose(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs verbose messages with PII.
   */
  verbosePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs trace messages.
   */
  trace(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs trace messages with PII.
   */
  tracePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Returns whether PII Logging is enabled or not.
   */
  isPiiLoggingEnabled() {
    return this.piiLoggingEnabled || false;
  }
};

// node_modules/@azure/msal-common/dist/packageMetadata.mjs
var name = "@azure/msal-common";
var version = "16.14.0";

// node_modules/@azure/msal-common/dist/error/CacheErrorCodes.mjs
var cacheQuotaExceeded = "cache_quota_exceeded";
var cacheErrorUnknown = "cache_error_unknown";

// node_modules/@azure/msal-common/dist/error/CacheError.mjs
var CacheError = class _CacheError extends Error {
  constructor(errorCode, errorMessage) {
    const message = errorMessage || getDefaultErrorMessage(errorCode);
    super(message);
    Object.setPrototypeOf(this, _CacheError.prototype);
    this.name = "CacheError";
    this.errorCode = errorCode;
    this.errorMessage = message;
  }
};
function createCacheError(e) {
  if (!(e instanceof Error)) {
    return new CacheError(cacheErrorUnknown);
  }
  if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.message.includes("exceeded the quota")) {
    return new CacheError(cacheQuotaExceeded);
  } else {
    return new CacheError(e.name, e.message);
  }
}

// node_modules/@azure/msal-common/dist/cache/CacheManager.mjs
var CacheManager = class {
  constructor(clientId, cryptoImpl, logger, performanceClient, staticAuthorityOptions, tokenBindingKeyManager) {
    this.clientId = clientId;
    this.cryptoImpl = cryptoImpl;
    this.tokenBindingKeyManager = tokenBindingKeyManager;
    this.commonLogger = logger.clone(name, version);
    this.staticAuthorityOptions = staticAuthorityOptions;
    this.performanceClient = performanceClient;
  }
  /**
   * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
   * @param accountFilter - (Optional) filter to narrow down the accounts returned
   * @returns Array of AccountInfo objects in cache
   */
  getAllAccounts(accountFilter = {}, correlationId) {
    return this.buildTenantProfiles(this.getAccountsFilteredBy(accountFilter, correlationId), correlationId, accountFilter);
  }
  /**
   * Gets first tenanted AccountInfo object found based on provided filters
   */
  getAccountInfoFilteredBy(accountFilter, correlationId) {
    if (Object.keys(accountFilter).length === 0 || Object.values(accountFilter).every((value) => value === null || value === void 0 || value === "")) {
      this.commonLogger.warning("getAccountInfoFilteredBy: Account filter is empty or invalid, returning null", correlationId);
      return null;
    }
    const allAccounts = this.getAllAccounts(accountFilter, correlationId);
    if (allAccounts.length > 1) {
      const sortedAccounts = allAccounts.sort((a, b) => {
        const aHasClaims = a.idTokenClaims ? 1 : 0;
        const bHasClaims = b.idTokenClaims ? 1 : 0;
        return bHasClaims - aHasClaims;
      });
      return sortedAccounts[0];
    } else if (allAccounts.length === 1) {
      return allAccounts[0];
    } else {
      return null;
    }
  }
  /**
   * Returns a single matching
   * @param accountFilter
   * @returns
   */
  getBaseAccountInfo(accountFilter, correlationId) {
    const accountEntities = this.getAccountsFilteredBy(accountFilter, correlationId);
    if (accountEntities.length > 0) {
      return getAccountInfo(accountEntities[0]);
    } else {
      return null;
    }
  }
  /**
   * Matches filtered account entities with cached ID tokens that match the tenant profile-specific account filters
   * and builds the account info objects from the matching ID token's claims
   * @param cachedAccounts
   * @param accountFilter
   * @returns Array of AccountInfo objects that match account and tenant profile filters
   */
  buildTenantProfiles(cachedAccounts, correlationId, accountFilter) {
    return cachedAccounts.flatMap((accountEntity) => {
      return this.getTenantProfilesFromAccountEntity(accountEntity, correlationId, accountFilter?.tenantId, accountFilter);
    });
  }
  getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter) {
    let tenantedAccountInfo = null;
    let idTokenClaims;
    if (tenantProfileFilter) {
      if (!this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter)) {
        return null;
      }
    }
    const idToken = this.getIdToken(accountInfo, correlationId, tokenKeys, tenantProfile.tenantId);
    if (idToken) {
      idTokenClaims = extractTokenClaims(idToken.secret, this.cryptoImpl.base64Decode, correlationId);
      if (!this.idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter)) {
        return null;
      }
    }
    tenantedAccountInfo = updateAccountTenantProfileData(accountInfo, tenantProfile, idTokenClaims, idToken?.secret);
    return tenantedAccountInfo;
  }
  getTenantProfilesFromAccountEntity(accountEntity, correlationId, targetTenantId, tenantProfileFilter) {
    const accountInfo = getAccountInfo(accountEntity);
    let searchTenantProfiles = accountInfo.tenantProfiles || /* @__PURE__ */ new Map();
    const tokenKeys = this.getTokenKeys();
    if (targetTenantId) {
      const tenantProfile = searchTenantProfiles.get(targetTenantId);
      if (tenantProfile) {
        searchTenantProfiles = /* @__PURE__ */ new Map([
          [targetTenantId, tenantProfile]
        ]);
      } else {
        return [];
      }
    }
    const matchingTenantProfiles = [];
    searchTenantProfiles.forEach((tenantProfile) => {
      const tenantedAccountInfo = this.getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter);
      if (tenantedAccountInfo) {
        matchingTenantProfiles.push(tenantedAccountInfo);
      }
    });
    return matchingTenantProfiles;
  }
  tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter) {
    if (!!tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTenantProfile(tenantProfile, tenantProfileFilter.localAccountId)) {
      return false;
    }
    if (!!tenantProfileFilter.name && !(tenantProfile.name === tenantProfileFilter.name)) {
      return false;
    }
    if (tenantProfileFilter.isHomeTenant !== void 0 && !(tenantProfile.isHomeTenant === tenantProfileFilter.isHomeTenant)) {
      return false;
    }
    if (!!tenantProfileFilter.username && !this.matchUsername(tenantProfile.username, tenantProfileFilter.username) && !this.matchUsername(tenantProfile.upn, tenantProfileFilter.username)) {
      return false;
    }
    if (!!tenantProfileFilter.loginHint && !this.matchLoginHintWithTenantProfile(tenantProfile, tenantProfileFilter.loginHint)) {
      return false;
    }
    if (!!tenantProfileFilter.upn && !(tenantProfile.upn === tenantProfileFilter.upn)) {
      return false;
    }
    if (!!tenantProfileFilter.nativeAccountId && tenantProfile.nativeAccountId !== tenantProfileFilter.nativeAccountId) {
      return false;
    }
    return true;
  }
  idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter) {
    if (tenantProfileFilter) {
      if (!!tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTokenClaims(idTokenClaims, tenantProfileFilter.localAccountId)) {
        return false;
      }
      if (!!tenantProfileFilter.loginHint && !this.matchLoginHintFromTokenClaims(idTokenClaims, tenantProfileFilter.loginHint)) {
        return false;
      }
      if (!!tenantProfileFilter.username && !this.matchUsername(idTokenClaims.preferred_username, tenantProfileFilter.username) && !this.matchUsername(idTokenClaims.upn, tenantProfileFilter.username)) {
        return false;
      }
      if (!!tenantProfileFilter.name && !this.matchName(idTokenClaims, tenantProfileFilter.name)) {
        return false;
      }
      if (!!tenantProfileFilter.sid && !this.matchSid(idTokenClaims, tenantProfileFilter.sid)) {
        return false;
      }
    }
    return true;
  }
  /**
   * saves a cache record
   * @param cacheRecord {CacheRecord}
   * @param storeInCache {?StoreInCache}
   * @param correlationId {?string} correlation id
   */
  async saveCacheRecord(cacheRecord, correlationId, kmsi, apiId, storeInCache) {
    if (!cacheRecord) {
      throw createClientAuthError(invalidCacheRecord, correlationId);
    }
    try {
      if (!!cacheRecord.account) {
        await this.setAccount(cacheRecord.account, correlationId, kmsi, apiId);
      }
      if (!!cacheRecord.idToken && storeInCache?.idToken !== false) {
        await this.setIdTokenCredential(cacheRecord.idToken, correlationId, kmsi);
      }
      if (!!cacheRecord.accessToken && storeInCache?.accessToken !== false) {
        await this.saveAccessToken(cacheRecord.accessToken, correlationId, kmsi);
      }
      if (!!cacheRecord.refreshToken && storeInCache?.refreshToken !== false) {
        await this.setRefreshTokenCredential(cacheRecord.refreshToken, correlationId, kmsi);
      }
      if (!!cacheRecord.appMetadata) {
        this.setAppMetadata(cacheRecord.appMetadata, correlationId);
      }
    } catch (e) {
      this.commonLogger?.error(`CacheManager.saveCacheRecord: failed`, correlationId);
      if (e instanceof AuthError) {
        throw e;
      } else {
        throw createCacheError(e);
      }
    }
  }
  /**
   * saves access token credential
   * @param credential - the access token entity to save
   * @param correlationId - unique identifier for the request
   * @param kmsi - keep me signed in flag
   */
  async saveAccessToken(credential, correlationId, kmsi) {
    let additionalCacheKeyHash;
    if (credential.additionalCacheKeyComponents && Object.keys(credential.additionalCacheKeyComponents).length > 0) {
      additionalCacheKeyHash = await this.cryptoImpl.hashString(JSON.stringify(credential.additionalCacheKeyComponents));
    }
    const accessTokenFilter = {
      clientId: credential.clientId,
      credentialType: credential.credentialType,
      environment: credential.environment,
      homeAccountId: credential.homeAccountId,
      realm: credential.realm,
      tokenType: credential.tokenType
    };
    const tokenKeys = this.getTokenKeys();
    const currentScopes = ScopeSet.fromString(credential.target, correlationId);
    tokenKeys.accessToken.forEach((key) => {
      if (!this.accessTokenKeyMatchesFilter(key, accessTokenFilter, false)) {
        return;
      }
      const tokenEntity = this.getAccessTokenCredential(key, correlationId);
      if (tokenEntity && this.credentialMatchesFilter(tokenEntity, accessTokenFilter, correlationId)) {
        const tokenScopeSet = ScopeSet.fromString(tokenEntity.target, correlationId);
        if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
          this.removeAccessToken(key, correlationId);
        }
      }
    });
    await this.setAccessTokenCredential(credential, correlationId, kmsi, additionalCacheKeyHash);
  }
  /**
   * Retrieve account entities matching all provided tenant-agnostic filters; if no filter is set, get all account entities in the cache
   * Not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
   * @param accountFilter - An object containing Account properties to filter by
   */
  getAccountsFilteredBy(accountFilter, correlationId) {
    const allAccountKeys = this.getAccountKeys();
    const matchingAccounts = [];
    allAccountKeys.forEach((cacheKey) => {
      const entity = this.getAccount(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (!!accountFilter.homeAccountId && !this.matchHomeAccountId(entity, accountFilter.homeAccountId)) {
        return;
      }
      if (!!accountFilter.environment && !this.matchEnvironment(entity, accountFilter.environment, correlationId)) {
        return;
      }
      if (!!accountFilter.realm && !this.matchRealm(entity, accountFilter.realm)) {
        return;
      }
      if (!!accountFilter.authorityType && !this.matchAuthorityType(entity, accountFilter.authorityType)) {
        return;
      }
      const tenantProfileFilter = {
        localAccountId: accountFilter?.localAccountId,
        name: accountFilter?.name,
        username: accountFilter?.username,
        loginHint: accountFilter?.loginHint,
        upn: accountFilter?.upn,
        nativeAccountId: accountFilter?.nativeAccountId
      };
      const matchingTenantProfiles = entity.tenantProfiles?.filter((tenantProfile) => {
        return this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter);
      });
      if (matchingTenantProfiles && matchingTenantProfiles.length === 0) {
        return;
      }
      matchingAccounts.push(entity);
    });
    return matchingAccounts;
  }
  /**
   * Returns whether or not the given credential entity matches the filter
   * @param entity
   * @param filter
   * @param correlationId
   * @returns
   */
  credentialMatchesFilter(entity, filter, correlationId) {
    if (!!filter.clientId && !this.matchClientId(entity, filter.clientId)) {
      return false;
    }
    if (!!filter.userAssertionHash && !this.matchUserAssertionHash(entity, filter.userAssertionHash)) {
      return false;
    }
    if (typeof filter.homeAccountId === "string" && !this.matchHomeAccountId(entity, filter.homeAccountId)) {
      return false;
    }
    if (!!filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId)) {
      return false;
    }
    if (!!filter.realm && !this.matchRealm(entity, filter.realm)) {
      return false;
    }
    if (!!filter.credentialType && !this.matchCredentialType(entity, filter.credentialType)) {
      return false;
    }
    if (!!filter.familyId && !this.matchFamilyId(entity, filter.familyId)) {
      return false;
    }
    if (!!filter.target && !this.matchTarget(entity, filter.target, correlationId)) {
      return false;
    }
    if (entity.credentialType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME) {
      if (!this.matchAccessTokenWithAuthScheme(entity, filter)) {
        return false;
      }
    }
    const entityComponents = entity.additionalCacheKeyComponents;
    const filterComponents = filter.additionalCacheKeyComponents;
    const entityHasComponents = !!entityComponents && Object.keys(entityComponents).length > 0;
    const filterHasComponents = !!filterComponents && Object.keys(filterComponents).length > 0;
    if (entityHasComponents !== filterHasComponents) {
      return false;
    }
    if (entityHasComponents && filterHasComponents) {
      const entityKeys = Object.keys(entityComponents).sort();
      const filterKeys = Object.keys(filterComponents).sort();
      if (entityKeys.length !== filterKeys.length) {
        return false;
      }
      for (let i = 0; i < entityKeys.length; i++) {
        if (entityKeys[i] !== filterKeys[i] || entityComponents[entityKeys[i]] !== filterComponents[filterKeys[i]]) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * retrieve appMetadata matching all provided filters; if no filter is set, get all appMetadata
   * @param filter
   * @param correlationId
   */
  getAppMetadataFilteredBy(filter, correlationId) {
    const allCacheKeys = this.getKeys();
    const matchingAppMetadata = {};
    allCacheKeys.forEach((cacheKey) => {
      if (!this.isAppMetadata(cacheKey)) {
        return;
      }
      const entity = this.getAppMetadata(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (!!filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId)) {
        return;
      }
      if (!!filter.clientId && !this.matchClientId(entity, filter.clientId)) {
        return;
      }
      matchingAppMetadata[cacheKey] = entity;
    });
    return matchingAppMetadata;
  }
  /**
   * retrieve authorityMetadata that contains a matching alias
   * @param host
   * @param correlationId
   */
  getAuthorityMetadataByAlias(host, correlationId) {
    const allCacheKeys = this.getAuthorityMetadataKeys();
    let matchedEntity = null;
    allCacheKeys.forEach((cacheKey) => {
      if (!this.isAuthorityMetadata(cacheKey) || cacheKey.indexOf(this.clientId) === -1) {
        return;
      }
      const entity = this.getAuthorityMetadata(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (entity.aliases.indexOf(host) === -1) {
        return;
      }
      matchedEntity = entity;
    });
    return matchedEntity;
  }
  /**
   * Removes all accounts and related tokens from cache.
   */
  removeAllAccounts(correlationId) {
    const accounts = this.getAllAccounts({}, correlationId);
    accounts.forEach((account) => {
      this.removeAccount(account, correlationId);
    });
  }
  /**
   * Removes the account and related tokens for a given account key
   * @param account
   */
  removeAccount(account, correlationId) {
    this.removeAccountContext(account, correlationId);
    const accountKeys = this.getAccountKeys();
    const keyFilter = (key) => {
      return key.includes(account.homeAccountId) && key.includes(account.environment);
    };
    accountKeys.filter(keyFilter).forEach((key) => {
      this.removeItem(key, correlationId);
      this.performanceClient.incrementFields({ accountsRemoved: 1 }, correlationId);
    });
  }
  /**
   * Removes credentials associated with the provided account
   * @param account
   */
  removeAccountContext(account, correlationId) {
    const allTokenKeys = this.getTokenKeys();
    const keyFilter = (key) => {
      return key.includes(account.homeAccountId) && key.includes(account.environment);
    };
    allTokenKeys.idToken.filter(keyFilter).forEach((key) => {
      this.removeIdToken(key, correlationId);
    });
    allTokenKeys.accessToken.filter(keyFilter).forEach((key) => {
      this.removeAccessToken(key, correlationId);
    });
    allTokenKeys.refreshToken.filter(keyFilter).forEach((key) => {
      this.removeRefreshToken(key, correlationId);
    });
  }
  /**
   * returns a boolean if the given credential is removed
   * @param key
   * @param correlationId
   */
  removeAccessToken(key, correlationId) {
    const credential = this.getAccessTokenCredential(key, correlationId);
    if (!credential) {
      return;
    }
    this.removeItem(key, correlationId);
    this.performanceClient.incrementFields({ accessTokensRemoved: 1 }, correlationId);
    if (credential.credentialType.toLowerCase() === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) {
      const tokenType = credential.tokenType?.toLowerCase();
      switch (tokenType) {
        case AuthenticationScheme.POP:
        case AuthenticationScheme.DPOP.toLowerCase(): {
          const accessTokenWithAuthSchemeEntity = credential;
          const kid = accessTokenWithAuthSchemeEntity.keyId;
          if (kid) {
            void this.tokenBindingKeyManager.removeTokenBindingKey(kid, correlationId).catch(() => {
              this.commonLogger.error("Failed to remove token binding key", correlationId);
              this.performanceClient?.incrementFields({ removeTokenBindingKeyFailure: 1 }, correlationId);
            });
          }
          break;
        }
      }
    }
  }
  /**
   * Removes all app metadata objects from cache.
   */
  removeAppMetadata(correlationId) {
    const allCacheKeys = this.getKeys();
    allCacheKeys.forEach((cacheKey) => {
      if (this.isAppMetadata(cacheKey)) {
        this.removeItem(cacheKey, correlationId);
      }
    });
    return true;
  }
  /**
   * Retrieve IdTokenEntity from cache
   * @param account {AccountInfo}
   * @param tokenKeys {?TokenKeys}
   * @param targetRealm {?string}
   * @param performanceClient {?IPerformanceClient}
   * @param correlationId {?string}
   */
  getIdToken(account, correlationId, tokenKeys, targetRealm) {
    this.commonLogger.trace("CacheManager - getIdToken called", correlationId);
    const idTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.ID_TOKEN,
      clientId: this.clientId,
      realm: targetRealm
    };
    const idTokenMap = this.getIdTokensByFilter(idTokenFilter, correlationId, tokenKeys);
    const numIdTokens = idTokenMap.size;
    if (numIdTokens < 1) {
      this.commonLogger.info("CacheManager:getIdToken - No token found", correlationId);
      return null;
    } else if (numIdTokens > 1) {
      let tokensToBeRemoved = idTokenMap;
      if (!targetRealm) {
        const homeIdTokenMap = /* @__PURE__ */ new Map();
        idTokenMap.forEach((idToken, key) => {
          if (idToken.realm === account.tenantId) {
            homeIdTokenMap.set(key, idToken);
          }
        });
        const numHomeIdTokens = homeIdTokenMap.size;
        if (numHomeIdTokens < 1) {
          this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account but none match account entity tenant id, returning first result", correlationId);
          return idTokenMap.values().next().value ?? null;
        } else if (numHomeIdTokens === 1) {
          this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account, defaulting to home tenant profile", correlationId);
          return homeIdTokenMap.values().next().value ?? null;
        } else {
          tokensToBeRemoved = homeIdTokenMap;
        }
      }
      this.commonLogger.info("CacheManager:getIdToken - Multiple matching ID tokens found, clearing them", correlationId);
      tokensToBeRemoved.forEach((idToken, key) => {
        this.removeIdToken(key, correlationId);
      });
      this.performanceClient.addFields({ multiMatchedID: idTokenMap.size }, correlationId);
      return null;
    }
    this.commonLogger.info("CacheManager:getIdToken - Returning ID token", correlationId);
    return idTokenMap.values().next().value ?? null;
  }
  /**
   * Gets all idTokens matching the given filter
   * @param filter
   * @returns
   */
  getIdTokensByFilter(filter, correlationId, tokenKeys) {
    const idTokenKeys = tokenKeys && tokenKeys.idToken || this.getTokenKeys().idToken;
    const idTokens = /* @__PURE__ */ new Map();
    idTokenKeys.forEach((key) => {
      if (!this.idTokenKeyMatchesFilter(key, {
        clientId: this.clientId,
        ...filter
      })) {
        return;
      }
      const idToken = this.getIdTokenCredential(key, correlationId);
      if (idToken && this.credentialMatchesFilter(idToken, filter, correlationId)) {
        idTokens.set(key, idToken);
      }
    });
    return idTokens;
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   * @returns
   */
  idTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    if (filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    return true;
  }
  /**
   * Removes idToken from the cache
   * @param key
   */
  removeIdToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  /**
   * Removes refresh token from the cache
   * @param key
   */
  removeRefreshToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  /**
   * Retrieve AccessTokenEntity from cache
   * @param account {AccountInfo}
   * @param request {BaseAuthRequest}
   * @param tokenKeys {?TokenKeys}
   * @param performanceClient {?IPerformanceClient}
   */
  getAccessToken(account, request, tokenKeys, targetRealm) {
    const correlationId = request.correlationId;
    this.commonLogger.trace("CacheManager - getAccessToken called", correlationId);
    const scopes = ScopeSet.createSearchScopes(request.scopes, correlationId);
    const authScheme = request.authenticationScheme || AuthenticationScheme.BEARER;
    const credentialType = authScheme && authScheme.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN;
    const attributeTokenPartition = serializeAttributeTokens(request.attributeTokens);
    const additionalCacheKeyComponents = attributeTokenPartition ? {
      attribute_tokens: attributeTokenPartition
    } : void 0;
    const accessTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType,
      clientId: this.clientId,
      realm: targetRealm || account.tenantId,
      target: scopes,
      tokenType: authScheme,
      keyId: authScheme === AuthenticationScheme.SSH ? request.sshKid : void 0,
      additionalCacheKeyComponents
    };
    const accessTokenKeys = tokenKeys && tokenKeys.accessToken || this.getTokenKeys().accessToken;
    const accessTokens = [];
    const matchedKeys = [];
    accessTokenKeys.forEach((key) => {
      if (this.accessTokenKeyMatchesFilter(key, accessTokenFilter, true)) {
        const accessToken = this.getAccessTokenCredential(key, correlationId);
        if (accessToken && this.credentialMatchesFilter(accessToken, accessTokenFilter, correlationId)) {
          accessTokens.push(accessToken);
          matchedKeys.push(key);
        }
      }
    });
    if (accessTokens.length < 1) {
      this.commonLogger.info("CacheManager:getAccessToken - No token found", correlationId);
      return null;
    } else if (accessTokens.length > 1) {
      this.commonLogger.info("CacheManager:getAccessToken - Multiple access tokens found, clearing them", correlationId);
      matchedKeys.forEach((key) => {
        this.removeAccessToken(key, correlationId);
      });
      this.performanceClient.addFields({ multiMatchedAT: accessTokens.length }, correlationId);
      return null;
    }
    this.commonLogger.info("CacheManager:getAccessToken - Returning access token", correlationId);
    return accessTokens[0];
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   * @param keyMustContainAllScopes
   * @returns
   */
  accessTokenKeyMatchesFilter(inputKey, filter, keyMustContainAllScopes) {
    const key = inputKey.toLowerCase();
    if (filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.realm && key.indexOf(filter.realm.toLowerCase()) === -1) {
      return false;
    }
    if (filter.target) {
      const scopes = filter.target.asArray();
      for (let i = 0; i < scopes.length; i++) {
        if (keyMustContainAllScopes && !key.includes(scopes[i].toLowerCase())) {
          return false;
        } else if (!keyMustContainAllScopes && key.includes(scopes[i].toLowerCase())) {
          return true;
        }
      }
    }
    return true;
  }
  /**
   * Gets all access tokens matching the filter
   * @param filter
   * @returns
   */
  getAccessTokensByFilter(filter, correlationId) {
    const tokenKeys = this.getTokenKeys();
    const accessTokens = [];
    tokenKeys.accessToken.forEach((key) => {
      if (!this.accessTokenKeyMatchesFilter(key, filter, true)) {
        return;
      }
      const accessToken = this.getAccessTokenCredential(key, correlationId);
      if (accessToken && this.credentialMatchesFilter(accessToken, filter, correlationId)) {
        accessTokens.push(accessToken);
      }
    });
    return accessTokens;
  }
  /**
   * Helper to retrieve the appropriate refresh token from cache
   * @param account {AccountInfo}
   * @param familyRT {boolean}
   * @param tokenKeys {?TokenKeys}
   * @param performanceClient {?IPerformanceClient}
   * @param correlationId {?string}
   */
  getRefreshToken(account, familyRT, correlationId, tokenKeys) {
    this.commonLogger.trace("CacheManager - getRefreshToken called", correlationId);
    const id = familyRT ? THE_FAMILY_ID : void 0;
    const refreshTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.REFRESH_TOKEN,
      clientId: this.clientId,
      familyId: id
    };
    const refreshTokenKeys = tokenKeys && tokenKeys.refreshToken || this.getTokenKeys().refreshToken;
    const refreshTokens = [];
    refreshTokenKeys.forEach((key) => {
      if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
        const refreshToken = this.getRefreshTokenCredential(key, correlationId);
        if (refreshToken && this.credentialMatchesFilter(refreshToken, refreshTokenFilter, correlationId)) {
          refreshTokens.push(refreshToken);
        }
      }
    });
    const numRefreshTokens = refreshTokens.length;
    if (numRefreshTokens < 1) {
      this.commonLogger.info("CacheManager:getRefreshToken - No refresh token found.", correlationId);
      return null;
    }
    if (numRefreshTokens > 1) {
      this.performanceClient.addFields({ multiMatchedRT: numRefreshTokens }, correlationId);
    }
    this.commonLogger.info("CacheManager:getRefreshToken - returning refresh token", correlationId);
    return refreshTokens[0];
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   */
  refreshTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    if (filter.familyId && key.indexOf(filter.familyId.toLowerCase()) === -1) {
      return false;
    }
    if (!filter.familyId && filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    return true;
  }
  /**
   * Retrieve AppMetadataEntity from cache
   */
  readAppMetadataFromCache(environment, correlationId) {
    const appMetadataFilter = {
      environment,
      clientId: this.clientId
    };
    const appMetadata = this.getAppMetadataFilteredBy(appMetadataFilter, correlationId);
    const appMetadataEntries = Object.keys(appMetadata).map((key) => appMetadata[key]);
    const numAppMetadata = appMetadataEntries.length;
    if (numAppMetadata < 1) {
      return null;
    } else if (numAppMetadata > 1) {
      throw createClientAuthError(multipleMatchingAppMetadata, correlationId);
    }
    return appMetadataEntries[0];
  }
  /**
   * Return the family_id value associated  with FOCI
   * @param environment
   * @param clientId
   */
  isAppMetadataFOCI(environment, correlationId) {
    const appMetadata = this.readAppMetadataFromCache(environment, correlationId);
    return !!(appMetadata && appMetadata.familyId === THE_FAMILY_ID);
  }
  /**
   * helper to match account ids
   * @param value
   * @param homeAccountId
   */
  matchHomeAccountId(entity, homeAccountId) {
    return !!(typeof entity.homeAccountId === "string" && homeAccountId === entity.homeAccountId);
  }
  /**
   * helper to match account ids
   * @param entity
   * @param localAccountId
   * @returns
   */
  matchLocalAccountIdFromTokenClaims(tokenClaims, localAccountId) {
    const idTokenLocalAccountId = tokenClaims.oid || tokenClaims.sub;
    return localAccountId === idTokenLocalAccountId;
  }
  matchLocalAccountIdFromTenantProfile(tenantProfile, localAccountId) {
    return tenantProfile.localAccountId === localAccountId;
  }
  /**
   * helper to match names
   * @param entity
   * @param name
   * @returns true if the downcased name properties are present and match in the filter and the entity
   */
  matchName(claims, name3) {
    return !!(name3.toLowerCase() === claims.name?.toLowerCase());
  }
  /**
   * helper to match usernames
   * @param entity
   * @param username
   * @returns
   */
  matchUsername(cachedUsername, filterUsername) {
    return !!(cachedUsername && typeof cachedUsername === "string" && filterUsername?.toLowerCase() === cachedUsername.toLowerCase());
  }
  /**
   * helper to match loginhints
   * @param entity
   * @param loginHint
   * @returns
   */
  matchLoginHintWithTenantProfile(tenantProfile, loginHintFilter) {
    return tenantProfile.loginHint === loginHintFilter || tenantProfile.username === loginHintFilter || tenantProfile.upn === loginHintFilter;
  }
  /**
   * helper to match assertion
   * @param value
   * @param oboAssertion
   */
  matchUserAssertionHash(entity, userAssertionHash) {
    return !!(entity.userAssertionHash && userAssertionHash === entity.userAssertionHash);
  }
  /**
   * helper to match environment
   * @param value
   * @param environment
   */
  matchEnvironment(entity, environment, correlationId) {
    if (this.staticAuthorityOptions) {
      const staticAliases = getAliasesFromStaticSources(this.staticAuthorityOptions, this.commonLogger, correlationId);
      if (staticAliases.includes(environment) && staticAliases.includes(entity.environment)) {
        return true;
      }
    }
    const cloudMetadata = this.getAuthorityMetadataByAlias(environment, correlationId);
    if (cloudMetadata && cloudMetadata.aliases.indexOf(entity.environment) > -1) {
      return true;
    }
    return false;
  }
  /**
   * helper to match credential type
   * @param entity
   * @param credentialType
   */
  matchCredentialType(entity, credentialType) {
    return entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase();
  }
  /**
   * helper to match client ids
   * @param entity
   * @param clientId
   */
  matchClientId(entity, clientId) {
    return !!(entity.clientId && clientId === entity.clientId);
  }
  /**
   * helper to match family ids
   * @param entity
   * @param familyId
   */
  matchFamilyId(entity, familyId) {
    return !!(entity.familyId && familyId === entity.familyId);
  }
  /**
   * helper to match realm
   * @param entity
   * @param realm
   */
  matchRealm(entity, realm) {
    return !!(entity.realm?.toLowerCase() === realm.toLowerCase());
  }
  /**
   * helper to match loginHint which can be either:
   * 1. login_hint ID token claim
   * 2. username in cached account object
   * 3. upn in ID token claims
   * @param entity
   * @param loginHint
   * @returns
   */
  matchLoginHintFromTokenClaims(tokenClaims, loginHint) {
    if (tokenClaims.login_hint === loginHint) {
      return true;
    }
    if (tokenClaims.preferred_username === loginHint) {
      return true;
    }
    if (tokenClaims.upn === loginHint) {
      return true;
    }
    if (tokenClaims.emails && tokenClaims.emails.includes(loginHint)) {
      return true;
    }
    return false;
  }
  /**
   * Helper to match sid
   * @param entity
   * @param sid
   * @returns true if the sid claim is present and matches the filter
   */
  matchSid(idTokenClaims, sid) {
    return idTokenClaims.sid === sid;
  }
  matchAuthorityType(entity, authorityType) {
    return !!(entity.authorityType && authorityType.toLowerCase() === entity.authorityType.toLowerCase());
  }
  /**
   * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
   * @param entity
   * @param target
   */
  matchTarget(entity, target, correlationId) {
    const isNotAccessTokenCredential = entity.credentialType !== CredentialType.ACCESS_TOKEN && entity.credentialType !== CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
    if (isNotAccessTokenCredential || !entity.target) {
      return false;
    }
    const entityScopeSet = ScopeSet.fromString(entity.target, correlationId);
    return entityScopeSet.containsScopeSet(target);
  }
  /**
   * Returns true if the credential's tokenType or Authentication Scheme matches the one in the request, false otherwise
   * @param entity
   * @param tokenType
   */
  matchTokenType(entity, tokenType) {
    return !!(entity.tokenType && entity.tokenType.toLowerCase() === tokenType.toLowerCase());
  }
  matchAccessTokenWithAuthScheme(entity, filter) {
    const normalizedFilterTokenType = filter.tokenType?.toLowerCase();
    if (!!filter.tokenType && !this.matchTokenType(entity, filter.tokenType)) {
      return false;
    }
    switch (normalizedFilterTokenType) {
      case "dpop":
      case AuthenticationScheme.SSH:
        return this.matchKeyBoundAccessToken(entity, filter);
      default:
        return true;
    }
  }
  matchKeyBoundAccessToken(entity, filter) {
    if (!filter.keyId) {
      return true;
    }
    return this.matchKeyId(entity, filter.keyId);
  }
  /**
   * Returns true if the credential's keyId matches the one in the request, false otherwise
   * @param entity
   * @param keyId
   */
  matchKeyId(entity, keyId) {
    return !!(entity.keyId && entity.keyId === keyId);
  }
  /**
   * returns if a given cache entity is of the type appmetadata
   * @param key
   */
  isAppMetadata(key) {
    return key.indexOf(APP_METADATA) !== -1;
  }
  /**
   * returns if a given cache entity is of the type authoritymetadata
   * @param key
   */
  isAuthorityMetadata(key) {
    return key.indexOf(AUTHORITY_METADATA_CACHE_KEY) !== -1;
  }
  /**
   * returns cache key used for cloud instance metadata
   */
  generateAuthorityMetadataCacheKey(authority) {
    return `${AUTHORITY_METADATA_CACHE_KEY}-${this.clientId}-${authority}`;
  }
  /**
   * Helper to convert serialized data to object
   * @param obj
   * @param json
   */
  static toObject(obj, json) {
    for (const propertyName in json) {
      obj[propertyName] = json[propertyName];
    }
    return obj;
  }
};
var DefaultStorageClass = class extends CacheManager {
  async setAccount() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAccount() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  async setIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  async setAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  async setRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  setAppMetadata() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAppMetadata() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  setServerTelemetry() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getServerTelemetry() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  setAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAuthorityMetadataKeys() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  setThrottlingCache() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getThrottlingCache() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  removeItem() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getKeys() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getAccountKeys() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  getTokenKeys() {
    throw createClientAuthError(methodNotImplemented, "");
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  generateCredentialKey(_credential, _hash) {
    throw createClientAuthError(methodNotImplemented, "");
  }
  generateAccountKey() {
    throw createClientAuthError(methodNotImplemented, "");
  }
};

// node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvent.mjs
var PerformanceEventStatus = {
  NotStarted: 0,
  InProgress: 1,
  Completed: 2
};

// node_modules/@azure/msal-common/dist/telemetry/performance/StubPerformanceClient.mjs
var StubPerformanceClient = class {
  generateId() {
    return "callback-id";
  }
  startMeasurement(measureName, correlationId) {
    return {
      end: () => null,
      discard: () => {
      },
      add: () => {
      },
      increment: () => {
      },
      event: {
        eventId: this.generateId(),
        status: PerformanceEventStatus.InProgress,
        authority: "",
        libraryName: "",
        libraryVersion: "",
        clientId: "",
        name: measureName,
        startTimeMs: Date.now(),
        correlationId: correlationId || ""
      }
    };
  }
  endMeasurement() {
    return null;
  }
  discardMeasurements() {
    return;
  }
  removePerformanceCallback() {
    return true;
  }
  addPerformanceCallback() {
    return "";
  }
  emitEvents() {
    return;
  }
  addFields() {
    return;
  }
  addGlobalFields() {
    return;
  }
  incrementFields() {
    return;
  }
  cacheEventByCorrelationId() {
    return;
  }
};

// node_modules/@azure/msal-common/dist/config/ClientConfiguration.mjs
var DEFAULT_SYSTEM_OPTIONS = {
  tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
  preventCorsPreflight: false
};
var DEFAULT_LOGGER_IMPLEMENTATION = {
  loggerCallback: () => {
  },
  piiLoggingEnabled: false,
  logLevel: LogLevel.Info,
  correlationId: ""
};
var DEFAULT_NETWORK_IMPLEMENTATION = {
  async sendGetRequestAsync() {
    throw createClientAuthError(methodNotImplemented, "");
  },
  async sendPostRequestAsync() {
    throw createClientAuthError(methodNotImplemented, "");
  }
};
var DEFAULT_LIBRARY_INFO = {
  sku: SKU,
  version,
  cpu: "",
  os: ""
};
var DEFAULT_CLIENT_CREDENTIALS = {
  clientSecret: "",
  clientAssertion: void 0
};
var DEFAULT_AZURE_CLOUD_OPTIONS = {
  azureCloudInstance: AzureCloudInstance.None,
  tenant: `${DEFAULT_COMMON_TENANT}`
};
var DEFAULT_TELEMETRY_OPTIONS = {
  application: {
    appName: "",
    appVersion: ""
  }
};
function buildClientConfiguration({ authOptions: userAuthOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation, tokenBindingKeyManager, clientCredentials, libraryInfo, telemetry, serverTelemetryManager, persistencePlugin, serializableCache }) {
  const loggerOptions = {
    ...DEFAULT_LOGGER_IMPLEMENTATION,
    ...userLoggerOption
  };
  const resolvedTokenBindingKeyManager = tokenBindingKeyManager || DEFAULT_TOKEN_BINDING_KEY_MANAGER;
  return {
    authOptions: buildAuthOptions(userAuthOptions),
    systemOptions: { ...DEFAULT_SYSTEM_OPTIONS, ...userSystemOptions },
    loggerOptions,
    storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION, new Logger(loggerOptions, name, version), new StubPerformanceClient(), void 0, resolvedTokenBindingKeyManager),
    networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
    cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
    tokenBindingKeyManager: resolvedTokenBindingKeyManager,
    clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
    libraryInfo: { ...DEFAULT_LIBRARY_INFO, ...libraryInfo },
    telemetry: { ...DEFAULT_TELEMETRY_OPTIONS, ...telemetry },
    serverTelemetryManager: serverTelemetryManager || null,
    persistencePlugin: persistencePlugin || null,
    serializableCache: serializableCache || null
  };
}
function buildAuthOptions(authOptions) {
  return {
    clientCapabilities: [],
    azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS,
    instanceAware: false,
    isMcp: false,
    ...authOptions
  };
}
function isOidcProtocolMode(config) {
  return config.authOptions.authority.options.protocolMode === ProtocolMode.OIDC;
}

// node_modules/@azure/msal-common/dist/cache/persistence/TokenCacheContext.mjs
var TokenCacheContext = class {
  constructor(tokenCache, hasChanged) {
    this.cache = tokenCache;
    this.hasChanged = hasChanged;
  }
  /**
   * boolean which indicates the changes in cache
   */
  get cacheHasChanged() {
    return this.hasChanged;
  }
  /**
   * function to retrieve the token cache
   */
  get tokenCache() {
    return this.cache;
  }
};

// node_modules/@azure/msal-common/dist/error/JoseHeaderError.mjs
var JoseHeaderError = class _JoseHeaderError extends AuthError {
  constructor(errorCode, correlationId, errorMessage) {
    super(errorCode, correlationId, errorMessage);
    this.name = "JoseHeaderError";
    Object.setPrototypeOf(this, _JoseHeaderError.prototype);
  }
};
function createJoseHeaderError(code, correlationId) {
  return new JoseHeaderError(code, correlationId);
}

// node_modules/@azure/msal-common/dist/utils/ObjectUtils.mjs
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(value) === null) {
    return true;
  }
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
}

// node_modules/@azure/msal-common/dist/error/JoseHeaderErrorCodes.mjs
var missingKidError = "missing_kid_error";
var missingAlgError = "missing_alg_error";
var missingJwkError = "missing_jwk_error";
var invalidJwkError = "invalid_jwk_error";

// node_modules/@azure/msal-common/dist/crypto/JoseHeader.mjs
var JoseHeader = class _JoseHeader {
  constructor(options, correlationId) {
    if (typeof options.alg !== "string" || !options.alg) {
      throw createJoseHeaderError(missingAlgError, correlationId);
    }
    this.typ = options.typ;
    this.alg = options.alg;
    this.kid = options.kid;
    this.jwk = options.jwk;
  }
  /**
   * Builds SignedHttpRequest formatted JOSE Header from the
   * JOSE Header options provided or previously set on the object.
   * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
   * @param shrHeaderOptions
   * @param correlationId
   * @returns
   */
  static getShrHeader(shrHeaderOptions, correlationId) {
    if (!shrHeaderOptions.kid) {
      throw createJoseHeaderError(missingKidError, correlationId);
    }
    if (!shrHeaderOptions.alg) {
      throw createJoseHeaderError(missingAlgError, correlationId);
    }
    return new _JoseHeader({
      // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
      typ: shrHeaderOptions.typ || JsonWebTokenTypes.Pop,
      kid: shrHeaderOptions.kid,
      alg: shrHeaderOptions.alg
    }, correlationId);
  }
  /**
   * Builds a DPoP formatted JOSE Header from the JOSE Header options provided.
   * Throws if public JWK or algorithm aren't provided since they are required for DPoP.
   * @param dpopHeaderOptions
   * @param correlationId
   * @returns
   */
  static getDpopHeader(dpopHeaderOptions, correlationId) {
    if (!isPlainObject2(dpopHeaderOptions.jwk)) {
      throw createJoseHeaderError(missingJwkError, correlationId);
    }
    if (!dpopHeaderOptions.alg) {
      throw createJoseHeaderError(missingAlgError, correlationId);
    }
    if (Object.keys(dpopHeaderOptions.jwk).length === 0) {
      throw createJoseHeaderError(invalidJwkError, correlationId);
    }
    return new _JoseHeader({
      typ: JsonWebTokenTypes.Dpop,
      alg: dpopHeaderOptions.alg,
      jwk: dpopHeaderOptions.jwk
    }, correlationId);
  }
};

// node_modules/@azure/msal-common/dist/crypto/PopTokenGenerator.mjs
var KeyLocation = {
  SW: "sw"
};
var SHR_TOKEN_BINDING_KEY_TYPE = "shr";
var SHR_TOKEN_BINDING_KEY_ALGORITHM = JsonWebTokenAlgorithms.RS256;
var PopTokenGenerator = class {
  constructor(cryptoUtils, tokenBindingKeyManager, performanceClient) {
    this.cryptoUtils = cryptoUtils;
    this.tokenBindingKeyManager = tokenBindingKeyManager;
    this.performanceClient = performanceClient;
  }
  /**
   * Generates the req_cnf validated at the RP in the POP protocol for SHR parameters
   * and returns an object containing the keyid, the full req_cnf string and the req_cnf string hash
   * @param request
   * @returns
   */
  async generateCnf(request, logger) {
    const reqCnf = await invokeAsync(this.generateKid.bind(this), PopTokenGenerateCnf, logger, this.performanceClient, request.correlationId)(request);
    const reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
    return {
      kid: reqCnf.kid,
      reqCnfString
    };
  }
  /**
   * Generates key_id for a SHR token request
   * @param request
   * @returns
   */
  async generateKid(request) {
    const kidThumbprint = await this.tokenBindingKeyManager.provisionTokenBindingKey({
      correlationId: request.correlationId,
      tokenBindingKeyType: SHR_TOKEN_BINDING_KEY_TYPE,
      tokenBindingKeyAlgorithm: SHR_TOKEN_BINDING_KEY_ALGORITHM
    });
    return {
      kid: kidThumbprint,
      xms_ksl: KeyLocation.SW
    };
  }
  /**
   * Signs the POP access_token with the local generated key-pair
   * @param accessToken
   * @param request
   * @returns
   */
  async signPopToken(accessToken, keyId, request) {
    return this.signPayload(accessToken, keyId, request);
  }
  /**
   * Utility function to generate the signed JWT for an access_token
   * @param payload
   * @param kid
   * @param request
   * @param claims
   * @returns
   */
  async signPayload(payload, keyId, request, claims) {
    const { resourceRequestMethod, resourceRequestUri, shrClaims, shrNonce, shrOptions } = request;
    const resourceUrlString = resourceRequestUri ? new UrlString(resourceRequestUri, request.correlationId) : void 0;
    const resourceUrlComponents = resourceUrlString?.getUrlComponents();
    const publicKeyJwk = await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(keyId, request.correlationId);
    const encodedKeyIdThumbprint = this.cryptoUtils.base64UrlEncode(JSON.stringify({ kid: keyId }));
    const shrAlgorithm = shrOptions?.header?.alg || publicKeyJwk.alg || SHR_TOKEN_BINDING_KEY_ALGORITHM;
    const shrHeader = JoseHeader.getShrHeader({
      ...shrOptions?.header,
      alg: shrAlgorithm,
      kid: encodedKeyIdThumbprint
    }, request.correlationId);
    const shrPayload = {
      at: payload,
      ts: nowSeconds(),
      m: resourceRequestMethod?.toUpperCase(),
      u: resourceUrlComponents?.HostNameAndPort,
      nonce: shrNonce || this.cryptoUtils.createNewGuid(),
      p: resourceUrlComponents?.AbsolutePath,
      q: resourceUrlComponents?.QueryString ? [[], resourceUrlComponents.QueryString] : void 0,
      client_claims: shrClaims || void 0,
      ...claims,
      cnf: {
        jwk: publicKeyJwk
      }
    };
    return this.cryptoUtils.signTokenBindingJwt(shrHeader, shrPayload, keyId, request.correlationId);
  }
};

// node_modules/@azure/msal-common/dist/crypto/DpopProofGenerator.mjs
var DPOP_HTM_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var DPOP_TOKEN_BINDING_KEY_TYPE = "dpop";
var DPOP_JWT_HEADER_ALGORITHM = JsonWebTokenAlgorithms.ES256;
function buildProofHeader(publicJwk, correlationId) {
  return JoseHeader.getDpopHeader({
    alg: DPOP_JWT_HEADER_ALGORITHM,
    jwk: publicJwk
  }, correlationId);
}
function normalizeHtm(htm, correlationId) {
  if (typeof htm !== "string" || !DPOP_HTM_REGEX.test(htm)) {
    throw createClientConfigurationError(invalidDpopHtm, correlationId);
  }
  return htm.toUpperCase();
}
function normalizeHtu(url, correlationId) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw createClientConfigurationError(urlParseError, correlationId);
  }
  if (!/^https:\/\//i.test(url) || parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw createClientConfigurationError(invalidDpopHtu, correlationId);
  }
  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.href;
}
function validateDpopNonce(nonce, correlationId) {
  if (nonce !== void 0 && nonce.trim().length === 0) {
    throw createClientConfigurationError(invalidDpopNonce, correlationId);
  }
}
var DpopProofGenerator = class {
  constructor(cryptoUtils, tokenBindingKeyManager) {
    this.cryptoUtils = cryptoUtils;
    this.tokenBindingKeyManager = tokenBindingKeyManager;
  }
  /**
   * Provisions a fresh DPoP key and returns the RFC 7638 JWK thumbprint used
   * as `dpop_jkt`.
   */
  async generateJkt(correlationId = "") {
    return this.tokenBindingKeyManager.provisionTokenBindingKey({
      tokenBindingKeyType: DPOP_TOKEN_BINDING_KEY_TYPE,
      tokenBindingKeyAlgorithm: DPOP_JWT_HEADER_ALGORITHM,
      correlationId
    });
  }
  /**
   * Builds RFC 9449 claims for a token-endpoint DPoP proof.
   * - htm is always "POST" because token endpoint requests use HTTP POST (RFC 9449 §5).
   * - htu is the normalized token endpoint URI (query and fragment stripped).
   * - jti is a fresh CSPRNG-backed unique identifier for every proof.
   */
  buildTokenProofClaims(params, correlationId = "") {
    validateDpopNonce(params.nonce, correlationId);
    const claims = {
      jti: this.cryptoUtils.createNewGuid(),
      htm: "POST",
      htu: normalizeHtu(params.tokenEndpoint, correlationId),
      iat: nowSeconds()
    };
    if (params.nonce !== void 0) {
      claims.nonce = params.nonce;
    }
    return claims;
  }
  /**
   * Builds and signs a compact DPoP proof JWT for a token-endpoint request.
   */
  async generateTokenProof(params, keyId, correlationId = "") {
    return this.generateProof(this.buildTokenProofClaims(params, correlationId), keyId, correlationId);
  }
  /**
   * Builds RFC 9449 claims for a resource-endpoint DPoP proof.
   * - htm is uppercased per RFC 9449 §4.2.
   * - htu is the normalized resource URI (query and fragment stripped).
   * - ath is the base64url-encoded SHA-256 hash of the ASCII access token.
   * - jti is a fresh CSPRNG-backed unique identifier for every proof.
   */
  buildResourceProofClaims(params, correlationId = "") {
    validateDpopNonce(params.nonce, correlationId);
    const claims = {
      jti: this.cryptoUtils.createNewGuid(),
      htm: normalizeHtm(params.htm, correlationId),
      htu: normalizeHtu(params.htu, correlationId),
      ath: params.ath,
      iat: nowSeconds()
    };
    if (params.nonce !== void 0) {
      claims.nonce = params.nonce;
    }
    return claims;
  }
  /**
   * Builds and signs a compact DPoP proof JWT for a resource request.
   */
  async generateResourceProof(params, keyId, correlationId = "") {
    const { htu, htm, nonce } = params;
    if (!htu || !htm) {
      throw createClientConfigurationError(dpopMissingResourceContext, correlationId);
    }
    const ath = await this.cryptoUtils.hashString(params.accessToken);
    return this.generateProof(this.buildResourceProofClaims({
      htu,
      htm,
      ath,
      nonce
    }, correlationId), keyId, correlationId);
  }
  async generateProof(claims, keyId, correlationId) {
    const publicJwk = await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(keyId, correlationId);
    return this.cryptoUtils.signTokenBindingJwt(buildProofHeader(publicJwk, correlationId), claims, keyId, correlationId);
  }
};

// node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthErrorCodes.mjs
var noTokensFound = "no_tokens_found";
var refreshTokenExpired = "refresh_token_expired";
var uiNotAllowed = "ui_not_allowed";
var interactionRequired = "interaction_required";
var consentRequired = "consent_required";
var loginRequired = "login_required";
var badToken = "bad_token";
var interruptedUser = "interrupted_user";

// node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthError.mjs
var InteractionRequiredServerErrorMessage = [
  interactionRequired,
  consentRequired,
  loginRequired,
  badToken,
  uiNotAllowed,
  interruptedUser
];
var InteractionRequiredAuthSubErrorMessage = [
  "message_only",
  "additional_action",
  "basic_action",
  "user_password_expired",
  "consent_required",
  "bad_token",
  "ui_not_allowed",
  "interrupted_user"
];
var InteractionRequiredAuthError = class _InteractionRequiredAuthError extends AuthError {
  constructor(errorCode, correlationId, errorMessage, subError, timestamp, traceId, claims, errorNo) {
    super(errorCode, correlationId, errorMessage, subError);
    Object.setPrototypeOf(this, _InteractionRequiredAuthError.prototype);
    this.timestamp = timestamp || "";
    this.traceId = traceId || "";
    this.claims = claims || "";
    this.name = "InteractionRequiredAuthError";
    this.errorNo = errorNo;
  }
};
function isInteractionRequiredError(errorCode, errorString, subError) {
  const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
  const isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
  const isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some((irErrorCode) => {
    return errorString.indexOf(irErrorCode) > -1;
  });
  return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
}
function createInteractionRequiredAuthError(errorCode, correlationId, errorMessage) {
  return new InteractionRequiredAuthError(errorCode, correlationId, errorMessage);
}

// node_modules/@azure/msal-common/dist/error/ServerError.mjs
var ServerError = class _ServerError extends AuthError {
  constructor(errorCode, correlationId, errorMessage, subError, errorNo, status) {
    super(errorCode, correlationId, errorMessage, subError);
    this.name = "ServerError";
    this.errorNo = errorNo;
    this.status = status;
    Object.setPrototypeOf(this, _ServerError.prototype);
  }
};

// node_modules/@azure/msal-common/dist/utils/ProtocolUtils.mjs
function parseRequestState(base64Decode, state, correlationId) {
  if (!base64Decode) {
    throw createClientAuthError(noCryptoObject, correlationId);
  }
  if (!state) {
    throw createClientAuthError(invalidState, correlationId);
  }
  try {
    const splitState = state.split(RESOURCE_DELIM);
    const libraryState = splitState[0];
    const userState = splitState.length > 1 ? splitState.slice(1).join(RESOURCE_DELIM) : "";
    const libraryStateString = base64Decode(libraryState);
    const libraryStateObj = JSON.parse(libraryStateString);
    return {
      userRequestState: userState || "",
      libraryState: libraryStateObj
    };
  } catch (e) {
    throw createClientAuthError(invalidState, correlationId);
  }
}

// node_modules/@azure/msal-common/dist/response/ResponseHandler.mjs
var ResponseHandler = class _ResponseHandler {
  constructor(clientId, cacheStorage, cryptoObj, logger, performanceClient, serializableCache, persistencePlugin, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER) {
    this.clientId = clientId;
    this.cacheStorage = cacheStorage;
    this.cryptoObj = cryptoObj;
    this.tokenBindingKeyManager = tokenBindingKeyManager;
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.serializableCache = serializableCache;
    this.persistencePlugin = persistencePlugin;
  }
  /**
   * Function which validates server authorization token response.
   * @param serverResponse
   * @param correlationId
   * @param refreshAccessToken
   */
  validateTokenResponse(serverResponse, correlationId, refreshAccessToken) {
    if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
      const errString = `Error(s): ${serverResponse.error_codes || NOT_AVAILABLE} - Timestamp: ${serverResponse.timestamp || NOT_AVAILABLE} - Description: ${serverResponse.error_description || NOT_AVAILABLE} - Correlation ID: ${serverResponse.correlation_id || NOT_AVAILABLE} - Trace ID: ${serverResponse.trace_id || NOT_AVAILABLE}`;
      const serverErrorNo = serverResponse.error_codes?.length ? serverResponse.error_codes[0] : void 0;
      const serverError = new ServerError(serverResponse.error || "", serverResponse.correlation_id || "", errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_SERVER_ERROR_RANGE_START && serverResponse.status <= HTTP_SERVER_ERROR_RANGE_END) {
        this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.
${serverError}`, correlationId);
        return;
      } else if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_CLIENT_ERROR_RANGE_START && serverResponse.status <= HTTP_CLIENT_ERROR_RANGE_END) {
        this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.
${serverError}`, correlationId);
        return;
      }
      if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
        throw new InteractionRequiredAuthError(serverResponse.error || "", serverResponse.correlation_id || "", serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.claims || "", serverErrorNo);
      }
      throw serverError;
    }
  }
  /**
   * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
   * @param serverTokenResponse
   * @param authority
   */
  async handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, apiId, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId, additionalCacheKeyComponents) {
    let idTokenClaims;
    if (serverTokenResponse.id_token) {
      idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || "", this.cryptoObj.base64Decode, request.correlationId);
      if (authCodePayload && authCodePayload.nonce) {
        if (idTokenClaims.nonce !== authCodePayload.nonce) {
          throw createClientAuthError(nonceMismatch, request.correlationId);
        }
      }
    }
    this.homeAccountIdentifier = generateHomeAccountId(serverTokenResponse.client_info || "", authority.authorityType, this.logger, this.cryptoObj, request.correlationId, idTokenClaims);
    let requestStateObj;
    if (!!authCodePayload && !!authCodePayload.state) {
      requestStateObj = parseRequestState(this.cryptoObj.base64Decode, authCodePayload.state, request.correlationId);
    }
    serverTokenResponse.key_id = serverTokenResponse.key_id || request.dpopJkt || request.sshKid || void 0;
    if (request.authenticationScheme === AuthenticationScheme.DPOP) {
      if (serverTokenResponse.token_type?.toLowerCase() !== AuthenticationScheme.DPOP.toLowerCase()) {
        this.performanceClient?.addFields({
          dpopTokenTypeMismatch: serverTokenResponse.token_type
        }, request.correlationId);
        throw createClientAuthError(dpopTokenTypeMismatch, request.correlationId);
      }
      serverTokenResponse.token_type = AuthenticationScheme.DPOP;
    }
    const attributeTokenPartition = serializeAttributeTokens(request.attributeTokens);
    const cacheKeyComponents = additionalCacheKeyComponents ?? (attributeTokenPartition ? {
      attribute_tokens: attributeTokenPartition
    } : void 0);
    const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload, cacheKeyComponents);
    let cacheContext;
    try {
      if (this.persistencePlugin && this.serializableCache) {
        this.logger.verbose("Persistence enabled, calling beforeCacheAccess", request.correlationId);
        cacheContext = new TokenCacheContext(this.serializableCache, true);
        await this.persistencePlugin.beforeCacheAccess(cacheContext);
      }
      if (handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
        const cachedAccounts = this.cacheStorage.getAllAccounts({
          homeAccountId: cacheRecord.account.homeAccountId,
          environment: cacheRecord.account.environment
        }, request.correlationId);
        if (cachedAccounts.length < 1) {
          this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache", request.correlationId);
          this.performanceClient?.addFields({
            acntLoggedOut: true
          }, request.correlationId);
          return await _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, {
            idTokenClaims,
            requestState: requestStateObj,
            requestId: serverRequestId,
            tokenBindingKeyManager: this.tokenBindingKeyManager
          });
        }
      }
      await this.cacheStorage.saveCacheRecord(cacheRecord, request.correlationId, isKmsi(idTokenClaims || {}), apiId, request.storeInCache);
    } finally {
      if (this.persistencePlugin && this.serializableCache && cacheContext) {
        this.logger.verbose("Persistence enabled, calling afterCacheAccess", request.correlationId);
        await this.persistencePlugin.afterCacheAccess(cacheContext);
      }
    }
    return _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, {
      idTokenClaims,
      requestState: requestStateObj,
      serverTokenResponse,
      requestId: serverRequestId,
      tokenBindingKeyManager: this.tokenBindingKeyManager
    });
  }
  /**
   * Generates CacheRecord
   * @param serverTokenResponse
   * @param idTokenObj
   * @param authority
   */
  generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload, additionalCacheKeyComponents) {
    const env = authority.getPreferredCache();
    if (!env) {
      throw createClientAuthError(invalidCacheEnvironment, request.correlationId);
    }
    const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);
    let cachedIdToken;
    let cachedAccount;
    if (serverTokenResponse.id_token && !!idTokenClaims) {
      cachedIdToken = createIdTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.id_token, this.clientId, claimsTenantId || "");
      cachedAccount = buildAccountToCache(
        this.cacheStorage,
        authority,
        this.homeAccountIdentifier,
        this.cryptoObj.base64Decode,
        request.correlationId,
        idTokenClaims,
        serverTokenResponse.client_info,
        env,
        claimsTenantId,
        authCodePayload,
        void 0,
        // nativeAccountId
        this.logger,
        this.performanceClient
      );
    }
    let cachedAccessToken = null;
    if (serverTokenResponse.access_token) {
      const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope, request.correlationId) : new ScopeSet(request.scopes || [], request.correlationId);
      const expiresIn = (typeof serverTokenResponse.expires_in === "string" ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0;
      const extExpiresIn = (typeof serverTokenResponse.ext_expires_in === "string" ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0;
      const refreshIn = (typeof serverTokenResponse.refresh_in === "string" ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || void 0;
      const tokenExpirationSeconds = reqTimestamp + expiresIn;
      const extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
      const refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : void 0;
      cachedAccessToken = createAccessTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, request.correlationId, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id, additionalCacheKeyComponents);
      const resource = request.resource || null;
      if (resource) {
        cachedAccessToken.resource = resource;
      }
    }
    let cachedRefreshToken = null;
    if (serverTokenResponse.refresh_token) {
      let rtExpiresOn;
      if (serverTokenResponse.refresh_token_expires_in) {
        const rtExpiresIn = typeof serverTokenResponse.refresh_token_expires_in === "string" ? parseInt(serverTokenResponse.refresh_token_expires_in, 10) : serverTokenResponse.refresh_token_expires_in;
        rtExpiresOn = reqTimestamp + rtExpiresIn;
        this.performanceClient?.addFields({ ntwkRtExpiresOnSeconds: rtExpiresOn }, request.correlationId);
      }
      cachedRefreshToken = createRefreshTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token, this.clientId, serverTokenResponse.foci, userAssertionHash, rtExpiresOn);
    }
    let cachedAppMetadata = null;
    if (serverTokenResponse.foci) {
      cachedAppMetadata = {
        clientId: this.clientId,
        environment: env,
        familyId: serverTokenResponse.foci
      };
    }
    return {
      account: cachedAccount,
      idToken: cachedIdToken,
      accessToken: cachedAccessToken,
      refreshToken: cachedRefreshToken,
      appMetadata: cachedAppMetadata
    };
  }
  /**
   * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
   *
   * Optionally takes a state string that is set as-is in the response.
   *
   * @param cacheRecord
   * @param idTokenObj
   * @param fromTokenCache
   * @param stateString
   */
  static async generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, performanceClient, options = {}) {
    const { idTokenClaims, requestState, serverTokenResponse, requestId, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER } = options;
    let accessToken = "";
    let responseScopes = [];
    let expiresOn = null;
    let extExpiresOn;
    let refreshOn;
    let familyId = "";
    let dpopProof;
    if (cacheRecord.accessToken) {
      const accessTokenType = cacheRecord.accessToken.tokenType?.toLowerCase();
      if (cacheRecord.accessToken.tokenType === AuthenticationScheme.POP && !request.popKid) {
        const popTokenGenerator = new PopTokenGenerator(cryptoObj, tokenBindingKeyManager, performanceClient);
        const { secret, keyId } = cacheRecord.accessToken;
        if (!keyId) {
          throw createClientAuthError(keyIdMissing, request.correlationId);
        }
        accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
      } else {
        accessToken = cacheRecord.accessToken.secret;
      }
      if (accessTokenType === AuthenticationScheme.DPOP.toLowerCase()) {
        if (!cacheRecord.accessToken.keyId) {
          throw createClientAuthError(keyIdMissing, request.correlationId);
        }
        const dpopProofGenerator = new DpopProofGenerator(cryptoObj, tokenBindingKeyManager);
        dpopProof = await dpopProofGenerator.generateResourceProof({
          htu: request.resourceRequestUri,
          htm: request.resourceRequestMethod,
          accessToken: cacheRecord.accessToken.secret
        }, cacheRecord.accessToken.keyId, request.correlationId);
      }
      responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target, request.correlationId).asArray();
      expiresOn = toDateFromSeconds(cacheRecord.accessToken.expiresOn);
      extExpiresOn = toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn);
      if (cacheRecord.accessToken.refreshOn) {
        refreshOn = toDateFromSeconds(cacheRecord.accessToken.refreshOn);
      }
    }
    if (cacheRecord.appMetadata) {
      familyId = cacheRecord.appMetadata.familyId === THE_FAMILY_ID ? THE_FAMILY_ID : "";
    }
    const uid = idTokenClaims?.oid || idTokenClaims?.sub || "";
    const tid = idTokenClaims?.tid || "";
    const regionSubScope = idTokenClaims?.tenant_region_sub_scope;
    if (typeof regionSubScope === "string") {
      performanceClient?.addFields({ regionSubScope }, request.correlationId);
    }
    if (serverTokenResponse?.spa_accountid && !!cacheRecord.account) {
      cacheRecord.account.nativeAccountId = serverTokenResponse?.spa_accountid;
      const targetTenantId = tid || cacheRecord.account.realm;
      if (cacheRecord.account.tenantProfiles) {
        const matchingProfile = cacheRecord.account.tenantProfiles.find((tp) => tp.tenantId === targetTenantId);
        if (matchingProfile) {
          matchingProfile.nativeAccountId = serverTokenResponse.spa_accountid;
        }
      }
    }
    const accountInfo = cacheRecord.account ? updateAccountTenantProfileData(
      getAccountInfo(cacheRecord.account),
      void 0,
      // tenantProfile optional
      idTokenClaims,
      cacheRecord.idToken?.secret
    ) : null;
    return {
      authority: authority.canonicalAuthority,
      uniqueId: uid,
      tenantId: tid,
      scopes: responseScopes,
      account: accountInfo,
      idToken: cacheRecord?.idToken?.secret || "",
      idTokenClaims: idTokenClaims || {},
      accessToken,
      dpopProof,
      fromCache: fromTokenCache,
      expiresOn,
      extExpiresOn,
      refreshOn,
      correlationId: request.correlationId,
      requestId: requestId || "",
      familyId,
      tokenType: cacheRecord.accessToken?.tokenType?.toLowerCase() === AuthenticationScheme.DPOP.toLowerCase() ? AuthenticationScheme.DPOP : cacheRecord.accessToken?.tokenType || "",
      state: requestState ? requestState.userRequestState : "",
      cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || "",
      msGraphHost: cacheRecord.account?.msGraphHost || "",
      code: serverTokenResponse?.spa_code,
      fromPlatformBroker: false
    };
  }
};
function buildAccountToCache(cacheStorage, authority, homeAccountId, base64Decode, correlationId, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger, performanceClient) {
  logger?.verbose("setCachedAccount called", correlationId);
  const accountEnvironment = environment || authority.getPreferredCache();
  const matchedAccounts = cacheStorage.getAccountsFilteredBy({ homeAccountId, environment: accountEnvironment }, correlationId);
  performanceClient?.addFields({ cacheMatchedAccounts: matchedAccounts.length }, correlationId);
  if (matchedAccounts.length > 1) {
    logger?.warning("Multiple base accounts matched homeAccountId. Ignoring cached account and creating a new base account.", correlationId);
  }
  const cachedAccount = matchedAccounts.length === 1 ? matchedAccounts[0] : null;
  const baseAccount = cachedAccount || createAccountEntity({
    homeAccountId,
    idTokenClaims,
    clientInfo,
    environment,
    cloudGraphHostName: authCodePayload?.cloud_graph_host_name,
    msGraphHost: authCodePayload?.msgraph_host,
    nativeAccountId
  }, authority, correlationId, base64Decode);
  const tenantProfiles = baseAccount.tenantProfiles || [];
  const tenantId = claimsTenantId || baseAccount.realm;
  if (tenantId && !tenantProfiles.find((tenantProfile) => {
    return tenantProfile.tenantId === tenantId;
  })) {
    const newTenantProfile = buildTenantProfile(homeAccountId, baseAccount.localAccountId, tenantId, nativeAccountId, idTokenClaims);
    tenantProfiles.push(newTenantProfile);
  }
  baseAccount.tenantProfiles = tenantProfiles;
  return baseAccount;
}

// node_modules/@azure/msal-common/dist/account/CcsCredential.mjs
var CcsCredentialType = {
  HOME_ACCOUNT_ID: "home_account_id",
  UPN: "UPN"
};

// node_modules/@azure/msal-common/dist/utils/ClientAssertionUtils.mjs
async function getClientAssertion(clientAssertion, clientId, tokenEndpoint, fmiPath) {
  if (typeof clientAssertion === "string") {
    return clientAssertion;
  } else {
    const config = {
      clientId,
      tokenEndpoint,
      fmiPath
    };
    return clientAssertion(config);
  }
}

// node_modules/@azure/msal-common/dist/network/RequestThumbprint.mjs
function getRequestThumbprint(clientId, request, homeAccountId) {
  return {
    clientId,
    authority: request.authority,
    scopes: request.scopes,
    homeAccountIdentifier: homeAccountId,
    claims: request.claims,
    authenticationScheme: request.authenticationScheme,
    resourceRequestMethod: request.resourceRequestMethod,
    resourceRequestUri: request.resourceRequestUri,
    shrClaims: request.shrClaims,
    sshKid: request.sshKid,
    embeddedClientId: request.embeddedClientId || request.extraParameters?.clientId,
    resource: request.resource,
    attributeTokens: serializeAttributeTokens(request.attributeTokens)
  };
}

// node_modules/@azure/msal-common/dist/protocol/Token.mjs
var Token_exports = {};
__export(Token_exports, {
  addDpopTokenProofHeader: () => addDpopTokenProofHeader,
  createTokenQueryParameters: () => createTokenQueryParameters,
  createTokenRequestHeaders: () => createTokenRequestHeaders,
  executePostToTokenEndpoint: () => executePostToTokenEndpoint,
  sendPostRequest: () => sendPostRequest
});

// node_modules/@azure/msal-common/dist/network/ThrottlingUtils.mjs
var ThrottlingUtils = class _ThrottlingUtils {
  /**
   * Prepares a RequestThumbprint to be stored as a key.
   * @param thumbprint
   */
  static generateThrottlingStorageKey(thumbprint) {
    return `${THROTTLING_PREFIX}.${JSON.stringify(thumbprint)}`;
  }
  /**
   * Performs necessary throttling checks before a network request.
   * @param cacheManager
   * @param thumbprint
   */
  static preProcess(cacheManager, thumbprint, correlationId) {
    const key = _ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
    const value = cacheManager.getThrottlingCache(key, correlationId);
    if (value) {
      if (value.throttleTime < Date.now()) {
        cacheManager.removeItem(key, correlationId);
        return;
      }
      throw new ServerError(value.errorCodes?.join(" ") || "", correlationId, value.errorMessage, value.subError);
    }
  }
  /**
   * Performs necessary throttling checks after a network request.
   * @param cacheManager
   * @param thumbprint
   * @param response
   */
  static postProcess(cacheManager, thumbprint, response, correlationId) {
    if (_ThrottlingUtils.checkResponseStatus(response) || _ThrottlingUtils.checkResponseForRetryAfter(response)) {
      const thumbprintValue = {
        throttleTime: _ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames.RETRY_AFTER])),
        error: response.body.error,
        errorCodes: response.body.error_codes,
        errorMessage: response.body.error_description,
        subError: response.body.suberror
      };
      cacheManager.setThrottlingCache(_ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue, correlationId);
    }
  }
  /**
   * Checks a NetworkResponse object's status codes against 429 or 5xx
   * @param response
   */
  static checkResponseStatus(response) {
    return response.status === 429 || response.status >= 500 && response.status < 600;
  }
  /**
   * Checks a NetworkResponse object's RetryAfter header
   * @param response
   */
  static checkResponseForRetryAfter(response) {
    if (response.headers) {
      return response.headers.hasOwnProperty(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300);
    }
    return false;
  }
  /**
   * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
   * @param throttleTime
   */
  static calculateThrottleTime(throttleTime) {
    const time = throttleTime <= 0 ? 0 : throttleTime;
    const currentSeconds = Date.now() / 1e3;
    return Math.floor(Math.min(currentSeconds + (time || DEFAULT_THROTTLE_TIME_SECONDS), currentSeconds + DEFAULT_MAX_THROTTLE_TIME_SECONDS) * 1e3);
  }
  static removeThrottle(cacheManager, clientId, request, homeAccountIdentifier) {
    const thumbprint = getRequestThumbprint(clientId, request, homeAccountIdentifier);
    const key = this.generateThrottlingStorageKey(thumbprint);
    cacheManager.removeItem(key, request.correlationId);
  }
};

// node_modules/@azure/msal-common/dist/error/NetworkError.mjs
var NetworkError = class _NetworkError extends AuthError {
  constructor(error, httpStatus, responseHeaders) {
    super(error.errorCode, error.correlationId, error.errorMessage, error.subError);
    Object.setPrototypeOf(this, _NetworkError.prototype);
    this.name = "NetworkError";
    this.error = error;
    this.httpStatus = httpStatus;
    this.responseHeaders = responseHeaders;
  }
};
function createNetworkError(error, httpStatus, responseHeaders, additionalError) {
  error.errorMessage = `${error.errorMessage}, additionalErrorInfo: error.name:${additionalError?.name}, error.message:${additionalError?.message}`;
  return new NetworkError(error, httpStatus, responseHeaders);
}

// node_modules/@azure/msal-common/dist/protocol/Token.mjs
function createTokenRequestHeaders(logger, preventCorsPreflight, ccsCred) {
  const headers = {};
  headers[HeaderNames.CONTENT_TYPE] = URL_FORM_CONTENT_TYPE;
  if (!preventCorsPreflight && ccsCred) {
    switch (ccsCred.type) {
      case CcsCredentialType.HOME_ACCOUNT_ID:
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
          headers[HeaderNames.CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
        } catch (e) {
          logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, "");
        }
        break;
      case CcsCredentialType.UPN:
        headers[HeaderNames.CCS_HEADER] = `UPN: ${ccsCred.credential}`;
        break;
    }
  }
  return headers;
}
async function addDpopTokenProofHeader(headers, request, tokenEndpoint, cryptoUtils, tokenBindingKeyManager) {
  if (request.authenticationScheme !== AuthenticationScheme.DPOP) {
    return;
  }
  const dpopProofGenerator = new DpopProofGenerator(cryptoUtils, tokenBindingKeyManager);
  const keyId = request.dpopJkt;
  if (!keyId?.trim()) {
    throw createClientAuthError(keyIdMissing, request.correlationId);
  }
  headers[HeaderNames.DPOP] = await dpopProofGenerator.generateTokenProof({
    tokenEndpoint
  }, keyId, request.correlationId);
}
function createTokenQueryParameters(request, clientId, redirectUri, performanceClient) {
  const parameters = /* @__PURE__ */ new Map();
  if (request.embeddedClientId) {
    addBrokerParameters(parameters, clientId, redirectUri);
  }
  if (request.extraQueryParameters) {
    addExtraParameters(parameters, request.extraQueryParameters);
  }
  addCorrelationId(parameters, request.correlationId);
  instrumentBrokerParams(parameters, request.correlationId, performanceClient);
  return mapToQueryString(parameters);
}
async function executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, cacheManager, networkClient, logger, performanceClient, serverTelemetryManager) {
  const response = await sendPostRequest(thumbprint, tokenEndpoint, { body: queryString, headers }, correlationId, cacheManager, networkClient, logger, performanceClient);
  if (serverTelemetryManager && response.status < 500 && response.status !== 429) {
    serverTelemetryManager.clearTelemetryCache();
  }
  return response;
}
async function sendPostRequest(thumbprint, tokenEndpoint, options, correlationId, cacheManager, networkClient, logger, performanceClient) {
  ThrottlingUtils.preProcess(cacheManager, thumbprint, correlationId);
  let response;
  try {
    response = await invokeAsync(networkClient.sendPostRequestAsync.bind(networkClient), NetworkClientSendPostRequestAsync, logger, performanceClient, correlationId)(tokenEndpoint, { ...options, correlationId, performanceClient });
    const responseHeaders = response.headers || {};
    performanceClient?.addFields({
      refreshTokenSize: response.body.refresh_token?.length || 0,
      httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
      requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] || ""
    }, correlationId);
  } catch (e) {
    if (e instanceof NetworkError) {
      const responseHeaders = e.responseHeaders;
      if (responseHeaders) {
        performanceClient?.addFields({
          httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
          requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] || "",
          contentTypeHeader: responseHeaders[HeaderNames.CONTENT_TYPE] || void 0,
          contentLengthHeader: responseHeaders[HeaderNames.CONTENT_LENGTH] || void 0,
          httpStatus: e.httpStatus
        }, correlationId);
      }
      throw e.error;
    }
    if (e instanceof AuthError) {
      throw e;
    } else {
      throw createClientAuthError(networkError, correlationId);
    }
  }
  ThrottlingUtils.postProcess(cacheManager, thumbprint, response, correlationId);
  return response;
}

// node_modules/@azure/msal-common/dist/client/AuthorizationCodeClient.mjs
var AuthorizationCodeClient = class {
  constructor(configuration, performanceClient) {
    this.includeRedirectUri = true;
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
    this.oidcDefaultScopes = this.config.authOptions.authority.options.OIDCOptions?.defaultScopes;
  }
  /**
   * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
   * authorization_code_grant
   * @param request
   */
  async acquireToken(request, apiId, authCodePayload) {
    if (!request.code) {
      throw createClientAuthError(requestCannotBeMade, request.correlationId);
    }
    if (authCodePayload && authCodePayload.cloud_instance_host_name) {
      await invokeAsync(this.updateTokenEndpointAuthority.bind(this), UpdateTokenEndpointAuthority, this.logger, this.performanceClient, request.correlationId)(authCodePayload.cloud_instance_host_name, request.correlationId);
    }
    const reqTimestamp = nowSeconds();
    const response = await invokeAsync(this.executeTokenRequest.bind(this), AuthClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(this.authority, request, this.serverTelemetryManager);
    const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin, this.config.tokenBindingKeyManager);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, authCodePayload, void 0, void 0, void 0, requestId);
  }
  /**
   * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   * @param authorityUri
   */
  getLogoutUri(logoutRequest) {
    if (!logoutRequest) {
      throw createClientConfigurationError(logoutRequestEmpty, "");
    }
    const queryString = this.createLogoutUrlQueryString(logoutRequest);
    return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
  }
  /**
   * Executes POST request to token endpoint
   * @param authority
   * @param request
   */
  async executeTokenRequest(authority, request, serverTelemetryManager) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
    const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
    const requestBody2 = await invokeAsync(this.createTokenRequestBody.bind(this), AuthClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
    let ccsCredential = void 0;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCredential = {
          credential: `${clientInfo.uid}${CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType.HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose(`Could not parse client info for CCS Header: '${e}'`, request.correlationId);
      }
    }
    const headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, ccsCredential || request.ccsCredential);
    await addDpopTokenProofHeader(headers, request, endpoint, this.cryptoUtils, this.config.tokenBindingKeyManager);
    const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, AuthorizationCodeClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody2, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, serverTelemetryManager);
  }
  /**
   * Generates a map for all the params to be sent to the service
   * @param request
   */
  async createTokenRequestBody(request) {
    const parameters = /* @__PURE__ */ new Map();
    addClientId(parameters, request.embeddedClientId || request.extraParameters?.[CLIENT_ID] || this.config.authOptions.clientId);
    if (!this.includeRedirectUri) {
      if (!request.redirectUri) {
        throw createClientConfigurationError(redirectUriEmpty, request.correlationId);
      }
    } else {
      addRedirectUri(parameters, request.redirectUri);
    }
    addScopes(parameters, request.scopes, request.correlationId, true, this.oidcDefaultScopes);
    addResource(parameters, request.resource);
    if (request.attributeTokens) {
      addAttributeTokens(parameters, request.attributeTokens);
    }
    this.performanceClient?.addFields({
      hasAttributeTokens: !!request.attributeTokens?.length
    }, request.correlationId);
    addAuthorizationCode(parameters, request.code);
    addLibraryInfo(parameters, this.config.libraryInfo);
    addApplicationTelemetry(parameters, this.config.telemetry.application);
    addThrottling(parameters);
    if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
      addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    if (request.codeVerifier) {
      addCodeVerifier(parameters, request.codeVerifier);
    }
    if (this.config.clientCredentials.clientSecret) {
      addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    }
    if (this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    addGrantType(parameters, GrantType.AUTHORIZATION_CODE_GRANT);
    addClientInfo(parameters);
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.config.tokenBindingKeyManager, this.performanceClient);
      let reqCnfData;
      if (!request.popKid) {
        const generatedReqCnfData = await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger);
        reqCnfData = generatedReqCnfData.reqCnfString;
      } else {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (request.sshJwk) {
        addSshJwk(parameters, request.sshJwk);
      } else {
        throw createClientConfigurationError(missingSshJwk, request.correlationId);
      }
    }
    let ccsCred = void 0;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCred = {
          credential: `${clientInfo.uid}${CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType.HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose(`Could not parse client info for CCS Header: '${e}'`, request.correlationId);
      }
    } else {
      ccsCred = request.ccsCredential;
    }
    if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
      switch (ccsCred.type) {
        case CcsCredentialType.HOME_ACCOUNT_ID:
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
            addCcsOid(parameters, clientInfo);
          } catch (e) {
            this.logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, request.correlationId);
          }
          break;
        case CcsCredentialType.UPN:
          addCcsUpn(parameters, ccsCred.credential);
          break;
      }
    }
    if (request.embeddedClientId) {
      addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
    }
    if (request.extraParameters) {
      addExtraParameters(parameters, request.extraParameters);
    }
    if (request.enableSpaAuthorizationCode && (!request.extraParameters || !request.extraParameters[RETURN_SPA_CODE])) {
      addExtraParameters(parameters, {
        [RETURN_SPA_CODE]: "1"
      });
    }
    instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
    addClaims(parameters, request.correlationId, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims);
    return mapToQueryString(parameters);
  }
  /**
   * This API validates the `EndSessionRequest` and creates a URL
   * @param request
   */
  createLogoutUrlQueryString(request) {
    const parameters = /* @__PURE__ */ new Map();
    if (request.postLogoutRedirectUri) {
      addPostLogoutRedirectUri(parameters, request.postLogoutRedirectUri);
    }
    if (request.correlationId) {
      addCorrelationId(parameters, request.correlationId);
    }
    if (request.idTokenHint) {
      addIdTokenHint(parameters, request.idTokenHint);
    }
    if (request.state) {
      addState(parameters, request.state);
    }
    if (request.logoutHint) {
      addLogoutHint(parameters, request.logoutHint);
    }
    if (request.extraQueryParameters) {
      addExtraParameters(parameters, request.extraQueryParameters);
    }
    if (this.config.authOptions.instanceAware) {
      addInstanceAware(parameters);
    }
    return mapToQueryString(parameters);
  }
  /**
   * Updates the authority to the cloud instance provided in the authorization response
   * @param cloudInstanceHostName - cloud instance host name from authorization code payload
   * @param correlationId - request correlation id
   */
  async updateTokenEndpointAuthority(cloudInstanceHostName, correlationId) {
    const cloudInstanceAuthorityUri = `https://${cloudInstanceHostName}/${this.authority.tenant}/`;
    const cloudInstanceAuthority = await createDiscoveredInstance(cloudInstanceAuthorityUri, this.networkClient, this.cacheManager, this.authority.options, this.logger, correlationId, this.performanceClient);
    this.authority = cloudInstanceAuthority;
  }
};

// node_modules/@azure/msal-common/dist/protocol/Authorize.mjs
var Authorize_exports = {};
__export(Authorize_exports, {
  getAuthorizationCodePayload: () => getAuthorizationCodePayload,
  getAuthorizeUrl: () => getAuthorizeUrl,
  getStandardAuthorizeRequestParameters: () => getStandardAuthorizeRequestParameters,
  validateAuthorizationResponse: () => validateAuthorizationResponse
});
function getStandardAuthorizeRequestParameters(authOptions, request, logger, performanceClient) {
  const correlationId = request.correlationId;
  const parameters = /* @__PURE__ */ new Map();
  addClientId(parameters, request.embeddedClientId || request.extraQueryParameters?.[CLIENT_ID] || authOptions.clientId);
  const requestScopes = [
    ...request.scopes || [],
    ...request.extraScopesToConsent || []
  ];
  addScopes(parameters, requestScopes, request.correlationId, true, authOptions.authority.options.OIDCOptions?.defaultScopes);
  addResource(parameters, request.resource);
  addRedirectUri(parameters, request.redirectUri);
  addCorrelationId(parameters, correlationId);
  addResponseMode(parameters, request.responseMode);
  addClientInfo(parameters);
  addCliData(parameters);
  if (request.prompt) {
    addPrompt(parameters, request.prompt);
    performanceClient?.addFields({ prompt: request.prompt }, correlationId);
  }
  if (request.domainHint) {
    addDomainHint(parameters, request.domainHint);
    performanceClient?.addFields({ domainHintFromRequest: true }, correlationId);
  }
  if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
    if (request.sid && request.prompt === PromptValue.NONE) {
      logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request", request.correlationId);
      addSid(parameters, request.sid);
      performanceClient?.addFields({ sidFromRequest: true }, correlationId);
    } else if (request.account) {
      const accountSid = extractAccountSid(request.account);
      let accountLoginHintClaim = extractLoginHint(request.account);
      if (accountLoginHintClaim && request.domainHint) {
        logger.warning(`AuthorizationCodeClient.createAuthCodeUrlQueryString: "domainHint" param is set, skipping opaque "login_hint" claim. Please consider not passing domainHint`, request.correlationId);
        accountLoginHintClaim = null;
      }
      if (accountLoginHintClaim) {
        logger.verbose("createAuthCodeUrlQueryString: login_hint claim present on account", request.correlationId);
        addLoginHint(parameters, accountLoginHintClaim);
        performanceClient?.addFields({ loginHintFromClaim: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      } else if (accountSid && request.prompt === PromptValue.NONE) {
        logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account", request.correlationId);
        addSid(parameters, accountSid);
        performanceClient?.addFields({ sidFromClaim: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      } else if (request.loginHint) {
        logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request", request.correlationId);
        addLoginHint(parameters, request.loginHint);
        addCcsUpn(parameters, request.loginHint);
        performanceClient?.addFields({ loginHintFromRequest: true }, correlationId);
      } else if (request.account.username) {
        logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account", request.correlationId);
        addLoginHint(parameters, request.account.username);
        performanceClient?.addFields({ loginHintFromUpn: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      }
    } else if (request.loginHint) {
      logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request", request.correlationId);
      addLoginHint(parameters, request.loginHint);
      addCcsUpn(parameters, request.loginHint);
      performanceClient?.addFields({ loginHintFromRequest: true }, correlationId);
    }
  } else {
    logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints", request.correlationId);
  }
  if (request.nonce) {
    addNonce(parameters, request.nonce);
  }
  if (request.state) {
    addState(parameters, request.state);
  }
  if (request.embeddedClientId) {
    addBrokerParameters(parameters, authOptions.clientId, authOptions.redirectUri);
  }
  addClaims(parameters, request.correlationId, request.claims, authOptions.clientCapabilities, request.skipBrokerClaims);
  if (authOptions.instanceAware && (!request.extraQueryParameters || !Object.keys(request.extraQueryParameters).includes(INSTANCE_AWARE))) {
    addInstanceAware(parameters);
  }
  return parameters;
}
function getAuthorizeUrl(authority, requestParameters) {
  const queryString = mapToQueryString(requestParameters);
  return UrlString.appendQueryString(authority.authorizationEndpoint, queryString);
}
function getAuthorizationCodePayload(serverParams, cachedState, correlationId) {
  validateAuthorizationResponse(serverParams, cachedState, correlationId);
  if (!serverParams.code) {
    throw createClientAuthError(authorizationCodeMissingFromServerResponse, correlationId);
  }
  return serverParams;
}
function validateAuthorizationResponse(serverResponse, requestState, correlationId) {
  if (!serverResponse.state || !requestState) {
    throw serverResponse.state ? createClientAuthError(stateNotFound, correlationId, "Cached State") : createClientAuthError(stateNotFound, correlationId, "Server State");
  }
  let decodedServerResponseState;
  let decodedRequestState;
  try {
    decodedServerResponseState = decodeURIComponent(serverResponse.state);
  } catch (e) {
    throw createClientAuthError(invalidState, correlationId, serverResponse.state);
  }
  try {
    decodedRequestState = decodeURIComponent(requestState);
  } catch (e) {
    throw createClientAuthError(invalidState, correlationId, serverResponse.state);
  }
  if (decodedServerResponseState !== decodedRequestState) {
    throw createClientAuthError(stateMismatch, correlationId);
  }
  if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
    const serverErrorNo = parseServerErrorNo(serverResponse);
    if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
      throw new InteractionRequiredAuthError(serverResponse.error || "", serverResponse.correlation_id || correlationId, serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.claims || "", serverErrorNo);
    }
    throw new ServerError(serverResponse.error || "", serverResponse.correlation_id || correlationId, serverResponse.error_description, serverResponse.suberror, serverErrorNo);
  }
}
function parseServerErrorNo(serverResponse) {
  const errorCodePrefix = "code=";
  const errorCodePrefixIndex = serverResponse.error_uri?.lastIndexOf(errorCodePrefix);
  return errorCodePrefixIndex && errorCodePrefixIndex >= 0 ? serverResponse.error_uri?.substring(errorCodePrefixIndex + errorCodePrefix.length) : void 0;
}
function extractAccountSid(account) {
  return account.idTokenClaims?.sid || null;
}
function extractLoginHint(account) {
  return account.loginHint || account.idTokenClaims?.login_hint || null;
}

// node_modules/@azure/msal-common/dist/client/RefreshTokenClient.mjs
var DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS = 300;
var RefreshTokenClient = class {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
  }
  async acquireToken(request, apiId) {
    const reqTimestamp = nowSeconds();
    const response = await invokeAsync(this.executeTokenRequest.bind(this), RefreshTokenClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(request, this.authority);
    const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin, this.config.tokenBindingKeyManager);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, void 0, void 0, true, request.forceCache, requestId);
  }
  /**
   * Gets cached refresh token and attaches to request, then calls acquireToken API
   * @param request
   */
  async acquireTokenByRefreshToken(request, apiId) {
    if (!request) {
      throw createClientConfigurationError(tokenRequestEmpty, "");
    }
    if (!request.account) {
      throw createClientAuthError(noAccountInSilentRequest, request.correlationId);
    }
    const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment, request.correlationId);
    if (isFOCI) {
      try {
        return await invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, true, apiId);
      } catch (e) {
        const noFamilyRTInCache = e instanceof InteractionRequiredAuthError && e.errorCode === noTokensFound;
        const clientMismatchErrorWithFamilyRT = e instanceof ServerError && e.errorCode === INVALID_GRANT_ERROR && e.subError === CLIENT_MISMATCH_ERROR;
        if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
          return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false, apiId);
        } else {
          throw e;
        }
      }
    }
    return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false, apiId);
  }
  /**
   * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
   * @param request
   */
  async acquireTokenWithCachedRefreshToken(request, foci, apiId) {
    const refreshToken = invoke(this.cacheManager.getRefreshToken.bind(this.cacheManager), CacheManagerGetRefreshToken, this.logger, this.performanceClient, request.correlationId)(request.account, foci, request.correlationId, void 0);
    if (!refreshToken) {
      throw createInteractionRequiredAuthError(noTokensFound, request.correlationId);
    }
    if (refreshToken.expiresOn) {
      const offset = request.refreshTokenExpirationOffsetSeconds || DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS;
      this.performanceClient?.addFields({
        cacheRtExpiresOnSeconds: Number(refreshToken.expiresOn),
        rtOffsetSeconds: offset
      }, request.correlationId);
      if (isTokenExpired(refreshToken.expiresOn, offset)) {
        throw createInteractionRequiredAuthError(refreshTokenExpired, request.correlationId);
      }
    }
    const refreshTokenRequest = {
      ...request,
      refreshToken: refreshToken.secret,
      authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER,
      ccsCredential: {
        credential: request.account.homeAccountId,
        type: CcsCredentialType.HOME_ACCOUNT_ID
      }
    };
    if (refreshTokenRequest.authenticationScheme === AuthenticationScheme.DPOP && !refreshTokenRequest.dpopJkt) {
      const dpopProofGenerator = new DpopProofGenerator(this.cryptoUtils, this.config.tokenBindingKeyManager);
      refreshTokenRequest.dpopJkt = await dpopProofGenerator.generateJkt(request.correlationId);
    }
    try {
      return await invokeAsync(this.acquireToken.bind(this), RefreshTokenClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(refreshTokenRequest, apiId);
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        if (e.subError === badToken) {
          this.logger.verbose("acquireTokenWithRefreshToken: bad refresh token, removing from cache", request.correlationId);
          const badRefreshTokenKey = this.cacheManager.generateCredentialKey(refreshToken);
          this.cacheManager.removeRefreshToken(badRefreshTokenKey, request.correlationId);
        }
      }
      throw e;
    }
  }
  /**
   * Constructs the network message and makes a NW call to the underlying secure token service
   * @param request
   * @param authority
   */
  async executeTokenRequest(request, authority) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
    const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
    const requestBody2 = await invokeAsync(this.createTokenRequestBody.bind(this), RefreshTokenClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
    const headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, request.ccsCredential);
    await addDpopTokenProofHeader(headers, request, endpoint, this.cryptoUtils, this.config.tokenBindingKeyManager);
    const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, RefreshTokenClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody2, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, this.serverTelemetryManager);
  }
  /**
   * Helper function to create the token request body
   * @param request
   */
  async createTokenRequestBody(request) {
    const parameters = /* @__PURE__ */ new Map();
    addClientId(parameters, request.embeddedClientId || request.extraParameters?.[CLIENT_ID] || this.config.authOptions.clientId);
    if (request.redirectUri) {
      addRedirectUri(parameters, request.redirectUri);
    }
    addScopes(parameters, request.scopes, request.correlationId, true, this.config.authOptions.authority.options.OIDCOptions?.defaultScopes);
    addGrantType(parameters, GrantType.REFRESH_TOKEN_GRANT);
    addClientInfo(parameters);
    addLibraryInfo(parameters, this.config.libraryInfo);
    addApplicationTelemetry(parameters, this.config.telemetry.application);
    addThrottling(parameters);
    if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
      addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    addRefreshToken(parameters, request.refreshToken);
    if (request.attributeTokens) {
      addAttributeTokens(parameters, request.attributeTokens);
    }
    this.performanceClient?.addFields({
      hasAttributeTokens: !!request.attributeTokens?.length
    }, request.correlationId);
    if (this.config.clientCredentials.clientSecret) {
      addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    }
    if (this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.config.tokenBindingKeyManager, this.performanceClient);
      let reqCnfData;
      if (!request.popKid) {
        const generatedReqCnfData = await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger);
        reqCnfData = generatedReqCnfData.reqCnfString;
      } else {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (request.sshJwk) {
        addSshJwk(parameters, request.sshJwk);
      } else {
        throw createClientConfigurationError(missingSshJwk, request.correlationId);
      }
    }
    if (this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
      switch (request.ccsCredential.type) {
        case CcsCredentialType.HOME_ACCOUNT_ID:
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
            addCcsOid(parameters, clientInfo);
          } catch (e) {
            this.logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, request.correlationId);
          }
          break;
        case CcsCredentialType.UPN:
          addCcsUpn(parameters, request.ccsCredential.credential);
          break;
      }
    }
    if (request.embeddedClientId) {
      addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
    }
    if (request.extraParameters) {
      addExtraParameters(parameters, {
        ...request.extraParameters
      });
    }
    instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
    addClaims(parameters, request.correlationId, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims);
    return mapToQueryString(parameters);
  }
};

// node_modules/@azure/msal-common/dist/telemetry/server/ServerTelemetryManager.mjs
var skuGroupSeparator = ",";
var skuValueSeparator = "|";
function makeExtraSkuString(params) {
  const { skus, libraryName, libraryVersion, extensionName, extensionVersion } = params;
  const skuMap = /* @__PURE__ */ new Map([
    [0, [libraryName, libraryVersion]],
    [2, [extensionName, extensionVersion]]
  ]);
  let skuArr = [];
  if (skus?.length) {
    skuArr = skus.split(skuGroupSeparator);
    if (skuArr.length < 4) {
      return skus;
    }
  } else {
    skuArr = Array.from({ length: 4 }, () => skuValueSeparator);
  }
  skuMap.forEach((value, key) => {
    if (value.length === 2 && value[0]?.length && value[1]?.length) {
      setSku({
        skuArr,
        index: key,
        skuName: value[0],
        skuVersion: value[1]
      });
    }
  });
  return skuArr.join(skuGroupSeparator);
}
function setSku(params) {
  const { skuArr, index, skuName, skuVersion } = params;
  if (index >= skuArr.length) {
    return;
  }
  skuArr[index] = [skuName, skuVersion].join(skuValueSeparator);
}
var ServerTelemetryManager = class _ServerTelemetryManager {
  constructor(telemetryRequest, cacheManager) {
    this.cacheOutcome = CacheOutcome.NOT_APPLICABLE;
    this.cacheManager = cacheManager;
    this.apiId = telemetryRequest.apiId;
    this.correlationId = telemetryRequest.correlationId;
    this.wrapperSKU = telemetryRequest.wrapperSKU || "";
    this.wrapperVer = telemetryRequest.wrapperVer || "";
    this.telemetryCacheKey = SERVER_TELEM_CACHE_KEY + CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
  }
  /**
   * API to add MSER Telemetry to request
   */
  generateCurrentRequestHeaderValue() {
    const request = `${this.apiId}${SERVER_TELEM_VALUE_SEPARATOR}${this.cacheOutcome}`;
    const platformFieldsArr = [this.wrapperSKU, this.wrapperVer];
    const nativeBrokerErrorCode = this.getNativeBrokerErrorCode();
    if (nativeBrokerErrorCode?.length) {
      platformFieldsArr.push(`broker_error=${nativeBrokerErrorCode}`);
    }
    const platformFields = platformFieldsArr.join(SERVER_TELEM_VALUE_SEPARATOR);
    const regionDiscoveryFields = this.getRegionDiscoveryFields();
    const requestWithRegionDiscoveryFields = [
      request,
      regionDiscoveryFields
    ].join(SERVER_TELEM_VALUE_SEPARATOR);
    return [
      SERVER_TELEM_SCHEMA_VERSION,
      requestWithRegionDiscoveryFields,
      platformFields
    ].join(SERVER_TELEM_CATEGORY_SEPARATOR);
  }
  /**
   * API to add MSER Telemetry for the last failed request
   */
  generateLastRequestHeaderValue() {
    const lastRequests = this.getLastRequests();
    const maxErrors = _ServerTelemetryManager.maxErrorsToSend(lastRequests);
    const failedRequests = lastRequests.failedRequests.slice(0, 2 * maxErrors).join(SERVER_TELEM_VALUE_SEPARATOR);
    const errors = lastRequests.errors.slice(0, maxErrors).join(SERVER_TELEM_VALUE_SEPARATOR);
    const errorCount = lastRequests.errors.length;
    const overflow = maxErrors < errorCount ? SERVER_TELEM_OVERFLOW_TRUE : SERVER_TELEM_OVERFLOW_FALSE;
    const platformFields = [errorCount, overflow].join(SERVER_TELEM_VALUE_SEPARATOR);
    return [
      SERVER_TELEM_SCHEMA_VERSION,
      lastRequests.cacheHits,
      failedRequests,
      errors,
      platformFields
    ].join(SERVER_TELEM_CATEGORY_SEPARATOR);
  }
  /**
   * API to cache token failures for MSER data capture
   * @param error
   */
  cacheFailedRequest(error) {
    try {
      const lastRequests = this.getLastRequests();
      if (lastRequests.errors.length >= SERVER_TELEM_MAX_CACHED_ERRORS) {
        lastRequests.failedRequests.shift();
        lastRequests.failedRequests.shift();
        lastRequests.errors.shift();
      }
      lastRequests.failedRequests.push(this.apiId, this.correlationId);
      if (error instanceof Error && !!error && error.toString()) {
        if (error instanceof AuthError) {
          if (error.subError) {
            lastRequests.errors.push(error.subError);
          } else if (error.errorCode) {
            lastRequests.errors.push(error.errorCode);
          } else {
            lastRequests.errors.push(error.toString());
          }
        } else {
          lastRequests.errors.push(error.toString());
        }
      } else {
        lastRequests.errors.push(SERVER_TELEM_UNKNOWN_ERROR);
      }
      this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
    } catch {
    }
    return;
  }
  /**
   * Update server telemetry cache entry by incrementing cache hit counter
   */
  incrementCacheHits() {
    const lastRequests = this.getLastRequests();
    lastRequests.cacheHits += 1;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
    return lastRequests.cacheHits;
  }
  /**
   * Get the server telemetry entity from cache or initialize a new one
   */
  getLastRequests() {
    const initialValue = {
      failedRequests: [],
      errors: [],
      cacheHits: 0
    };
    const lastRequests = this.cacheManager.getServerTelemetry(this.telemetryCacheKey, this.correlationId);
    return lastRequests || initialValue;
  }
  /**
   * Remove server telemetry cache entry
   */
  clearTelemetryCache() {
    const lastRequests = this.getLastRequests();
    const numErrorsFlushed = _ServerTelemetryManager.maxErrorsToSend(lastRequests);
    const errorCount = lastRequests.errors.length;
    if (numErrorsFlushed === errorCount) {
      this.cacheManager.removeItem(this.telemetryCacheKey, this.correlationId);
    } else {
      const serverTelemEntity = {
        failedRequests: lastRequests.failedRequests.slice(numErrorsFlushed * 2),
        errors: lastRequests.errors.slice(numErrorsFlushed),
        cacheHits: 0
      };
      this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity, this.correlationId);
    }
  }
  /**
   * Returns the maximum number of errors that can be flushed to the server in the next network request
   * @param serverTelemetryEntity
   */
  static maxErrorsToSend(serverTelemetryEntity) {
    let i;
    let maxErrors = 0;
    let dataSize = 0;
    const errorCount = serverTelemetryEntity.errors.length;
    for (i = 0; i < errorCount; i++) {
      const apiId = serverTelemetryEntity.failedRequests[2 * i] || "";
      const correlationId = serverTelemetryEntity.failedRequests[2 * i + 1] || "";
      const errorCode = serverTelemetryEntity.errors[i] || "";
      dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3;
      if (dataSize < SERVER_TELEM_MAX_LAST_HEADER_BYTES) {
        maxErrors += 1;
      } else {
        break;
      }
    }
    return maxErrors;
  }
  /**
   * Get the region discovery fields
   *
   * @returns string
   */
  getRegionDiscoveryFields() {
    const regionDiscoveryFields = [];
    regionDiscoveryFields.push(this.regionUsed || "");
    regionDiscoveryFields.push(this.regionSource || "");
    regionDiscoveryFields.push(this.regionOutcome || "");
    return regionDiscoveryFields.join(",");
  }
  /**
   * Update the region discovery metadata
   *
   * @param regionDiscoveryMetadata
   * @returns void
   */
  updateRegionDiscoveryMetadata(regionDiscoveryMetadata) {
    this.regionUsed = regionDiscoveryMetadata.region_used;
    this.regionSource = regionDiscoveryMetadata.region_source;
    this.regionOutcome = regionDiscoveryMetadata.region_outcome;
  }
  /**
   * Set cache outcome
   */
  setCacheOutcome(cacheOutcome) {
    this.cacheOutcome = cacheOutcome;
  }
  setNativeBrokerErrorCode(errorCode) {
    const lastRequests = this.getLastRequests();
    lastRequests.nativeBrokerErrorCode = errorCode;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  getNativeBrokerErrorCode() {
    return this.getLastRequests().nativeBrokerErrorCode;
  }
  clearNativeBrokerErrorCode() {
    const lastRequests = this.getLastRequests();
    delete lastRequests.nativeBrokerErrorCode;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  static makeExtraSkuString(params) {
    return makeExtraSkuString(params);
  }
};

// node_modules/@azure/msal-common/dist/client/SilentFlowClient.mjs
var SilentFlowClient = class {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
  }
  /**
   * Retrieves token from cache or throws an error if it must be refreshed.
   * @param request
   */
  async acquireCachedToken(request) {
    let lastCacheOutcome = CacheOutcome.NOT_APPLICABLE;
    if (request.forceRefresh || !StringUtils.isEmptyObj(request.claims)) {
      this.setCacheOutcome(CacheOutcome.FORCE_REFRESH_OR_CLAIMS, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired, request.correlationId);
    }
    if (!request.account) {
      throw createClientAuthError(noAccountInSilentRequest, request.correlationId);
    }
    const requestTenantId = request.account.tenantId || getTenantFromAuthorityString(request.authority, request.correlationId);
    const tokenKeys = this.cacheManager.getTokenKeys();
    const cachedAccessToken = this.cacheManager.getAccessToken(request.account, request, tokenKeys, requestTenantId);
    if (!cachedAccessToken) {
      this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired, request.correlationId);
    } else if (wasClockTurnedBack(cachedAccessToken.cachedAt) || isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
      this.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired, request.correlationId);
    } else if (request.resource) {
      if (cachedAccessToken.resource !== request.resource) {
        this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
        throw createClientAuthError(tokenRefreshRequired, request.correlationId);
      }
    } else if (cachedAccessToken.refreshOn && isTokenExpired(cachedAccessToken.refreshOn, 0)) {
      lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
    }
    const cachedAccessTokenType = cachedAccessToken.tokenType?.toLowerCase();
    if (cachedAccessTokenType === AuthenticationScheme.DPOP.toLowerCase()) {
      if (!cachedAccessToken.keyId) {
        this.logger.info("SilentFlowClient:acquireCachedToken - Cached DPoP access token is missing keyId; refresh required", request.correlationId);
        this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
        throw createClientAuthError(tokenRefreshRequired, request.correlationId);
      }
      try {
        await this.config.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(cachedAccessToken.keyId, request.correlationId);
      } catch {
        this.logger.info("SilentFlowClient:acquireCachedToken - Local DPoP key was not found for cached access token; refresh required", request.correlationId);
        this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
        throw createClientAuthError(tokenRefreshRequired, request.correlationId);
      }
    }
    const environment = request.authority || this.authority.getPreferredCache();
    const cacheRecord = {
      account: this.cacheManager.getAccount(this.cacheManager.generateAccountKey(request.account), request.correlationId),
      accessToken: cachedAccessToken,
      idToken: this.cacheManager.getIdToken(request.account, request.correlationId, tokenKeys, requestTenantId),
      refreshToken: null,
      appMetadata: this.cacheManager.readAppMetadataFromCache(environment, request.correlationId)
    };
    this.setCacheOutcome(lastCacheOutcome, request.correlationId);
    if (this.config.serverTelemetryManager) {
      this.config.serverTelemetryManager.incrementCacheHits();
    }
    return [
      await invokeAsync(this.generateResultFromCacheRecord.bind(this), SilentFlowClientGenerateResultFromCacheRecord, this.logger, this.performanceClient, request.correlationId)(cacheRecord, request),
      lastCacheOutcome
    ];
  }
  setCacheOutcome(cacheOutcome, correlationId) {
    this.serverTelemetryManager?.setCacheOutcome(cacheOutcome);
    this.performanceClient?.addFields({
      cacheOutcome
    }, correlationId);
    if (cacheOutcome !== CacheOutcome.NOT_APPLICABLE) {
      this.logger.info(`Token refresh is required due to cache outcome: '${cacheOutcome}'`, correlationId);
    }
  }
  /**
   * Helper function to build response object from the CacheRecord
   * @param cacheRecord
   */
  async generateResultFromCacheRecord(cacheRecord, request) {
    let idTokenClaims;
    if (cacheRecord.idToken) {
      idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode, request.correlationId);
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, true, request, this.performanceClient, {
      idTokenClaims,
      tokenBindingKeyManager: this.config.tokenBindingKeyManager
    });
  }
};

// node_modules/@azure/msal-common/dist/request/BaseAuthRequest.mjs
function enforceResourceParameter(isMcp, request) {
  if (!isMcp) {
    return;
  }
  if (request.resource && (containsResourceParam(request.extraParameters) || containsResourceParam(request.extraQueryParameters))) {
    throw createClientAuthError(misplacedResourceParam, request.correlationId || "");
  }
  if (!request.resource) {
    throw createClientAuthError(resourceParameterRequired, request.correlationId || "");
  }
}
function containsResourceParam(params) {
  if (!params) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(params, "resource");
}

// node_modules/@azure/msal-node/dist/cache/serializer/Deserializer.mjs
var Deserializer = class {
  /**
   * Parse the JSON blob in memory and deserialize the content
   * @param cachedJson - JSON blob cache
   */
  static deserializeJSONBlob(jsonFile) {
    const deserializedCache = !jsonFile ? {} : JSON.parse(jsonFile);
    return deserializedCache;
  }
  /**
   * Deserializes accounts to AccountEntity objects
   * @param accounts - accounts of type SerializedAccountEntity
   */
  static deserializeAccounts(accounts) {
    const accountObjects = {};
    if (accounts) {
      Object.keys(accounts).map(function(key) {
        const serializedAcc = accounts[key];
        const mappedAcc = {
          homeAccountId: serializedAcc.home_account_id,
          environment: serializedAcc.environment,
          realm: serializedAcc.realm,
          localAccountId: serializedAcc.local_account_id,
          username: serializedAcc.username,
          authorityType: serializedAcc.authority_type,
          name: serializedAcc.name,
          clientInfo: serializedAcc.client_info,
          lastModificationTime: serializedAcc.last_modification_time,
          lastModificationApp: serializedAcc.last_modification_app,
          tenantProfiles: serializedAcc.tenantProfiles?.map((serializedTenantProfile) => {
            return JSON.parse(serializedTenantProfile);
          }),
          lastUpdatedAt: Date.now().toString()
        };
        const account = {};
        CacheManager.toObject(account, mappedAcc);
        accountObjects[key] = account;
      });
    }
    return accountObjects;
  }
  /**
   * Deserializes id tokens to IdTokenEntity objects
   * @param idTokens - credentials of type SerializedIdTokenEntity
   */
  static deserializeIdTokens(idTokens) {
    const idObjects = {};
    if (idTokens) {
      Object.keys(idTokens).map(function(key) {
        const serializedIdT = idTokens[key];
        const idToken = {
          homeAccountId: serializedIdT.home_account_id,
          environment: serializedIdT.environment,
          credentialType: serializedIdT.credential_type,
          clientId: serializedIdT.client_id,
          secret: serializedIdT.secret,
          realm: serializedIdT.realm,
          lastUpdatedAt: Date.now().toString()
        };
        idObjects[key] = idToken;
      });
    }
    return idObjects;
  }
  /**
   * Deserializes access tokens to AccessTokenEntity objects
   * @param accessTokens - access tokens of type SerializedAccessTokenEntity
   */
  static deserializeAccessTokens(accessTokens) {
    const atObjects = {};
    if (accessTokens) {
      Object.keys(accessTokens).map(function(key) {
        const serializedAT = accessTokens[key];
        const accessToken = {
          homeAccountId: serializedAT.home_account_id,
          environment: serializedAT.environment,
          credentialType: serializedAT.credential_type,
          clientId: serializedAT.client_id,
          secret: serializedAT.secret,
          realm: serializedAT.realm,
          target: serializedAT.target,
          cachedAt: serializedAT.cached_at,
          expiresOn: serializedAT.expires_on,
          extendedExpiresOn: serializedAT.extended_expires_on,
          refreshOn: serializedAT.refresh_on,
          keyId: serializedAT.key_id,
          tokenType: serializedAT.token_type,
          userAssertionHash: serializedAT.userAssertionHash,
          resource: serializedAT.resource,
          additionalCacheKeyComponents: serializedAT.additionalCacheKeyComponents,
          lastUpdatedAt: Date.now().toString()
        };
        atObjects[key] = accessToken;
      });
    }
    return atObjects;
  }
  /**
   * Deserializes refresh tokens to RefreshTokenEntity objects
   * @param refreshTokens - refresh tokens of type SerializedRefreshTokenEntity
   */
  static deserializeRefreshTokens(refreshTokens) {
    const rtObjects = {};
    if (refreshTokens) {
      Object.keys(refreshTokens).map(function(key) {
        const serializedRT = refreshTokens[key];
        const refreshToken = {
          homeAccountId: serializedRT.home_account_id,
          environment: serializedRT.environment,
          credentialType: serializedRT.credential_type,
          clientId: serializedRT.client_id,
          secret: serializedRT.secret,
          familyId: serializedRT.family_id,
          target: serializedRT.target,
          realm: serializedRT.realm,
          lastUpdatedAt: Date.now().toString()
        };
        rtObjects[key] = refreshToken;
      });
    }
    return rtObjects;
  }
  /**
   * Deserializes appMetadata to AppMetaData objects
   * @param appMetadata - app metadata of type SerializedAppMetadataEntity
   */
  static deserializeAppMetadata(appMetadata) {
    const appMetadataObjects = {};
    if (appMetadata) {
      Object.keys(appMetadata).map(function(key) {
        const serializedAmdt = appMetadata[key];
        appMetadataObjects[key] = {
          clientId: serializedAmdt.client_id,
          environment: serializedAmdt.environment,
          familyId: serializedAmdt.family_id
        };
      });
    }
    return appMetadataObjects;
  }
  /**
   * Deserialize an inMemory Cache
   * @param jsonCache - JSON blob cache
   */
  static deserializeAllCache(jsonCache) {
    return {
      accounts: jsonCache.Account ? this.deserializeAccounts(jsonCache.Account) : {},
      idTokens: jsonCache.IdToken ? this.deserializeIdTokens(jsonCache.IdToken) : {},
      accessTokens: jsonCache.AccessToken ? this.deserializeAccessTokens(jsonCache.AccessToken) : {},
      refreshTokens: jsonCache.RefreshToken ? this.deserializeRefreshTokens(jsonCache.RefreshToken) : {},
      appMetadata: jsonCache.AppMetadata ? this.deserializeAppMetadata(jsonCache.AppMetadata) : {}
    };
  }
};

// node_modules/@azure/msal-node/dist/utils/Constants.mjs
var MANAGED_IDENTITY_DEFAULT_TENANT = "managed_identity";
var DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY = `https://login.microsoftonline.com/${MANAGED_IDENTITY_DEFAULT_TENANT}/`;
var ManagedIdentityHeaders = {
  AUTHORIZATION_HEADER_NAME: "Authorization",
  METADATA_HEADER_NAME: "Metadata",
  APP_SERVICE_SECRET_HEADER_NAME: "X-IDENTITY-HEADER",
  ML_AND_SF_SECRET_HEADER_NAME: "secret",
  CLIENT_SKU: AADServerParamKeys_exports.X_CLIENT_SKU,
  CLIENT_VER: AADServerParamKeys_exports.X_CLIENT_VER,
  CLIENT_REQUEST_ID: "x-ms-client-request-id"
};
var ManagedIdentityQueryParameters = {
  API_VERSION: "api-version",
  RESOURCE: "resource",
  SHA256_TOKEN_TO_REFRESH: "token_sha256_to_refresh",
  XMS_CC: "xms_cc"
};
var ManagedIdentityEnvironmentVariableNames = {
  AZURE_POD_IDENTITY_AUTHORITY_HOST: "AZURE_POD_IDENTITY_AUTHORITY_HOST",
  DEFAULT_IDENTITY_CLIENT_ID: "DEFAULT_IDENTITY_CLIENT_ID",
  IDENTITY_ENDPOINT: "IDENTITY_ENDPOINT",
  IDENTITY_HEADER: "IDENTITY_HEADER",
  IDENTITY_SERVER_THUMBPRINT: "IDENTITY_SERVER_THUMBPRINT",
  IMDS_ENDPOINT: "IMDS_ENDPOINT",
  MSI_ENDPOINT: "MSI_ENDPOINT",
  MSI_SECRET: "MSI_SECRET"
};
var ManagedIdentitySourceNames = {
  APP_SERVICE: "AppService",
  AZURE_ARC: "AzureArc",
  CLOUD_SHELL: "CloudShell",
  DEFAULT_TO_IMDS: "DefaultToImds",
  IMDS: "Imds",
  MACHINE_LEARNING: "MachineLearning",
  SERVICE_FABRIC: "ServiceFabric"
};
var ManagedIdentityIdType = {
  SYSTEM_ASSIGNED: "system-assigned",
  USER_ASSIGNED_CLIENT_ID: "user-assigned-client-id",
  USER_ASSIGNED_RESOURCE_ID: "user-assigned-resource-id",
  USER_ASSIGNED_OBJECT_ID: "user-assigned-object-id"
};
var HttpMethod2 = {
  GET: "GET",
  POST: "POST"
};
var RANDOM_OCTET_SIZE = 32;
var Hash = {
  SHA256: "sha256"
};
var CharSet = {
  CV_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
};
var CACHE = {
  KEY_SEPARATOR: "-"
};
var Constants = {
  MSAL_SKU: "msal.js.node",
  JWT_BEARER_ASSERTION_TYPE: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  HTTP_PROTOCOL: "http://",
  LOCALHOST: "localhost"
};
var ApiId = {
  acquireTokenSilent: 62,
  acquireTokenByUsernamePassword: 371,
  acquireTokenByDeviceCode: 671,
  acquireTokenByClientCredential: 771,
  acquireTokenByOBO: 772,
  acquireTokenWithManagedIdentity: 773,
  acquireTokenByUserFederatedIdentityCredential: 774,
  acquireTokenByCode: 871,
  acquireTokenByRefreshToken: 872
};
var JwtConstants = {
  RSA_256: "RS256",
  PSS_256: "PS256",
  X5T_256: "x5t#S256",
  X5T: "x5t",
  X5C: "x5c",
  AUDIENCE: "aud",
  EXPIRATION_TIME: "exp",
  ISSUER: "iss",
  SUBJECT: "sub",
  NOT_BEFORE: "nbf",
  JWT_ID: "jti"
};
var LOOPBACK_SERVER_CONSTANTS = {
  INTERVAL_MS: 100,
  TIMEOUT_MS: 5e3
};

// node_modules/@azure/msal-node/dist/network/HttpClient.mjs
var HttpClient = class {
  /**
   * Sends an HTTP GET request to the specified URL.
   *
   * This method handles GET requests with optional timeout support. The timeout
   * is implemented using AbortController, which provides a clean way to cancel
   * fetch requests that take too long to complete.
   *
   * @param url - The target URL for the GET request
   * @param options - Optional request configuration including headers
   * @param timeout - Optional timeout in milliseconds. If specified, the request
   *                  will be aborted if it doesn't complete within this time
   * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
   * @throws {AuthError} When the request times out or response parsing fails
   * @throws {NetworkError} When the network request fails
   */
  async sendGetRequestAsync(url, options, timeout) {
    return this.sendRequest(url, HttpMethod2.GET, options, timeout);
  }
  /**
   * Sends an HTTP POST request to the specified URL.
   *
   * This method handles POST requests with request body support. Currently,
   * timeout functionality is not exposed for POST requests, but the underlying
   * implementation supports it through the shared sendRequest method.
   *
   * @param url - The target URL for the POST request
   * @param options - Optional request configuration including headers and body
   * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
   * @throws {AuthError} When the request times out or response parsing fails
   * @throws {NetworkError} When the network request fails
   */
  async sendPostRequestAsync(url, options) {
    return this.sendRequest(url, HttpMethod2.POST, options);
  }
  /**
   * Core HTTP request implementation using native fetch API.
   *
   * This method handles GET and POST HTTP requests with comprehensive
   * timeout support and error handling. The timeout mechanism works as follows:
   *
   * 1. An AbortController is created for each request
   * 2. If a timeout is specified, setTimeout is used to call abort() after the delay
   * 3. The abort signal is passed to fetch, which will reject the promise if aborted
   * 4. Cleanup occurs in both success and error cases to prevent timer leaks
   *
   * Error handling priority:
   * 1. Timeout errors (AbortError) are converted to "Request timeout" messages
   * 2. Network/connection errors are wrapped with "Network request failed" prefix
   * 3. JSON parsing errors are wrapped with "Failed to parse response" prefix
   *
   * @param url - The target URL for the request
   * @param method - HTTP method (GET or POST)
   * @param options - Optional request configuration (headers, body)
   * @param timeout - Optional timeout in milliseconds for request cancellation
   * @returns Promise resolving to NetworkResponse with parsed JSON body
   * @throws {AuthError} For timeouts or JSON parsing errors
   * @throws {NetworkError} For network failures
   */
  async sendRequest(url, method, options, timeout) {
    const controller = new AbortController();
    let timeoutId;
    if (timeout) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
    }
    const fetchOptions = {
      method,
      headers: getFetchHeaders(options),
      signal: controller.signal
      // Enable cancellation via AbortController
    };
    if (method === HttpMethod2.POST) {
      fetchOptions.body = options?.body || "";
    }
    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw createAuthError(ClientAuthErrorCodes_exports.networkError, "", "Request timeout");
      }
      const baseAuthError = createAuthError(ClientAuthErrorCodes_exports.networkError, "", `Network request failed: ${error instanceof Error ? error.message : "unknown"}`);
      throw createNetworkError(baseAuthError, void 0, void 0, error instanceof Error ? error : void 0);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    try {
      return {
        headers: getHeaderDict(response.headers),
        body: await response.json(),
        status: response.status
      };
    } catch (error) {
      throw createAuthError(ClientAuthErrorCodes_exports.tokenParsingError, "", `Failed to parse response: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
};
function getHeaderDict(headers) {
  const headerDict = {};
  headers.forEach((value, key) => {
    headerDict[key] = value;
  });
  return headerDict;
}
function getFetchHeaders(options) {
  const headers = new Headers();
  if (!(options && options.headers)) {
    return headers;
  }
  Object.entries(options.headers).forEach(([key, value]) => {
    headers.append(key, value);
  });
  return headers;
}

// node_modules/@azure/msal-node/dist/error/ManagedIdentityErrorCodes.mjs
var invalidFileExtension = "invalid_file_extension";
var invalidFilePath = "invalid_file_path";
var invalidManagedIdentityIdType = "invalid_managed_identity_id_type";
var invalidSecret = "invalid_secret";
var missingId = "missing_client_id";
var networkUnavailable = "network_unavailable";
var platformNotSupported = "platform_not_supported";
var unableToCreateAzureArc = "unable_to_create_azure_arc";
var unableToCreateCloudShell = "unable_to_create_cloud_shell";
var unableToCreateSource = "unable_to_create_source";
var unableToReadSecretFile = "unable_to_read_secret_file";
var userAssignedNotAvailableAtRuntime = "user_assigned_not_available_at_runtime";
var userAssignedManagedIdentityNotConfirmed = "user_assigned_managed_identity_not_confirmed";
var wwwAuthenticateHeaderMissing = "www_authenticate_header_missing";
var wwwAuthenticateHeaderUnsupportedFormat = "www_authenticate_header_unsupported_format";
var MsiEnvironmentVariableUrlMalformedErrorCodes = {
  [ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST]: "azure_pod_identity_authority_host_url_malformed",
  [ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT]: "identity_endpoint_url_malformed",
  [ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT]: "imds_endpoint_url_malformed",
  [ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT]: "msi_endpoint_url_malformed"
};

// node_modules/@azure/msal-node/dist/error/ManagedIdentityError.mjs
var ManagedIdentityErrorMessages = {
  [invalidFileExtension]: "The file path in the WWW-Authenticate header does not contain a .key file.",
  [invalidFilePath]: "The file path in the WWW-Authenticate header is not in a valid Windows or Linux Format.",
  [invalidManagedIdentityIdType]: "More than one ManagedIdentityIdType was provided.",
  [invalidSecret]: "The secret in the file on the file path in the WWW-Authenticate header is greater than 4096 bytes.",
  [platformNotSupported]: "The platform is not supported by Azure Arc. Azure Arc only supports Windows and Linux.",
  [missingId]: "A ManagedIdentityId id was not provided.",
  [MsiEnvironmentVariableUrlMalformedErrorCodes.AZURE_POD_IDENTITY_AUTHORITY_HOST]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST}' environment variable is malformed.`,
  [MsiEnvironmentVariableUrlMalformedErrorCodes.IDENTITY_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' environment variable is malformed.`,
  [MsiEnvironmentVariableUrlMalformedErrorCodes.IMDS_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' environment variable is malformed.`,
  [MsiEnvironmentVariableUrlMalformedErrorCodes.MSI_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT}' environment variable is malformed.`,
  [networkUnavailable]: "Authentication unavailable. The request to the managed identity endpoint timed out.",
  [unableToCreateAzureArc]: "Azure Arc Managed Identities can only be system assigned.",
  [unableToCreateCloudShell]: "Cloud Shell Managed Identities can only be system assigned.",
  [unableToCreateSource]: "Unable to create a Managed Identity source based on environment variables.",
  [unableToReadSecretFile]: "Unable to read the secret file.",
  [userAssignedNotAvailableAtRuntime]: "Service Fabric user assigned managed identity ClientId or ResourceId is not configurable at runtime.",
  [userAssignedManagedIdentityNotConfirmed]: "Azure Arc did not confirm the requested user-assigned managed identity in the token response. The agent likely does not support user-assigned managed identity and returned the system-assigned identity.",
  [wwwAuthenticateHeaderMissing]: "A 401 response was received from the Azure Arc Managed Identity, but the www-authenticate header is missing.",
  [wwwAuthenticateHeaderUnsupportedFormat]: "A 401 response was received from the Azure Arc Managed Identity, but the www-authenticate header is in an unsupported format."
};
var ManagedIdentityError = class _ManagedIdentityError extends AuthError {
  constructor(errorCode, correlationId) {
    super(errorCode, correlationId, ManagedIdentityErrorMessages[errorCode]);
    this.name = "ManagedIdentityError";
    Object.setPrototypeOf(this, _ManagedIdentityError.prototype);
  }
};
function createManagedIdentityError(errorCode, correlationId) {
  return new ManagedIdentityError(errorCode, correlationId);
}

// node_modules/@azure/msal-node/dist/error/NodeAuthError.mjs
var NodeAuthErrorMessage = {
  invalidLoopbackAddressType: {
    code: "invalid_loopback_server_address_type",
    desc: "Loopback server address is not type string. This is unexpected."
  },
  unableToLoadRedirectUri: {
    code: "unable_to_load_redirectUrl",
    desc: "Loopback server callback was invoked without a url. This is unexpected."
  },
  noAuthCodeInResponse: {
    code: "no_auth_code_in_response",
    desc: "No auth code found in the server response. Please check your network trace to determine what happened."
  },
  noLoopbackServerExists: {
    code: "no_loopback_server_exists",
    desc: "No loopback server exists yet."
  },
  loopbackServerAlreadyExists: {
    code: "loopback_server_already_exists",
    desc: "Loopback server already exists. Cannot create another."
  },
  loopbackServerTimeout: {
    code: "loopback_server_timeout",
    desc: "Timed out waiting for auth code listener to be registered."
  },
  stateNotFoundError: {
    code: "state_not_found",
    desc: "State not found. Please verify that the request originated from msal."
  },
  thumbprintMissing: {
    code: "thumbprint_missing_from_client_certificate",
    desc: "Client certificate does not contain a SHA-1 or SHA-256 thumbprint."
  },
  redirectUriNotSupported: {
    code: "redirect_uri_not_supported",
    desc: "RedirectUri is not supported in this scenario. Please remove redirectUri from the request."
  }
};
var NodeAuthError = class _NodeAuthError extends AuthError {
  constructor(errorCode, correlationId, errorMessage) {
    super(errorCode, correlationId, errorMessage);
    this.name = "NodeAuthError";
  }
  /**
   * Creates an error thrown if loopback server address is of type string.
   */
  static createInvalidLoopbackAddressTypeError() {
    return new _NodeAuthError(NodeAuthErrorMessage.invalidLoopbackAddressType.code, "", `${NodeAuthErrorMessage.invalidLoopbackAddressType.desc}`);
  }
  /**
   * Creates an error thrown if the loopback server is unable to get a url.
   */
  static createUnableToLoadRedirectUrlError() {
    return new _NodeAuthError(NodeAuthErrorMessage.unableToLoadRedirectUri.code, "", `${NodeAuthErrorMessage.unableToLoadRedirectUri.desc}`);
  }
  /**
   * Creates an error thrown if the server response does not contain an auth code.
   */
  static createNoAuthCodeInResponseError(correlationId = "") {
    return new _NodeAuthError(NodeAuthErrorMessage.noAuthCodeInResponse.code, correlationId, `${NodeAuthErrorMessage.noAuthCodeInResponse.desc}`);
  }
  /**
   * Creates an error thrown if the loopback server has not been spun up yet.
   */
  static createNoLoopbackServerExistsError() {
    return new _NodeAuthError(NodeAuthErrorMessage.noLoopbackServerExists.code, "", `${NodeAuthErrorMessage.noLoopbackServerExists.desc}`);
  }
  /**
   * Creates an error thrown if a loopback server already exists when attempting to create another one.
   */
  static createLoopbackServerAlreadyExistsError() {
    return new _NodeAuthError(NodeAuthErrorMessage.loopbackServerAlreadyExists.code, "", `${NodeAuthErrorMessage.loopbackServerAlreadyExists.desc}`);
  }
  /**
   * Creates an error thrown if the loopback server times out registering the auth code listener.
   */
  static createLoopbackServerTimeoutError(correlationId = "") {
    return new _NodeAuthError(NodeAuthErrorMessage.loopbackServerTimeout.code, correlationId, `${NodeAuthErrorMessage.loopbackServerTimeout.desc}`);
  }
  /**
   * Creates an error thrown when the state is not present.
   */
  static createStateNotFoundError(correlationId = "") {
    return new _NodeAuthError(NodeAuthErrorMessage.stateNotFoundError.code, correlationId, NodeAuthErrorMessage.stateNotFoundError.desc);
  }
  /**
   * Creates an error thrown when client certificate was provided, but neither the SHA-1 or SHA-256 thumbprints were provided
   */
  static createThumbprintMissingError() {
    return new _NodeAuthError(NodeAuthErrorMessage.thumbprintMissing.code, "", NodeAuthErrorMessage.thumbprintMissing.desc);
  }
  /**
   * Creates an error thrown when redirectUri is provided in an unsupported scenario
   */
  static createRedirectUriNotSupportedError(correlationId = "") {
    return new _NodeAuthError(NodeAuthErrorMessage.redirectUriNotSupported.code, correlationId, NodeAuthErrorMessage.redirectUriNotSupported.desc);
  }
};

// node_modules/@azure/msal-node/dist/config/Configuration.mjs
var DEFAULT_AUTH_OPTIONS = {
  clientId: "",
  authority: Constants_exports.DEFAULT_AUTHORITY,
  clientSecret: "",
  clientAssertion: "",
  clientCertificate: {
    thumbprint: "",
    thumbprintSha256: "",
    privateKey: "",
    x5c: ""
  },
  knownAuthorities: [],
  cloudDiscoveryMetadata: "",
  authorityMetadata: "",
  clientCapabilities: [],
  azureCloudOptions: {
    azureCloudInstance: AzureCloudInstance.None,
    tenant: ""
  },
  isMcp: false
};
var DEFAULT_LOGGER_OPTIONS = {
  loggerCallback: () => {
  },
  piiLoggingEnabled: false,
  logLevel: LogLevel.Info
};
var DEFAULT_SYSTEM_OPTIONS2 = {
  loggerOptions: DEFAULT_LOGGER_OPTIONS,
  networkClient: new HttpClient(),
  disableInternalRetries: false,
  protocolMode: ProtocolMode.AAD
};
var DEFAULT_TELEMETRY_OPTIONS2 = {
  application: {
    appName: "",
    appVersion: ""
  }
};
function buildAppConfiguration({ auth, broker, cache, system, telemetry }) {
  const systemOptions = {
    ...DEFAULT_SYSTEM_OPTIONS2,
    networkClient: new HttpClient(),
    loggerOptions: system?.loggerOptions || DEFAULT_LOGGER_OPTIONS,
    disableInternalRetries: system?.disableInternalRetries || false
  };
  if (!!auth.clientCertificate && !!!auth.clientCertificate.thumbprint && !!!auth.clientCertificate.thumbprintSha256) {
    throw NodeAuthError.createStateNotFoundError();
  }
  return {
    auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
    broker: { ...broker },
    cache: { ...cache },
    system: { ...systemOptions, ...system },
    telemetry: { ...DEFAULT_TELEMETRY_OPTIONS2, ...telemetry }
  };
}

// node_modules/@azure/msal-node/dist/crypto/GuidGenerator.mjs
import { randomUUID } from "node:crypto";
var GuidGenerator = class {
  /**
   * Generates a random [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122.txt) version 4 UUID. The UUID is generated using a
   * cryptographic pseudorandom number generator.
   */
  generateGuid() {
    return randomUUID();
  }
  /**
   * verifies if a string is  GUID
   * @param guid
   */
  isGuid(guid) {
    const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regexGuid.test(guid);
  }
};

// node_modules/@azure/msal-node/dist/utils/EncodingUtils.mjs
var EncodingUtils = class _EncodingUtils {
  /**
   * 'utf8': Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
   * 'base64': Base64 encoding.
   *
   * @param str text
   */
  static base64Encode(str, encoding) {
    return Buffer.from(str, encoding).toString(Constants_exports.EncodingTypes.BASE64);
  }
  /**
   * encode a URL
   * @param str
   */
  static base64EncodeUrl(str, encoding) {
    return _EncodingUtils.base64Encode(str, encoding).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  /**
   * 'utf8': Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
   * 'base64': Base64 encoding.
   *
   * @param base64Str Base64 encoded text
   */
  static base64Decode(base64Str) {
    return Buffer.from(base64Str, Constants_exports.EncodingTypes.BASE64).toString("utf8");
  }
  /**
   * @param base64Str Base64 encoded Url
   */
  static base64DecodeUrl(base64Str) {
    let str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
      str += "=";
    }
    return _EncodingUtils.base64Decode(str);
  }
};

// node_modules/@azure/msal-node/dist/crypto/HashUtils.mjs
import crypto from "crypto";
var HashUtils = class {
  /**
   * generate 'SHA256' hash
   * @param buffer
   */
  sha256(buffer) {
    return crypto.createHash(Hash.SHA256).update(buffer).digest();
  }
};

// node_modules/@azure/msal-node/dist/crypto/PkceGenerator.mjs
import crypto2 from "crypto";
var PkceGenerator = class {
  constructor() {
    this.hashUtils = new HashUtils();
  }
  /**
   * generates the codeVerfier and the challenge from the codeVerfier
   * reference: https://tools.ietf.org/html/rfc7636#section-4.1 and https://tools.ietf.org/html/rfc7636#section-4.2
   */
  async generatePkceCodes() {
    const verifier = this.generateCodeVerifier();
    const challenge = this.generateCodeChallengeFromVerifier(verifier);
    return { verifier, challenge };
  }
  /**
   * generates the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.1
   */
  generateCodeVerifier() {
    const charArr = [];
    const maxNumber = 256 - 256 % CharSet.CV_CHARSET.length;
    while (charArr.length <= RANDOM_OCTET_SIZE) {
      const byte = crypto2.randomBytes(1)[0];
      if (byte >= maxNumber) {
        continue;
      }
      const index = byte % CharSet.CV_CHARSET.length;
      charArr.push(CharSet.CV_CHARSET[index]);
    }
    const verifier = charArr.join("");
    return EncodingUtils.base64EncodeUrl(verifier);
  }
  /**
   * generate the challenge from the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.2
   * @param codeVerifier
   */
  generateCodeChallengeFromVerifier(codeVerifier) {
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(codeVerifier).toString(Constants_exports.EncodingTypes.BASE64), Constants_exports.EncodingTypes.BASE64);
  }
};

// node_modules/@azure/msal-node/dist/crypto/CryptoProvider.mjs
var CryptoProvider = class {
  constructor() {
    this.pkceGenerator = new PkceGenerator();
    this.guidGenerator = new GuidGenerator();
    this.hashUtils = new HashUtils();
  }
  /**
   * base64 URL safe encoded string
   */
  base64UrlEncode() {
    throw new Error("Method not implemented.");
  }
  /**
   * Stringifies and base64Url encodes input public key
   * @param inputKid - public key id
   * @returns Base64Url encoded public key
   */
  encodeKid() {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a new random GUID - used to populate state and nonce.
   * @returns string (GUID)
   */
  createNewGuid() {
    return this.guidGenerator.generateGuid();
  }
  /**
   * Encodes input string to base64.
   * @param input - string to be encoded
   */
  base64Encode(input) {
    return EncodingUtils.base64Encode(input);
  }
  /**
   * Decodes input string from base64.
   * @param input - string to be decoded
   */
  base64Decode(input) {
    return EncodingUtils.base64Decode(input);
  }
  /**
   * Generates PKCE codes used in Authorization Code Flow.
   */
  generatePkceCodes() {
    return this.pkceGenerator.generatePkceCodes();
  }
  /**
   * Removes cryptographic keypair from key store matching the keyId passed in
   * @param kid - public key id
   * @param correlationId - correlation id
   */
  removeTokenBindingKey(kid, correlationId) {
    throw new Error("Method not implemented.");
  }
  /**
   * Removes all cryptographic keys from Keystore
   * @param correlationId - correlation id
   */
  clearKeystore(correlationId) {
    throw new Error("Method not implemented.");
  }
  /**
   * Signs a compact JWT with a token-binding key - not yet implemented for node
   * @param header - JOSE header
   * @param payload - JWT payload
   * @param kid - public key id
   * @param correlationId - correlation id
   */
  signTokenBindingJwt(header, payload, kid, correlationId) {
    throw createClientAuthError(ClientAuthErrorCodes_exports.methodNotImplemented, correlationId);
  }
  /**
   * Returns the SHA-256 hash of an input string
   */
  async hashString(plainText) {
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(plainText).toString(Constants_exports.EncodingTypes.BASE64), Constants_exports.EncodingTypes.BASE64);
  }
};

// node_modules/@azure/msal-node/dist/cache/CacheHelpers.mjs
import { createHash as createHash5 } from "crypto";
function computeAdditionalCacheKeyHash(components) {
  const sortedKeys = Object.keys(components).sort();
  let input = "";
  for (const key of sortedKeys) {
    const value = components[key];
    input += `${Buffer.byteLength(key, "utf8")}:${key}${Buffer.byteLength(value, "utf8")}:${value}`;
  }
  return createHash5("sha256").update(input, "utf8").digest("base64url");
}
function generateCredentialKey(credential, hash) {
  const familyId = credential.credentialType === Constants_exports.CredentialType.REFRESH_TOKEN && credential.familyId || credential.clientId;
  const scheme = credential.tokenType && credential.tokenType.toLowerCase() !== Constants_exports.AuthenticationScheme.BEARER.toLowerCase() ? credential.tokenType.toLowerCase() : "";
  const credentialKey = [
    credential.homeAccountId,
    credential.environment,
    credential.credentialType,
    familyId,
    credential.realm || "",
    credential.target || "",
    scheme
  ];
  if (credential.additionalCacheKeyComponents && Object.keys(credential.additionalCacheKeyComponents).length > 0) {
    credentialKey.push(hash ?? computeAdditionalCacheKeyHash(credential.additionalCacheKeyComponents));
  }
  return credentialKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}
function generateAccountKey(account) {
  const homeTenantId = account.homeAccountId.split(".")[1];
  const accountKey = [
    account.homeAccountId,
    account.environment,
    homeTenantId || account.tenantId || ""
  ];
  return accountKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}

// node_modules/@azure/msal-node/dist/cache/NodeStorage.mjs
var NodeStorage = class extends CacheManager {
  constructor(logger, clientId, cryptoImpl, staticAuthorityOptions) {
    super(clientId, cryptoImpl, logger, new StubPerformanceClient(), staticAuthorityOptions, DEFAULT_TOKEN_BINDING_KEY_MANAGER);
    this.cache = {};
    this.changeEmitters = [];
    this.logger = logger;
  }
  /**
   * Queue up callbacks
   * @param func - a callback function for cache change indication
   */
  registerChangeEmitter(func) {
    this.changeEmitters.push(func);
  }
  /**
   * Invoke the callback when cache changes
   */
  emitChange() {
    this.changeEmitters.forEach((func) => func.call(null));
  }
  /**
   * Converts cacheKVStore to InMemoryCache
   * @param cache - key value store
   */
  cacheToInMemoryCache(cache) {
    const inMemoryCache = {
      accounts: {},
      idTokens: {},
      accessTokens: {},
      refreshTokens: {},
      appMetadata: {}
    };
    for (const key in cache) {
      const value = cache[key];
      if (typeof value !== "object") {
        continue;
      }
      if (AccountEntityUtils_exports.isAccountEntity(value)) {
        inMemoryCache.accounts[key] = value;
      } else if (CacheHelpers_exports.isIdTokenEntity(value)) {
        inMemoryCache.idTokens[key] = value;
      } else if (CacheHelpers_exports.isAccessTokenEntity(value)) {
        inMemoryCache.accessTokens[key] = value;
      } else if (CacheHelpers_exports.isRefreshTokenEntity(value)) {
        inMemoryCache.refreshTokens[key] = value;
      } else if (CacheHelpers_exports.isAppMetadataEntity(key, value)) {
        inMemoryCache.appMetadata[key] = value;
      } else {
        continue;
      }
    }
    return inMemoryCache;
  }
  /**
   * converts inMemoryCache to CacheKVStore
   * @param inMemoryCache - kvstore map for inmemory
   */
  inMemoryCacheToCache(inMemoryCache) {
    let cache = this.getCache();
    cache = {
      ...cache,
      ...inMemoryCache.accounts,
      ...inMemoryCache.idTokens,
      ...inMemoryCache.accessTokens,
      ...inMemoryCache.refreshTokens,
      ...inMemoryCache.appMetadata
    };
    return cache;
  }
  /**
   * gets the current in memory cache for the client
   */
  getInMemoryCache() {
    this.logger.trace("Getting in-memory cache", "");
    const inMemoryCache = this.cacheToInMemoryCache(this.getCache());
    return inMemoryCache;
  }
  /**
   * sets the current in memory cache for the client
   * @param inMemoryCache - key value map in memory
   */
  setInMemoryCache(inMemoryCache) {
    this.logger.trace("Setting in-memory cache", "");
    const cache = this.inMemoryCacheToCache(inMemoryCache);
    this.setCache(cache);
    this.emitChange();
  }
  /**
   * get the current cache key-value store
   */
  getCache() {
    this.logger.trace("Getting cache key-value store", "");
    return this.cache;
  }
  /**
   * sets the current cache (key value store)
   * @param cacheMap - key value map
   */
  setCache(cache) {
    this.logger.trace("Setting cache key value store", "");
    this.cache = cache;
    this.emitChange();
  }
  /**
   * Gets cache item with given key.
   * @param key - lookup key for the cache entry
   */
  getItem(key) {
    this.logger.tracePii(`Item key: ${key}`, "");
    const cache = this.getCache();
    return cache[key];
  }
  /**
   * Gets cache item with given key-value
   * @param key - lookup key for the cache entry
   * @param value - value of the cache entry
   */
  setItem(key, value) {
    this.logger.tracePii(`Item key: ${key}`, "");
    const cache = this.getCache();
    cache[key] = value;
    this.setCache(cache);
  }
  generateCredentialKey(credential, additionalCacheKeyHash) {
    return generateCredentialKey(credential, additionalCacheKeyHash);
  }
  generateAccountKey(account) {
    return generateAccountKey(account);
  }
  getAccountKeys() {
    const inMemoryCache = this.getInMemoryCache();
    const accountKeys = Object.keys(inMemoryCache.accounts);
    return accountKeys;
  }
  getTokenKeys() {
    const inMemoryCache = this.getInMemoryCache();
    const tokenKeys = {
      idToken: Object.keys(inMemoryCache.idTokens),
      accessToken: Object.keys(inMemoryCache.accessTokens),
      refreshToken: Object.keys(inMemoryCache.refreshTokens)
    };
    return tokenKeys;
  }
  /**
   * Reads account from cache, builds it into an account entity and returns it.
   * @param accountKey - lookup key to fetch cache type AccountEntity
   * @returns
   */
  getAccount(accountKey) {
    const cachedAccount = this.getItem(accountKey);
    return cachedAccount && typeof cachedAccount === "object" ? { ...cachedAccount } : null;
  }
  /**
   * set account entity
   * @param account - cache value to be set of type AccountEntity
   */
  async setAccount(account) {
    const accountKey = this.generateAccountKey(AccountEntityUtils_exports.getAccountInfo(account));
    this.setItem(accountKey, account);
  }
  /**
   * fetch the idToken credential
   * @param idTokenKey - lookup key to fetch cache type IdTokenEntity
   */
  getIdTokenCredential(idTokenKey) {
    const idToken = this.getItem(idTokenKey);
    if (CacheHelpers_exports.isIdTokenEntity(idToken)) {
      return idToken;
    }
    return null;
  }
  /**
   * set idToken credential
   * @param idToken - cache value to be set of type IdTokenEntity
   */
  async setIdTokenCredential(idToken) {
    const idTokenKey = this.generateCredentialKey(idToken);
    this.setItem(idTokenKey, idToken);
  }
  /**
   * fetch the accessToken credential
   * @param accessTokenKey - lookup key to fetch cache type AccessTokenEntity
   */
  getAccessTokenCredential(accessTokenKey) {
    const accessToken = this.getItem(accessTokenKey);
    if (CacheHelpers_exports.isAccessTokenEntity(accessToken)) {
      return accessToken;
    }
    return null;
  }
  /**
   * Set accessToken credential to the cache
   * @param accessToken - the access token entity to cache
   * @param _correlationId - unique identifier for the request
   * @param _kmsi - keep me signed in flag
   * @param additionalCacheKeyHash - optional precomputed hash of additionalCacheKeyComponents used in key generation
   */
  async setAccessTokenCredential(accessToken, _correlationId, _kmsi, additionalCacheKeyHash) {
    const accessTokenKey = this.generateCredentialKey(accessToken, additionalCacheKeyHash);
    this.setItem(accessTokenKey, accessToken);
  }
  /**
   * fetch the refreshToken credential
   * @param refreshTokenKey - lookup key to fetch cache type RefreshTokenEntity
   */
  getRefreshTokenCredential(refreshTokenKey) {
    const refreshToken = this.getItem(refreshTokenKey);
    if (CacheHelpers_exports.isRefreshTokenEntity(refreshToken)) {
      return refreshToken;
    }
    return null;
  }
  /**
   * set refreshToken credential
   * @param refreshToken - cache value to be set of type RefreshTokenEntity
   */
  async setRefreshTokenCredential(refreshToken) {
    const refreshTokenKey = this.generateCredentialKey(refreshToken);
    this.setItem(refreshTokenKey, refreshToken);
  }
  /**
   * fetch appMetadata entity from the platform cache
   * @param appMetadataKey - lookup key to fetch cache type AppMetadataEntity
   */
  getAppMetadata(appMetadataKey) {
    const appMetadata = this.getItem(appMetadataKey);
    if (CacheHelpers_exports.isAppMetadataEntity(appMetadataKey, appMetadata)) {
      return appMetadata;
    }
    return null;
  }
  /**
   * set appMetadata entity to the platform cache
   * @param appMetadata - cache value to be set of type AppMetadataEntity
   */
  setAppMetadata(appMetadata) {
    const appMetadataKey = CacheHelpers_exports.generateAppMetadataKey(appMetadata);
    this.setItem(appMetadataKey, appMetadata);
  }
  /**
   * fetch server telemetry entity from the platform cache
   * @param serverTelemetrykey - lookup key to fetch cache type ServerTelemetryEntity
   */
  getServerTelemetry(serverTelemetrykey) {
    const serverTelemetryEntity = this.getItem(serverTelemetrykey);
    if (serverTelemetryEntity && CacheHelpers_exports.isServerTelemetryEntity(serverTelemetrykey, serverTelemetryEntity)) {
      return serverTelemetryEntity;
    }
    return null;
  }
  /**
   * set server telemetry entity to the platform cache
   * @param serverTelemetryKey - lookup key to fetch cache type ServerTelemetryEntity
   * @param serverTelemetry - cache value to be set of type ServerTelemetryEntity
   */
  setServerTelemetry(serverTelemetryKey, serverTelemetry) {
    this.setItem(serverTelemetryKey, serverTelemetry);
  }
  /**
   * fetch authority metadata entity from the platform cache
   * @param key - lookup key to fetch cache type AuthorityMetadataEntity
   */
  getAuthorityMetadata(key) {
    const authorityMetadataEntity = this.getItem(key);
    if (authorityMetadataEntity && CacheHelpers_exports.isAuthorityMetadataEntity(key, authorityMetadataEntity)) {
      return authorityMetadataEntity;
    }
    return null;
  }
  /**
   * Get all authority metadata keys
   */
  getAuthorityMetadataKeys() {
    return this.getKeys().filter((key) => {
      return this.isAuthorityMetadata(key);
    });
  }
  /**
   * set authority metadata entity to the platform cache
   * @param key - lookup key to fetch cache type AuthorityMetadataEntity
   * @param metadata - cache value to be set of type AuthorityMetadataEntity
   */
  setAuthorityMetadata(key, metadata) {
    this.setItem(key, metadata);
  }
  /**
   * fetch throttling entity from the platform cache
   * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
   */
  getThrottlingCache(throttlingCacheKey) {
    const throttlingCache = this.getItem(throttlingCacheKey);
    if (throttlingCache && CacheHelpers_exports.isThrottlingEntity(throttlingCacheKey, throttlingCache)) {
      return throttlingCache;
    }
    return null;
  }
  /**
   * set throttling entity to the platform cache
   * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
   * @param throttlingCache - cache value to be set of type ThrottlingEntity
   */
  setThrottlingCache(throttlingCacheKey, throttlingCache) {
    this.setItem(throttlingCacheKey, throttlingCache);
  }
  /**
   * Removes the cache item from memory with the given key.
   * @param key - lookup key to remove a cache entity
   * @param inMemory - key value map of the cache
   */
  removeItem(key) {
    this.logger.tracePii(`Item key: ${key}`, "");
    let result = false;
    const cache = this.getCache();
    if (!!cache[key]) {
      delete cache[key];
      result = true;
    }
    if (result) {
      this.setCache(cache);
      this.emitChange();
    }
    return result;
  }
  /**
   * Remove account entity from the platform cache if it's outdated
   * @param accountKey - lookup key to fetch cache type AccountEntity
   */
  removeOutdatedAccount(accountKey) {
    this.removeItem(accountKey);
  }
  /**
   * Checks whether key is in cache.
   * @param key - look up key for a cache entity
   */
  containsKey(key) {
    return this.getKeys().includes(key);
  }
  /**
   * Gets all keys in window.
   */
  getKeys() {
    this.logger.trace("Retrieving all cache keys", "");
    const cache = this.getCache();
    return [...Object.keys(cache)];
  }
  /**
   * Clears all cache entries created by MSAL except authority metadata..
   */
  clear() {
    this.logger.trace("Clearing cache entries created by MSAL", "");
    const cacheKeys = this.getKeys();
    cacheKeys.forEach((key) => {
      if (this.isAuthorityMetadata(key)) {
        return;
      }
      this.removeItem(key);
    });
    this.emitChange();
  }
  /**
   * Initialize in memory cache from an exisiting cache vault
   * @param cache - blob formatted cache (JSON)
   */
  static generateInMemoryCache(cache) {
    return Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));
  }
  /**
   * retrieves the final JSON
   * @param inMemoryCache - itemised cache read from the JSON
   */
  static generateJsonCache(inMemoryCache) {
    return Serializer.serializeAllCache(inMemoryCache);
  }
  /**
   * Updates a credential's cache key if the current cache key is outdated
   */
  updateCredentialCacheKey(currentCacheKey, credential) {
    const updatedCacheKey = this.generateCredentialKey(credential);
    if (currentCacheKey !== updatedCacheKey) {
      const cacheItem = this.getItem(currentCacheKey);
      if (cacheItem) {
        this.removeItem(currentCacheKey);
        this.setItem(updatedCacheKey, cacheItem);
        this.logger.verbose(`Updated an outdated ${credential.credentialType} cache key`, "");
        return updatedCacheKey;
      } else {
        this.logger.error(`Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`, "");
      }
    }
    return currentCacheKey;
  }
};

// node_modules/@azure/msal-node/dist/cache/TokenCache.mjs
var defaultSerializedCache = {
  Account: {},
  IdToken: {},
  AccessToken: {},
  RefreshToken: {},
  AppMetadata: {}
};
var TokenCache = class {
  constructor(storage, logger, cachePlugin) {
    this.cacheHasChanged = false;
    this.storage = storage;
    this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this));
    if (cachePlugin) {
      this.persistence = cachePlugin;
    }
    this.logger = logger;
  }
  /**
   * Set to true if cache state has changed since last time serialize or writeToPersistence was called
   */
  hasChanged() {
    return this.cacheHasChanged;
  }
  /**
   * Serializes in memory cache to JSON
   */
  serialize() {
    this.logger.trace("Serializing in-memory cache", "");
    let finalState = Serializer.serializeAllCache(this.storage.getInMemoryCache());
    if (this.cacheSnapshot) {
      this.logger.trace("Reading cache snapshot from disk", "");
      finalState = this.mergeState(JSON.parse(this.cacheSnapshot), finalState);
    } else {
      this.logger.trace("No cache snapshot to merge", "");
    }
    this.cacheHasChanged = false;
    return JSON.stringify(finalState);
  }
  /**
   * Deserializes JSON to in-memory cache. JSON should be in MSAL cache schema format
   * @param cache - blob formatted cache
   */
  deserialize(cache) {
    this.logger.trace("Deserializing JSON to in-memory cache", "");
    this.cacheSnapshot = cache;
    if (this.cacheSnapshot) {
      this.logger.trace("Reading cache snapshot from disk", "");
      const deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(this.cacheSnapshot)));
      this.storage.setInMemoryCache(deserializedCache);
    } else {
      this.logger.trace("No cache snapshot to deserialize", "");
    }
  }
  /**
   * Fetches the cache key-value map
   */
  getKVStore() {
    return this.storage.getCache();
  }
  /**
   * Gets cache snapshot in CacheKVStore format
   */
  getCacheSnapshot() {
    const deserializedPersistentStorage = NodeStorage.generateInMemoryCache(this.cacheSnapshot);
    return this.storage.inMemoryCacheToCache(deserializedPersistentStorage);
  }
  /**
   * API that retrieves all accounts currently in cache to the user
   */
  async getAllAccounts(correlationId = new CryptoProvider().createNewGuid()) {
    this.logger.trace("getAllAccounts called", correlationId);
    let cacheContext;
    try {
      if (this.persistence) {
        cacheContext = new TokenCacheContext(this, false);
        await this.persistence.beforeCacheAccess(cacheContext);
      }
      return this.storage.getAllAccounts({}, correlationId);
    } finally {
      if (this.persistence && cacheContext) {
        await this.persistence.afterCacheAccess(cacheContext);
      }
    }
  }
  /**
   * Returns the signed in account matching homeAccountId.
   * (the account object is created at the time of successful login)
   * or null when no matching account is found
   * @param homeAccountId - unique identifier for an account (uid.utid)
   */
  async getAccountByHomeId(homeAccountId) {
    const allAccounts = await this.getAllAccounts();
    if (homeAccountId && allAccounts && allAccounts.length) {
      return allAccounts.filter((accountObj) => accountObj.homeAccountId === homeAccountId)[0] || null;
    } else {
      return null;
    }
  }
  /**
   * Returns the signed in account matching localAccountId.
   * (the account object is created at the time of successful login)
   * or null when no matching account is found
   * @param localAccountId - unique identifier of an account (sub/obj when homeAccountId cannot be populated)
   */
  async getAccountByLocalId(localAccountId) {
    const allAccounts = await this.getAllAccounts();
    if (localAccountId && allAccounts && allAccounts.length) {
      return allAccounts.filter((accountObj) => accountObj.localAccountId === localAccountId)[0] || null;
    } else {
      return null;
    }
  }
  /**
   * API to remove a specific account and the relevant data from cache
   * @param account - AccountInfo passed by the user
   */
  async removeAccount(account, correlationId) {
    this.logger.trace("removeAccount called", correlationId || "");
    let cacheContext;
    try {
      if (this.persistence) {
        cacheContext = new TokenCacheContext(this, true);
        await this.persistence.beforeCacheAccess(cacheContext);
      }
      this.storage.removeAccount(account, correlationId || new GuidGenerator().generateGuid());
    } finally {
      if (this.persistence && cacheContext) {
        await this.persistence.afterCacheAccess(cacheContext);
      }
    }
  }
  /**
   * Overwrites in-memory cache with persistent cache
   */
  async overwriteCache() {
    if (!this.persistence) {
      this.logger.info("No persistence layer specified, cache cannot be overwritten", "");
      return;
    }
    this.logger.info("Overwriting in-memory cache with persistent cache", "");
    this.storage.clear();
    const cacheContext = new TokenCacheContext(this, false);
    await this.persistence.beforeCacheAccess(cacheContext);
    const cacheSnapshot = this.getCacheSnapshot();
    this.storage.setCache(cacheSnapshot);
    await this.persistence.afterCacheAccess(cacheContext);
  }
  /**
   * Called when the cache has changed state.
   */
  handleChangeEvent() {
    this.cacheHasChanged = true;
  }
  /**
   * Merge in memory cache with the cache snapshot.
   * @param oldState - cache before changes
   * @param currentState - current cache state in the library
   */
  mergeState(oldState, currentState) {
    this.logger.trace("Merging in-memory cache with cache snapshot", "");
    const stateAfterRemoval = this.mergeRemovals(oldState, currentState);
    return this.mergeUpdates(stateAfterRemoval, currentState);
  }
  /**
   * Deep update of oldState based on newState values
   * @param oldState - cache before changes
   * @param newState - updated cache
   */
  mergeUpdates(oldState, newState) {
    Object.keys(newState).forEach((newKey) => {
      const newValue = newState[newKey];
      if (!oldState.hasOwnProperty(newKey)) {
        if (newValue !== null) {
          oldState[newKey] = newValue;
        }
      } else {
        const newValueNotNull = newValue !== null;
        const newValueIsObject = typeof newValue === "object";
        const newValueIsNotArray = !Array.isArray(newValue);
        const oldStateNotUndefinedOrNull = typeof oldState[newKey] !== "undefined" && oldState[newKey] !== null;
        if (newValueNotNull && newValueIsObject && newValueIsNotArray && oldStateNotUndefinedOrNull) {
          this.mergeUpdates(oldState[newKey], newValue);
        } else {
          oldState[newKey] = newValue;
        }
      }
    });
    return oldState;
  }
  /**
   * Removes entities in oldState that the were removed from newState. If there are any unknown values in root of
   * oldState that are not recognized, they are left untouched.
   * @param oldState - cache before changes
   * @param newState - updated cache
   */
  mergeRemovals(oldState, newState) {
    this.logger.trace("Remove updated entries in cache", "");
    const accounts = oldState.Account ? this.mergeRemovalsDict(oldState.Account, newState.Account) : oldState.Account;
    const accessTokens = oldState.AccessToken ? this.mergeRemovalsDict(oldState.AccessToken, newState.AccessToken) : oldState.AccessToken;
    const refreshTokens = oldState.RefreshToken ? this.mergeRemovalsDict(oldState.RefreshToken, newState.RefreshToken) : oldState.RefreshToken;
    const idTokens = oldState.IdToken ? this.mergeRemovalsDict(oldState.IdToken, newState.IdToken) : oldState.IdToken;
    const appMetadata = oldState.AppMetadata ? this.mergeRemovalsDict(oldState.AppMetadata, newState.AppMetadata) : oldState.AppMetadata;
    return {
      ...oldState,
      Account: accounts,
      AccessToken: accessTokens,
      RefreshToken: refreshTokens,
      IdToken: idTokens,
      AppMetadata: appMetadata
    };
  }
  /**
   * Helper to merge new cache with the old one
   * @param oldState - cache before changes
   * @param newState - updated cache
   */
  mergeRemovalsDict(oldState, newState) {
    const finalState = { ...oldState };
    Object.keys(oldState).forEach((oldKey) => {
      if (!newState || !newState.hasOwnProperty(oldKey)) {
        delete finalState[oldKey];
      }
    });
    return finalState;
  }
  /**
   * Helper to overlay as a part of cache merge
   * @param passedInCache - cache read from the blob
   */
  overlayDefaults(passedInCache) {
    this.logger.trace("Overlaying input cache with the default cache", "");
    return {
      Account: {
        ...defaultSerializedCache.Account,
        ...passedInCache.Account
      },
      IdToken: {
        ...defaultSerializedCache.IdToken,
        ...passedInCache.IdToken
      },
      AccessToken: {
        ...defaultSerializedCache.AccessToken,
        ...passedInCache.AccessToken
      },
      RefreshToken: {
        ...defaultSerializedCache.RefreshToken,
        ...passedInCache.RefreshToken
      },
      AppMetadata: {
        ...defaultSerializedCache.AppMetadata,
        ...passedInCache.AppMetadata
      }
    };
  }
};

// node_modules/@azure/msal-node/dist/client/ClientAssertion.mjs
var import_jsonwebtoken = __toESM(require_jsonwebtoken(), 1);

// node_modules/@azure/msal-node/dist/error/ClientAuthErrorCodes.mjs
var userTimeoutReached = "user_timeout_reached";
var invalidAssertion = "invalid_assertion";
var deviceCodePollingCancelled = "device_code_polling_cancelled";
var deviceCodeExpired = "device_code_expired";
var deviceCodeUnknownError = "device_code_unknown_error";

// node_modules/@azure/msal-node/dist/client/ClientAssertion.mjs
var ClientAssertion = class _ClientAssertion {
  /**
   * Initialize the ClientAssertion class from the clientAssertion passed by the user
   * @param assertion - refer https://tools.ietf.org/html/rfc7521
   */
  static fromAssertion(assertion) {
    const clientAssertion = new _ClientAssertion();
    clientAssertion.jwt = assertion;
    return clientAssertion;
  }
  /**
   * @deprecated Use fromCertificateWithSha256Thumbprint instead, with a SHA-256 thumprint
   * Initialize the ClientAssertion class from the certificate passed by the user
   * @param thumbprint - identifier of a certificate
   * @param privateKey - secret key
   * @param publicCertificate - electronic document provided to prove the ownership of the public key
   */
  static fromCertificate(thumbprint, privateKey, publicCertificate) {
    const clientAssertion = new _ClientAssertion();
    clientAssertion.privateKey = privateKey;
    clientAssertion.thumbprint = thumbprint;
    clientAssertion.useSha256 = false;
    if (publicCertificate) {
      clientAssertion.publicCertificate = this.parseCertificate(publicCertificate);
    }
    return clientAssertion;
  }
  /**
   * Initialize the ClientAssertion class from the certificate passed by the user
   * @param thumbprint - identifier of a certificate
   * @param privateKey - secret key
   * @param publicCertificate - electronic document provided to prove the ownership of the public key
   */
  static fromCertificateWithSha256Thumbprint(thumbprint, privateKey, publicCertificate) {
    const clientAssertion = new _ClientAssertion();
    clientAssertion.privateKey = privateKey;
    clientAssertion.thumbprint = thumbprint;
    clientAssertion.useSha256 = true;
    if (publicCertificate) {
      clientAssertion.publicCertificate = this.parseCertificate(publicCertificate);
    }
    return clientAssertion;
  }
  /**
   * Update JWT for certificate based clientAssertion, if passed by the user, uses it as is
   * @param cryptoProvider - library's crypto helper
   * @param issuer - iss claim
   * @param jwtAudience - aud claim
   */
  getJwt(cryptoProvider, issuer, jwtAudience) {
    if (this.privateKey && this.thumbprint) {
      if (this.jwt && !this.isExpired() && issuer === this.issuer && jwtAudience === this.jwtAudience) {
        return this.jwt;
      }
      return this.createJwt(cryptoProvider, issuer, jwtAudience);
    }
    if (this.jwt) {
      return this.jwt;
    }
    throw createClientAuthError(invalidAssertion, "");
  }
  /**
   * JWT format and required claims specified: https://tools.ietf.org/html/rfc7523#section-3
   */
  createJwt(cryptoProvider, issuer, jwtAudience) {
    this.issuer = issuer;
    this.jwtAudience = jwtAudience;
    const issuedAt = TimeUtils_exports.nowSeconds();
    this.expirationTime = issuedAt + 600;
    const algorithm = this.useSha256 ? JwtConstants.PSS_256 : JwtConstants.RSA_256;
    const header = {
      alg: algorithm
    };
    const thumbprintHeader = this.useSha256 ? JwtConstants.X5T_256 : JwtConstants.X5T;
    Object.assign(header, {
      [thumbprintHeader]: EncodingUtils.base64EncodeUrl(this.thumbprint, Constants_exports.EncodingTypes.HEX)
    });
    if (this.publicCertificate) {
      Object.assign(header, {
        [JwtConstants.X5C]: this.publicCertificate
      });
    }
    const payload = {
      [JwtConstants.AUDIENCE]: this.jwtAudience,
      [JwtConstants.EXPIRATION_TIME]: this.expirationTime,
      [JwtConstants.ISSUER]: this.issuer,
      [JwtConstants.SUBJECT]: this.issuer,
      [JwtConstants.NOT_BEFORE]: issuedAt,
      [JwtConstants.JWT_ID]: cryptoProvider.createNewGuid()
    };
    this.jwt = import_jsonwebtoken.default.sign(payload, this.privateKey, { header });
    return this.jwt;
  }
  /**
   * Utility API to check expiration
   */
  isExpired() {
    return this.expirationTime < TimeUtils_exports.nowSeconds();
  }
  /**
   * Extracts the raw certs from a given certificate string and returns them in an array.
   * @param publicCertificate - electronic document provided to prove the ownership of the public key
   */
  static parseCertificate(publicCertificate) {
    const regexToFindCerts = /-----BEGIN CERTIFICATE-----\r*\n(.+?)\r*\n-----END CERTIFICATE-----/gs;
    const certs = [];
    let matches;
    while ((matches = regexToFindCerts.exec(publicCertificate)) !== null) {
      certs.push(matches[1].replace(/\r*\n/g, ""));
    }
    return certs;
  }
};

// node_modules/@azure/msal-node/dist/packageMetadata.mjs
var name2 = "@azure/msal-node";
var version2 = "6.0.0";

// node_modules/@azure/msal-node/dist/client/BaseClient.mjs
var BaseClient = class {
  constructor(configuration) {
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name2, version2);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = new StubPerformanceClient();
  }
  /**
   * Creates default headers for requests to token endpoint
   */
  createTokenRequestHeaders(ccsCred) {
    return Token_exports.createTokenRequestHeaders(this.logger, false, ccsCred);
  }
  /**
   * Http post to token endpoint
   * @param tokenEndpoint
   * @param queryString
   * @param headers
   * @param thumbprint
   */
  async executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId) {
    return Token_exports.executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, this.serverTelemetryManager);
  }
  /**
   * Wraps sendPostRequestAsync with necessary preflight and postflight logic
   * @param thumbprint - Request thumbprint for throttling
   * @param tokenEndpoint - Endpoint to make the POST to
   * @param options - Body and Headers to include on the POST request
   * @param correlationId - CorrelationId for telemetry
   */
  async sendPostRequest(thumbprint, tokenEndpoint, options, correlationId) {
    return Token_exports.sendPostRequest(thumbprint, tokenEndpoint, options, correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient);
  }
  /**
   * Creates query string for the /token request
   * @param request
   */
  createTokenQueryParameters(request) {
    return Token_exports.createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
  }
};

// node_modules/@azure/msal-node/dist/client/UsernamePasswordClient.mjs
var UsernamePasswordClient = class extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  /**
   * API to acquire a token by passing the username and password to the service in exchage of credentials
   * password_grant
   * @param request - CommonUsernamePasswordRequest
   */
  async acquireToken(request) {
    this.logger.info("in acquireToken call in username-password client", request.correlationId);
    const reqTimestamp = TimeUtils_exports.nowSeconds();
    const response = await this.executeTokenRequest(this.authority, request);
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin, this.config.tokenBindingKeyManager);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    const tokenResponse = responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, ApiId.acquireTokenByUsernamePassword);
    return tokenResponse;
  }
  /**
   * Executes POST request to token endpoint
   * @param authority - authority object
   * @param request - CommonUsernamePasswordRequest provided by the developer
   */
  async executeTokenRequest(authority, request) {
    const queryParametersString = this.createTokenQueryParameters(request);
    const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
    const requestBody2 = await this.createTokenRequestBody(request);
    const headers = this.createTokenRequestHeaders({
      credential: request.username,
      type: CcsCredentialType.UPN
    });
    const thumbprint = {
      clientId: this.config.authOptions.clientId,
      authority: authority.canonicalAuthority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return this.executePostToTokenEndpoint(endpoint, requestBody2, headers, thumbprint, request.correlationId);
  }
  /**
   * Generates a map for all the params to be sent to the service
   * @param request - CommonUsernamePasswordRequest provided by the developer
   */
  async createTokenRequestBody(request) {
    const parameters = /* @__PURE__ */ new Map();
    RequestParameterBuilder_exports.addClientId(parameters, this.config.authOptions.clientId);
    RequestParameterBuilder_exports.addUsername(parameters, request.username);
    RequestParameterBuilder_exports.addPassword(parameters, request.password);
    RequestParameterBuilder_exports.addScopes(parameters, request.scopes, request.correlationId);
    RequestParameterBuilder_exports.addResponseType(parameters, Constants_exports.OAuthResponseType.IDTOKEN_TOKEN);
    RequestParameterBuilder_exports.addGrantType(parameters, Constants_exports.GrantType.RESOURCE_OWNER_PASSWORD_GRANT);
    RequestParameterBuilder_exports.addClientInfo(parameters);
    RequestParameterBuilder_exports.addLibraryInfo(parameters, this.config.libraryInfo);
    RequestParameterBuilder_exports.addApplicationTelemetry(parameters, this.config.telemetry.application);
    RequestParameterBuilder_exports.addThrottling(parameters);
    if (this.serverTelemetryManager) {
      RequestParameterBuilder_exports.addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
    RequestParameterBuilder_exports.addCorrelationId(parameters, correlationId);
    if (this.config.clientCredentials.clientSecret) {
      RequestParameterBuilder_exports.addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    }
    const clientAssertion = this.config.clientCredentials.clientAssertion;
    if (clientAssertion) {
      RequestParameterBuilder_exports.addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
      RequestParameterBuilder_exports.addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
      RequestParameterBuilder_exports.addClaims(parameters, request.correlationId, request.claims, this.config.authOptions.clientCapabilities);
    }
    if (this.config.systemOptions.preventCorsPreflight && request.username) {
      RequestParameterBuilder_exports.addCcsUpn(parameters, request.username);
    }
    return UrlUtils_exports.mapToQueryString(parameters);
  }
};

// node_modules/@azure/msal-node/dist/protocol/Authorize.mjs
function getAuthCodeRequestUrl(config, authority, request, logger) {
  const parameters = Authorize_exports.getStandardAuthorizeRequestParameters({
    ...config.auth,
    authority,
    redirectUri: request.redirectUri || ""
  }, request, logger);
  RequestParameterBuilder_exports.addLibraryInfo(parameters, {
    sku: Constants.MSAL_SKU,
    version: version2,
    cpu: process.arch || "",
    os: process.platform || ""
  });
  if (config.system.protocolMode !== ProtocolMode.OIDC) {
    RequestParameterBuilder_exports.addApplicationTelemetry(parameters, config.telemetry.application);
  }
  RequestParameterBuilder_exports.addResponseType(parameters, Constants_exports.OAuthResponseType.CODE);
  if (request.codeChallenge && request.codeChallengeMethod) {
    RequestParameterBuilder_exports.addCodeChallengeParams(parameters, request.codeChallenge, request.codeChallengeMethod);
  }
  RequestParameterBuilder_exports.addExtraParameters(parameters, request.extraQueryParameters || {});
  return Authorize_exports.getAuthorizeUrl(authority, parameters);
}

// node_modules/@azure/msal-node/dist/client/ClientApplication.mjs
var ClientApplication = class {
  /**
   * Constructor for the ClientApplication
   */
  constructor(configuration) {
    this.config = buildAppConfiguration(configuration);
    this.cryptoProvider = new CryptoProvider();
    this.logger = new Logger(this.config.system.loggerOptions, name2, version2);
    this.storage = new NodeStorage(this.logger, this.config.auth.clientId, this.cryptoProvider, buildStaticAuthorityOptions(this.config.auth));
    this.tokenCache = new TokenCache(this.storage, this.logger, this.config.cache.cachePlugin);
  }
  /**
   * Creates the URL of the authorization request, letting the user input credentials and consent to the
   * application. The URL targets the /authorize endpoint of the authority configured in the
   * application object.
   *
   * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
   * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
   * `acquireTokenByCode(AuthorizationCodeRequest)`.
   */
  async getAuthCodeUrl(request) {
    this.logger.info("getAuthCodeUrl called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      responseMode: request.responseMode || Constants_exports.ResponseMode.QUERY,
      authenticationScheme: Constants_exports.AuthenticationScheme.BEARER,
      state: request.state || "",
      nonce: request.nonce || ""
    };
    const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
    return getAuthCodeRequestUrl(this.config, discoveredAuthority, validRequest, this.logger);
  }
  /**
   * Acquires a token by exchanging the Authorization Code received from the first step of OAuth2.0
   * Authorization Code flow.
   *
   * `getAuthCodeUrl(AuthorizationCodeUrlRequest)` can be used to create the URL for the first step of OAuth2.0
   * Authorization Code flow. Ensure that values for redirectUri and scopes in AuthorizationCodeUrlRequest and
   * AuthorizationCodeRequest are the same.
   */
  async acquireTokenByCode(request, authCodePayLoad) {
    this.logger.info("acquireTokenByCode called", request.correlationId || "");
    let validatedAuthCodePayload = authCodePayLoad;
    if (request.state && validatedAuthCodePayload) {
      this.logger.info("acquireTokenByCode - validating state", request.correlationId || "");
      this.validateState(request.state, validatedAuthCodePayload.state || "", request.correlationId || "");
      validatedAuthCodePayload = {
        ...validatedAuthCodePayload,
        state: ""
      };
    }
    if (request.nonce) {
      validatedAuthCodePayload = {
        ...validatedAuthCodePayload,
        code: request.code,
        nonce: request.nonce
      };
    }
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      authenticationScheme: Constants_exports.AuthenticationScheme.BEARER
    };
    const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByCode, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
      const authClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri, serverTelemetryManager);
      const authorizationCodeClient = new AuthorizationCodeClient(authClientConfig, new StubPerformanceClient());
      this.logger.verbose("Auth code client created", validRequest.correlationId);
      return await authorizationCodeClient.acquireToken(validRequest, ApiId.acquireTokenByCode, validatedAuthCodePayload);
    } catch (e) {
      if (e instanceof AuthError) {
        e.correlationId = validRequest.correlationId;
      }
      serverTelemetryManager.cacheFailedRequest(e);
      throw e;
    }
  }
  /**
   * Acquires a token by exchanging the refresh token provided for a new set of tokens.
   *
   * This API is provided only for scenarios where you would like to migrate from ADAL to MSAL. Otherwise, it is
   * recommended that you use `acquireTokenSilent()` for silent scenarios. When using `acquireTokenSilent()`, MSAL will
   * handle the caching and refreshing of tokens automatically.
   */
  async acquireTokenByRefreshToken(request) {
    this.logger.info("acquireTokenByRefreshToken called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      authenticationScheme: Constants_exports.AuthenticationScheme.BEARER
    };
    const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByRefreshToken, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
      const refreshTokenClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager);
      const refreshTokenClient = new RefreshTokenClient(refreshTokenClientConfig, new StubPerformanceClient());
      this.logger.verbose("Refresh token client created", validRequest.correlationId);
      return await refreshTokenClient.acquireToken(validRequest, ApiId.acquireTokenByRefreshToken);
    } catch (e) {
      if (e instanceof AuthError) {
        e.correlationId = validRequest.correlationId;
      }
      serverTelemetryManager.cacheFailedRequest(e);
      throw e;
    }
  }
  /**
   * Acquires a token silently when a user specifies the account the token is requested for.
   *
   * This API expects the user to provide an account object and looks into the cache to retrieve the token if present.
   * There is also an optional "forceRefresh" boolean the user can send to bypass the cache for access_token and id_token.
   * In case the refresh_token is expired or not found, an error is thrown
   * and the guidance is for the user to call any interactive token acquisition API (eg: `acquireTokenByCode()`).
   */
  async acquireTokenSilent(request) {
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      forceRefresh: request.forceRefresh || false
    };
    const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent, validRequest.correlationId, validRequest.forceRefresh);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
      const clientConfiguration = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager);
      const silentFlowClient = new SilentFlowClient(clientConfiguration, new StubPerformanceClient());
      this.logger.verbose("Silent flow client created", validRequest.correlationId);
      try {
        await this.tokenCache.overwriteCache();
        return await this.acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration);
      } catch (error) {
        if (error instanceof ClientAuthError && error.errorCode === ClientAuthErrorCodes_exports.tokenRefreshRequired) {
          const refreshTokenClient = new RefreshTokenClient(clientConfiguration, new StubPerformanceClient());
          return refreshTokenClient.acquireTokenByRefreshToken(validRequest, ApiId.acquireTokenSilent);
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof AuthError) {
        error.correlationId = validRequest.correlationId;
      }
      serverTelemetryManager.cacheFailedRequest(error);
      throw error;
    }
  }
  async acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration) {
    const [authResponse, cacheOutcome] = await silentFlowClient.acquireCachedToken({
      ...validRequest,
      scopes: validRequest.scopes?.length ? validRequest.scopes : [...Constants_exports.OIDC_DEFAULT_SCOPES]
    });
    if (cacheOutcome === Constants_exports.CacheOutcome.PROACTIVELY_REFRESHED) {
      this.logger.info("ClientApplication:acquireCachedTokenSilent - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.", validRequest.correlationId);
      const refreshTokenClient = new RefreshTokenClient(clientConfiguration, new StubPerformanceClient());
      try {
        await refreshTokenClient.acquireTokenByRefreshToken(validRequest, ApiId.acquireTokenSilent);
      } catch {
      }
    }
    return authResponse;
  }
  /**
   * Acquires tokens with password grant by exchanging client applications username and password for credentials
   *
   * The latest OAuth 2.0 Security Best Current Practice disallows the password grant entirely.
   * More details on this recommendation at https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-3.4
   * Microsoft's documentation and recommendations are at:
   * https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows#usernamepassword
   *
   * @param request - UsenamePasswordRequest
   * @deprecated - Use a more secure flow instead
   */
  async acquireTokenByUsernamePassword(request) {
    this.logger.info("acquireTokenByUsernamePassword called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request)
    };
    const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByUsernamePassword, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
      const usernamePasswordClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager);
      const usernamePasswordClient = new UsernamePasswordClient(usernamePasswordClientConfig);
      this.logger.verbose("Username password client created", validRequest.correlationId);
      return await usernamePasswordClient.acquireToken(validRequest);
    } catch (e) {
      if (e instanceof AuthError) {
        e.correlationId = validRequest.correlationId;
      }
      serverTelemetryManager.cacheFailedRequest(e);
      throw e;
    }
  }
  /**
   * Gets the token cache for the application.
   */
  getTokenCache() {
    this.logger.info("getTokenCache called", "");
    return this.tokenCache;
  }
  /**
   * Validates OIDC state by comparing the user cached state with the state received from the server.
   *
   * This API is provided for scenarios where you would use OAuth2.0 state parameter to mitigate against
   * CSRF attacks.
   * For more information about state, visit https://datatracker.ietf.org/doc/html/rfc6819#section-3.6.
   * @param state - Unique GUID generated by the user that is cached by the user and sent to the server during the first leg of the flow
   * @param cachedState - This string is sent back by the server with the authorization code
   */
  validateState(state, cachedState, correlationId) {
    if (!state) {
      throw NodeAuthError.createStateNotFoundError(correlationId);
    }
    if (state !== cachedState) {
      throw createClientAuthError(ClientAuthErrorCodes_exports.stateMismatch, correlationId);
    }
  }
  /**
   * Returns the logger instance
   */
  getLogger() {
    return this.logger;
  }
  /**
   * Replaces the default logger set in configurations with new Logger with new configurations
   * @param logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }
  /**
   * Builds the common configuration to be passed to the common component based on the platform configurarion
   * @param authority - user passed authority in configuration
   * @param serverTelemetryManager - initializes servertelemetry if passed
   */
  async buildOauthClientConfiguration(discoveredAuthority, requestCorrelationId, redirectUri, serverTelemetryManager) {
    this.logger.verbose("buildOauthClientConfiguration called", requestCorrelationId);
    this.logger.info(`Building oauth client configuration with the following authority: ${discoveredAuthority.tokenEndpoint}.`, requestCorrelationId);
    serverTelemetryManager?.updateRegionDiscoveryMetadata(discoveredAuthority.regionDiscoveryMetadata);
    const clientConfiguration = {
      authOptions: {
        clientId: this.config.auth.clientId,
        authority: discoveredAuthority,
        clientCapabilities: this.config.auth.clientCapabilities,
        redirectUri,
        isMcp: this.config.auth.isMcp
      },
      loggerOptions: {
        logLevel: this.config.system.loggerOptions.logLevel,
        loggerCallback: this.config.system.loggerOptions.loggerCallback,
        piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
        correlationId: requestCorrelationId
      },
      cryptoInterface: this.cryptoProvider,
      networkInterface: this.config.system.networkClient,
      storageInterface: this.storage,
      serverTelemetryManager,
      clientCredentials: {
        clientSecret: this.clientSecret,
        clientAssertion: await this.getClientAssertion(discoveredAuthority)
      },
      libraryInfo: {
        sku: Constants.MSAL_SKU,
        version: version2,
        cpu: process.arch || "",
        os: process.platform || ""
      },
      telemetry: this.config.telemetry,
      persistencePlugin: this.config.cache.cachePlugin,
      serializableCache: this.tokenCache
    };
    return clientConfiguration;
  }
  async getClientAssertion(authority) {
    if (this.developerProvidedClientAssertion) {
      this.clientAssertion = ClientAssertion.fromAssertion(await getClientAssertion(this.developerProvidedClientAssertion, this.config.auth.clientId, authority.tokenEndpoint));
    }
    return this.clientAssertion && {
      assertion: this.clientAssertion.getJwt(this.cryptoProvider, this.config.auth.clientId, authority.tokenEndpoint),
      assertionType: Constants.JWT_BEARER_ASSERTION_TYPE
    };
  }
  /**
   * Generates a request with the default scopes & generates a correlationId.
   * @param authRequest - BaseAuthRequest for initialization
   */
  async initializeBaseRequest(authRequest) {
    const correlationId = authRequest.correlationId || this.cryptoProvider.createNewGuid();
    this.logger.verbose("initializeRequestScopes called", correlationId);
    if (authRequest.authenticationScheme && authRequest.authenticationScheme === Constants_exports.AuthenticationScheme.POP) {
      this.logger.verbose("Authentication Scheme 'pop' is not supported yet, setting Authentication Scheme to 'Bearer' for request", correlationId);
    }
    authRequest.authenticationScheme = Constants_exports.AuthenticationScheme.BEARER;
    return {
      ...authRequest,
      scopes: [
        ...authRequest && authRequest.scopes || [],
        ...Constants_exports.OIDC_DEFAULT_SCOPES
      ],
      correlationId,
      authority: authRequest.authority || this.config.auth.authority
    };
  }
  /**
   * Initializes the server telemetry payload
   * @param apiId - Id for a specific request
   * @param correlationId - GUID
   * @param forceRefresh - boolean to indicate network call
   */
  initializeServerTelemetryManager(apiId, correlationId, forceRefresh) {
    const telemetryPayload = {
      clientId: this.config.auth.clientId,
      correlationId,
      apiId,
      forceRefresh: forceRefresh || false
    };
    return new ServerTelemetryManager(telemetryPayload, this.storage);
  }
  /**
   * Create authority instance. If authority not passed in request, default to authority set on the application
   * object. If no authority set in application object, then default to common authority.
   * @param authorityString - authority from user configuration
   */
  async createAuthority(authorityString, requestCorrelationId, azureRegionConfiguration, azureCloudOptions) {
    this.logger.verbose("createAuthority called", requestCorrelationId);
    const authorityUrl = Authority.generateAuthority(authorityString, azureCloudOptions || this.config.auth.azureCloudOptions);
    const authorityOptions = {
      protocolMode: this.config.system.protocolMode,
      knownAuthorities: this.config.auth.knownAuthorities,
      cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
      authorityMetadata: this.config.auth.authorityMetadata,
      azureRegionConfiguration
    };
    return AuthorityFactory_exports.createDiscoveredInstance(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions, this.logger, requestCorrelationId, new StubPerformanceClient());
  }
  /**
   * Clear the cache except for authority metadata.
   */
  clearCache() {
    this.storage.clear();
  }
};

// node_modules/@azure/msal-node/dist/network/LoopbackClient.mjs
import http from "http";
var LoopbackClient = class {
  constructor(preferredPort) {
    this.preferredPort = preferredPort;
  }
  /**
   * Spins up a loopback server which returns the server response when the localhost redirectUri is hit
   * @param successTemplate
   * @param errorTemplate
   * @returns
   */
  async listenForAuthCode(successTemplate, errorTemplate) {
    if (this.server) {
      throw NodeAuthError.createLoopbackServerAlreadyExistsError();
    }
    return new Promise((resolve6, reject) => {
      this.server = http.createServer((req, res) => {
        const method = req.method?.toUpperCase();
        if (method !== "GET" && method !== "POST") {
          res.writeHead(405, {
            Allow: "GET, POST"
          });
          res.end("Method Not Allowed");
          return;
        }
        const url = req.url;
        if (!url) {
          res.end(errorTemplate || "Error occurred loading redirectUrl");
          reject(NodeAuthError.createUnableToLoadRedirectUrlError());
          return;
        } else if (url === Constants_exports.FORWARD_SLASH) {
          if (method === "POST") {
            this.handlePostRequest(req, res, resolve6, successTemplate, errorTemplate);
            return;
          }
          res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
          return;
        }
        if (method === "GET") {
          const redirectUri = this.getRedirectUri();
          const parsedUrl = new URL(url, redirectUri);
          const authCodeResponse = UrlUtils_exports.getDeserializedResponse(parsedUrl.search) || {};
          if (!authCodeResponse.code && !authCodeResponse.error) {
            res.writeHead(200);
            res.end();
            return;
          }
          if (authCodeResponse.code) {
            res.writeHead(Constants_exports.HTTP_REDIRECT, {
              location: redirectUri
            });
            res.end();
          }
          if (authCodeResponse.error) {
            res.end(errorTemplate || `Error occurred: ${authCodeResponse.error}`);
          }
          resolve6(authCodeResponse);
        } else {
          res.writeHead(200);
          res.end();
        }
      });
      const port = this.preferredPort || 0;
      this.server.on("error", (err) => {
        if (err.code === "EADDRINUSE" && this.preferredPort && port !== 0) {
          this.server?.listen(0, "127.0.0.1");
        } else {
          reject(err);
        }
      });
      this.server.listen(port, "127.0.0.1");
    });
  }
  /**
   * Handles POST requests for form_post response mode
   */
  handlePostRequest(req, res, resolve6, successTemplate, errorTemplate) {
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim();
    if (contentType !== "application/x-www-form-urlencoded") {
      res.writeHead(415);
      res.end("Unsupported Media Type");
      return;
    }
    let body = "";
    req.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(400);
      }
      res.end();
    });
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const authCodeResponse = UrlUtils_exports.getDeserializedResponse(`?${body}`) || {};
      if (!authCodeResponse.code && !authCodeResponse.error) {
        res.writeHead(200);
        res.end();
        return;
      }
      if (authCodeResponse.error) {
        res.writeHead(200);
        res.end(errorTemplate || `Error occurred: ${authCodeResponse.error}`);
      } else {
        res.writeHead(200);
        res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
      }
      resolve6(authCodeResponse);
    });
  }
  /**
   * Get the port that the loopback server is running on
   * @returns
   */
  getRedirectUri() {
    if (!this.server || !this.server.listening) {
      throw NodeAuthError.createNoLoopbackServerExistsError();
    }
    const address = this.server.address();
    if (!address || typeof address === "string" || !address.port) {
      this.closeServer();
      throw NodeAuthError.createInvalidLoopbackAddressTypeError();
    }
    const port = address && address.port;
    return `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}:${port}`;
  }
  /**
   * Close the loopback server
   */
  closeServer() {
    if (this.server) {
      this.server.close();
      if (typeof this.server.closeAllConnections === "function") {
        this.server.closeAllConnections();
      }
      this.server.unref();
      this.server = void 0;
    }
  }
};

// node_modules/@azure/msal-node/dist/client/DeviceCodeClient.mjs
var DeviceCodeClient = class extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  /**
   * Gets device code from device code endpoint, calls back to with device code response, and
   * polls token endpoint to exchange device code for tokens
   * @param request - developer provided CommonDeviceCodeRequest
   */
  async acquireToken(request) {
    const deviceCodeResponse = await this.getDeviceCode(request);
    request.deviceCodeCallback(deviceCodeResponse);
    const reqTimestamp = TimeUtils_exports.nowSeconds();
    const response = await this.acquireTokenWithDeviceCode(request, deviceCodeResponse);
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin, this.config.tokenBindingKeyManager);
    responseHandler.validateTokenResponse(response, request.correlationId);
    return responseHandler.handleServerTokenResponse(response, this.authority, reqTimestamp, request, ApiId.acquireTokenByDeviceCode);
  }
  /**
   * Creates device code request and executes http GET
   * @param request - developer provided CommonDeviceCodeRequest
   */
  async getDeviceCode(request) {
    const queryParametersString = this.createExtraQueryParameters(request);
    const endpoint = UrlString.appendQueryString(this.authority.deviceCodeEndpoint, queryParametersString);
    const queryString = this.createQueryString(request);
    const headers = this.createTokenRequestHeaders();
    const thumbprint = {
      clientId: this.config.authOptions.clientId,
      authority: request.authority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return this.executePostRequestToDeviceCodeEndpoint(endpoint, queryString, headers, thumbprint, request.correlationId);
  }
  /**
   * Creates query string for the device code request
   * @param request - developer provided CommonDeviceCodeRequest
   */
  createExtraQueryParameters(request) {
    const parameters = /* @__PURE__ */ new Map();
    if (request.extraQueryParameters) {
      RequestParameterBuilder_exports.addExtraParameters(parameters, request.extraQueryParameters);
    }
    return UrlUtils_exports.mapToQueryString(parameters);
  }
  /**
   * Executes POST request to device code endpoint
   * @param deviceCodeEndpoint - token endpoint
   * @param queryString - string to be used in the body of the request
   * @param headers - headers for the request
   * @param thumbprint - unique request thumbprint
   * @param correlationId - correlation id to be used in the request
   */
  async executePostRequestToDeviceCodeEndpoint(deviceCodeEndpoint, queryString, headers, thumbprint, correlationId) {
    const { body: { user_code: userCode, device_code: deviceCode, verification_uri: verificationUri, expires_in: expiresIn, interval, message } } = await this.sendPostRequest(thumbprint, deviceCodeEndpoint, {
      body: queryString,
      headers
    }, correlationId);
    return {
      userCode,
      deviceCode,
      verificationUri,
      expiresIn,
      interval,
      message
    };
  }
  /**
   * Create device code endpoint query parameters and returns string
   * @param request - developer provided CommonDeviceCodeRequest
   */
  createQueryString(request) {
    const parameters = /* @__PURE__ */ new Map();
    RequestParameterBuilder_exports.addScopes(parameters, request.scopes, request.correlationId);
    RequestParameterBuilder_exports.addClientId(parameters, this.config.authOptions.clientId);
    if (request.extraQueryParameters) {
      RequestParameterBuilder_exports.addExtraParameters(parameters, request.extraQueryParameters);
    }
    if (request.claims || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
      RequestParameterBuilder_exports.addClaims(parameters, request.correlationId, request.claims, this.config.authOptions.clientCapabilities);
    }
    return UrlUtils_exports.mapToQueryString(parameters);
  }
  /**
   * Breaks the polling with specific conditions
   * @param deviceCodeExpirationTime - expiration time for the device code request
   * @param correlationId - correlation id of the request
   * @param userSpecifiedTimeout - developer provided timeout, to be compared against deviceCodeExpirationTime
   * @param userSpecifiedCancelFlag - boolean indicating the developer would like to cancel the request
   */
  continuePolling(deviceCodeExpirationTime, correlationId, userSpecifiedTimeout, userSpecifiedCancelFlag) {
    if (userSpecifiedCancelFlag) {
      this.logger.error("Token request cancelled by setting DeviceCodeRequest.cancel = true", correlationId);
      throw createClientAuthError(deviceCodePollingCancelled, correlationId);
    } else if (userSpecifiedTimeout && userSpecifiedTimeout < deviceCodeExpirationTime && TimeUtils_exports.nowSeconds() > userSpecifiedTimeout) {
      this.logger.error(`User defined timeout for device code polling reached. The timeout was set for ${userSpecifiedTimeout}`, correlationId);
      throw createClientAuthError(userTimeoutReached, correlationId);
    } else if (TimeUtils_exports.nowSeconds() > deviceCodeExpirationTime) {
      if (userSpecifiedTimeout) {
        this.logger.verbose(`User specified timeout ignored as the device code has expired before the timeout elapsed. The user specified timeout was set for ${userSpecifiedTimeout}`, correlationId);
      }
      this.logger.error(`Device code expired. Expiration time of device code was ${deviceCodeExpirationTime}`, correlationId);
      throw createClientAuthError(deviceCodeExpired, correlationId);
    }
    return true;
  }
  /**
   * Creates token request with device code response and polls token endpoint at interval set by the device code response
   * @param request - developer provided CommonDeviceCodeRequest
   * @param deviceCodeResponse - DeviceCodeResponse returned by the security token service device code endpoint
   */
  async acquireTokenWithDeviceCode(request, deviceCodeResponse) {
    const queryParametersString = this.createTokenQueryParameters(request);
    const endpoint = UrlString.appendQueryString(this.authority.tokenEndpoint, queryParametersString);
    const requestBody2 = this.createTokenRequestBody(request, deviceCodeResponse);
    const headers = this.createTokenRequestHeaders();
    const userSpecifiedTimeout = request.timeout ? TimeUtils_exports.nowSeconds() + request.timeout : void 0;
    const deviceCodeExpirationTime = TimeUtils_exports.nowSeconds() + deviceCodeResponse.expiresIn;
    const pollingIntervalMilli = deviceCodeResponse.interval * 1e3;
    while (this.continuePolling(deviceCodeExpirationTime, request.correlationId, userSpecifiedTimeout, request.cancel)) {
      const thumbprint = {
        clientId: this.config.authOptions.clientId,
        authority: request.authority,
        scopes: request.scopes,
        claims: request.claims,
        authenticationScheme: request.authenticationScheme,
        resourceRequestMethod: request.resourceRequestMethod,
        resourceRequestUri: request.resourceRequestUri,
        shrClaims: request.shrClaims,
        sshKid: request.sshKid
      };
      const response = await this.executePostToTokenEndpoint(endpoint, requestBody2, headers, thumbprint, request.correlationId);
      if (response.body && response.body.error) {
        if (response.body.error === Constants_exports.AUTHORIZATION_PENDING) {
          this.logger.info("Authorization pending. Continue polling.", request.correlationId);
          await TimeUtils_exports.delay(pollingIntervalMilli);
        } else {
          this.logger.info("Unexpected error in polling from the server", request.correlationId);
          throw createAuthError(AuthErrorCodes_exports.postRequestFailed, request.correlationId, response.body.error);
        }
      } else {
        this.logger.verbose("Authorization completed successfully. Polling stopped.", request.correlationId);
        return response.body;
      }
    }
    this.logger.error("Polling stopped for unknown reasons.", request.correlationId);
    throw createClientAuthError(deviceCodeUnknownError, request.correlationId);
  }
  /**
   * Creates query parameters and converts to string.
   * @param request - developer provided CommonDeviceCodeRequest
   * @param deviceCodeResponse - DeviceCodeResponse returned by the security token service device code endpoint
   */
  createTokenRequestBody(request, deviceCodeResponse) {
    const parameters = /* @__PURE__ */ new Map();
    RequestParameterBuilder_exports.addScopes(parameters, request.scopes, request.correlationId);
    RequestParameterBuilder_exports.addClientId(parameters, this.config.authOptions.clientId);
    RequestParameterBuilder_exports.addGrantType(parameters, Constants_exports.GrantType.DEVICE_CODE_GRANT);
    RequestParameterBuilder_exports.addDeviceCode(parameters, deviceCodeResponse.deviceCode);
    const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
    RequestParameterBuilder_exports.addCorrelationId(parameters, correlationId);
    RequestParameterBuilder_exports.addClientInfo(parameters);
    RequestParameterBuilder_exports.addLibraryInfo(parameters, this.config.libraryInfo);
    RequestParameterBuilder_exports.addApplicationTelemetry(parameters, this.config.telemetry.application);
    RequestParameterBuilder_exports.addThrottling(parameters);
    if (this.serverTelemetryManager) {
      RequestParameterBuilder_exports.addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
      RequestParameterBuilder_exports.addClaims(parameters, request.correlationId, request.claims, this.config.authOptions.clientCapabilities);
    }
    return UrlUtils_exports.mapToQueryString(parameters);
  }
};

// node_modules/@azure/msal-node/dist/client/PublicClientApplication.mjs
var PublicClientApplication = class extends ClientApplication {
  /**
   * Important attributes in the Configuration object for auth are:
   * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal.
   * - authority: the authority URL for your application.
   *
   * AAD authorities are of the form https://login.microsoftonline.com/\{Enter_the_Tenant_Info_Here\}.
   * - If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
   * - If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
   * - If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
   * - To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
   *
   * Azure B2C authorities are of the form https://\{instance\}/\{tenant\}/\{policy\}. Each policy is considered
   * its own authority. You will have to set the all of the knownAuthorities at the time of the client application
   * construction.
   *
   * ADFS authorities are of the form https://\{instance\}/adfs.
   */
  constructor(configuration) {
    super(configuration);
    if (this.config.broker.nativeBrokerPlugin) {
      if (this.config.broker.nativeBrokerPlugin.isBrokerAvailable) {
        this.nativeBrokerPlugin = this.config.broker.nativeBrokerPlugin;
        this.nativeBrokerPlugin.setLogger(this.config.system.loggerOptions);
      } else {
        this.logger.warning("NativeBroker implementation was provided but the broker is unavailable.", "");
      }
    }
    this.skus = ServerTelemetryManager.makeExtraSkuString({
      libraryName: Constants.MSAL_SKU,
      libraryVersion: version2
    });
  }
  /**
   * Acquires a token from the authority using OAuth2.0 device code flow.
   * This flow is designed for devices that do not have access to a browser or have input constraints.
   * The authorization server issues a DeviceCode object with a verification code, an end-user code,
   * and the end-user verification URI. The DeviceCode object is provided through a callback, and the end-user should be
   * instructed to use another device to navigate to the verification URI to input credentials.
   * Since the client cannot receive incoming requests, it polls the authorization server repeatedly
   * until the end-user completes input of credentials.
   */
  async acquireTokenByDeviceCode(request) {
    this.logger.info("acquireTokenByDeviceCode called", request.correlationId || "");
    enforceResourceParameter(this.config.auth.isMcp, request);
    const validRequest = Object.assign(request, await this.initializeBaseRequest(request));
    const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByDeviceCode, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
      const deviceCodeConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager);
      const deviceCodeClient = new DeviceCodeClient(deviceCodeConfig);
      this.logger.verbose("Device code client created", validRequest.correlationId);
      return await deviceCodeClient.acquireToken(validRequest);
    } catch (e) {
      if (e instanceof AuthError) {
        e.correlationId = validRequest.correlationId;
      }
      serverTelemetryManager.cacheFailedRequest(e);
      throw e;
    }
  }
  /**
   * Acquires a token interactively via the browser by requesting an authorization code then exchanging it for a token.
   */
  async acquireTokenInteractive(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    this.logger.trace("acquireTokenInteractive called", correlationId);
    enforceResourceParameter(this.config.auth.isMcp, request);
    const { openBrowser, successTemplate, errorTemplate, windowHandle, preferredPort, ...remainingProperties } = request;
    if (this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...remainingProperties,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || Constants_exports.OIDC_DEFAULT_SCOPES,
        redirectUri: request.redirectUri || "",
        authority: request.authority || this.config.auth.authority,
        correlationId,
        extraParameters: {
          ...remainingProperties.extraQueryParameters,
          ...remainingProperties.extraParameters,
          [AADServerParamKeys_exports.X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: remainingProperties.account?.nativeAccountId
      };
      return this.nativeBrokerPlugin.acquireTokenInteractive(brokerRequest, windowHandle);
    }
    if (request.redirectUri) {
      if (!this.config.broker.nativeBrokerPlugin) {
        throw NodeAuthError.createRedirectUriNotSupportedError(correlationId);
      }
      request.redirectUri = "";
    }
    const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();
    const loopbackClient = new LoopbackClient(preferredPort);
    const responseMode = remainingProperties.responseMode ?? Constants_exports.ResponseMode.FORM_POST;
    if (responseMode !== Constants_exports.ResponseMode.QUERY && responseMode !== Constants_exports.ResponseMode.FORM_POST) {
      throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.invalidResponseMode, correlationId);
    }
    let authCodeResponse = {};
    let authCodeListenerError = null;
    try {
      const authCodeListener = loopbackClient.listenForAuthCode(successTemplate, errorTemplate).then((response) => {
        authCodeResponse = response;
      }).catch((e) => {
        authCodeListenerError = e;
      });
      const redirectUri = await this.waitForRedirectUri(loopbackClient, correlationId);
      const validRequest = {
        ...remainingProperties,
        correlationId,
        scopes: request.scopes || Constants_exports.OIDC_DEFAULT_SCOPES,
        redirectUri,
        responseMode,
        codeChallenge: challenge,
        codeChallengeMethod: Constants_exports.CodeChallengeMethodValues.S256
      };
      const authCodeUrl = await this.getAuthCodeUrl(validRequest);
      await openBrowser(authCodeUrl);
      await authCodeListener;
      if (authCodeListenerError) {
        throw authCodeListenerError;
      }
      if (authCodeResponse.error) {
        throw new ServerError(authCodeResponse.error, correlationId, authCodeResponse.error_description, authCodeResponse.suberror);
      } else if (!authCodeResponse.code) {
        throw NodeAuthError.createNoAuthCodeInResponseError(correlationId);
      }
      const clientInfo = authCodeResponse.client_info;
      const tokenRequest = {
        code: authCodeResponse.code,
        codeVerifier: verifier,
        clientInfo: clientInfo || "",
        ...validRequest
      };
      return await this.acquireTokenByCode(tokenRequest);
    } finally {
      loopbackClient.closeServer();
    }
  }
  /**
   * Returns a token retrieved either from the cache or by exchanging the refresh token for a fresh access token. If brokering is enabled the token request will be serviced by the broker.
   * @param request - developer provided SilentFlowRequest
   * @returns
   */
  async acquireTokenSilent(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    this.logger.trace("acquireTokenSilent called", correlationId);
    enforceResourceParameter(this.config.auth.isMcp, request);
    if (this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...request,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || Constants_exports.OIDC_DEFAULT_SCOPES,
        redirectUri: request.redirectUri || "",
        authority: request.authority || this.config.auth.authority,
        correlationId,
        extraParameters: {
          ...request.extraQueryParameters,
          ...request.extraParameters,
          [AADServerParamKeys_exports.X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: request.account.nativeAccountId,
        forceRefresh: request.forceRefresh || false
      };
      return this.nativeBrokerPlugin.acquireTokenSilent(brokerRequest);
    }
    if (request.redirectUri) {
      if (!this.config.broker.nativeBrokerPlugin) {
        throw NodeAuthError.createRedirectUriNotSupportedError(correlationId);
      }
      request.redirectUri = "";
    }
    return super.acquireTokenSilent(request);
  }
  /**
   * Acquires a token by exchanging the authorization code received from the first step of OAuth 2.0 Authorization Code Flow.
   * In MCP mode, a resource parameter is required on the request.
   */
  async acquireTokenByCode(request, authCodePayLoad) {
    enforceResourceParameter(this.config.auth.isMcp, request);
    return super.acquireTokenByCode(request, authCodePayLoad);
  }
  /**
   * Acquires a token by exchanging the refresh token provided for a new set of tokens.
   * In MCP mode, a resource parameter is required on the request.
   */
  async acquireTokenByRefreshToken(request) {
    enforceResourceParameter(this.config.auth.isMcp, request);
    return super.acquireTokenByRefreshToken(request);
  }
  /**
   * Removes cache artifacts associated with the given account
   * @param request - developer provided SignOutRequest
   * @returns
   */
  async signOut(request) {
    if (this.nativeBrokerPlugin && request.account.nativeAccountId) {
      const signoutRequest = {
        clientId: this.config.auth.clientId,
        accountId: request.account.nativeAccountId,
        correlationId: request.correlationId || this.cryptoProvider.createNewGuid()
      };
      await this.nativeBrokerPlugin.signOut(signoutRequest);
    }
    await this.getTokenCache().removeAccount(request.account, request.correlationId);
  }
  /**
   * Returns all cached accounts for this application. If brokering is enabled this request will be serviced by the broker.
   * @returns
   */
  async getAllAccounts() {
    if (this.nativeBrokerPlugin) {
      const correlationId = this.cryptoProvider.createNewGuid();
      return this.nativeBrokerPlugin.getAllAccounts(this.config.auth.clientId, correlationId);
    }
    return this.getTokenCache().getAllAccounts();
  }
  /**
   * Attempts to retrieve the redirectUri from the loopback server. If the loopback server does not start listening for requests within the timeout this will throw.
   * @param loopbackClient - built-in loopback server implementation
   * @param correlationId - correlation id of the request
   * @returns
   */
  async waitForRedirectUri(loopbackClient, correlationId) {
    return new Promise((resolve6, reject) => {
      let ticks = 0;
      const id = setInterval(() => {
        if (LOOPBACK_SERVER_CONSTANTS.TIMEOUT_MS / LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS < ticks) {
          clearInterval(id);
          reject(NodeAuthError.createLoopbackServerTimeoutError(correlationId));
          return;
        }
        try {
          const r = loopbackClient.getRedirectUri();
          clearInterval(id);
          resolve6(r);
          return;
        } catch (e) {
          if (e instanceof AuthError && e.errorCode === NodeAuthErrorMessage.noLoopbackServerExists.code) {
            ticks++;
            return;
          }
          clearInterval(id);
          reject(e);
          return;
        }
      }, LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS);
    });
  }
};

// node_modules/@azure/msal-node/dist/utils/TimeUtils.mjs
function isIso8601(dateString) {
  if (typeof dateString !== "string") {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

// node_modules/@azure/msal-node/dist/network/HttpClientWithRetries.mjs
var HttpClientWithRetries = class {
  constructor(httpClientNoRetries, retryPolicy, logger) {
    this.httpClientNoRetries = httpClientNoRetries;
    this.retryPolicy = retryPolicy;
    this.logger = logger;
  }
  async sendNetworkRequestAsyncHelper(httpMethod, url, options) {
    if (httpMethod === HttpMethod2.GET) {
      return this.httpClientNoRetries.sendGetRequestAsync(url, options);
    } else {
      return this.httpClientNoRetries.sendPostRequestAsync(url, options);
    }
  }
  async sendNetworkRequestAsync(httpMethod, url, options) {
    let response = await this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
    if ("isNewRequest" in this.retryPolicy) {
      this.retryPolicy.isNewRequest = true;
    }
    let currentRetry = 0;
    while (await this.retryPolicy.pauseForRetry(response.status, currentRetry, this.logger, response.headers[Constants_exports.HeaderNames.RETRY_AFTER])) {
      response = await this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
      currentRetry++;
    }
    return response;
  }
  async sendGetRequestAsync(url, options) {
    return this.sendNetworkRequestAsync(HttpMethod2.GET, url, options);
  }
  async sendPostRequestAsync(url, options) {
    return this.sendNetworkRequestAsync(HttpMethod2.POST, url, options);
  }
};

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/BaseManagedIdentitySource.mjs
var ManagedIdentityUserAssignedIdQueryParameterNames = {
  MANAGED_IDENTITY_CLIENT_ID_2017: "clientid",
  MANAGED_IDENTITY_CLIENT_ID: "client_id",
  MANAGED_IDENTITY_OBJECT_ID: "object_id",
  MANAGED_IDENTITY_RESOURCE_ID_IMDS: "msi_res_id",
  MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS: "mi_res_id"
};
var BaseManagedIdentitySource = class {
  /**
   * Creates an instance of BaseManagedIdentitySource.
   *
   * @param logger - Logger instance for diagnostic information
   * @param nodeStorage - Storage interface for caching tokens
   * @param networkClient - Network client for making HTTP requests
   * @param cryptoProvider - Cryptographic provider for token operations
   * @param disableInternalRetries - Whether to disable automatic retry logic
   */
  constructor(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) {
    this.logger = logger;
    this.nodeStorage = nodeStorage;
    this.networkClient = networkClient;
    this.cryptoProvider = cryptoProvider;
    this.disableInternalRetries = disableInternalRetries;
  }
  /**
   * Generates a new correlation ID for request tracing.
   *
   * @returns A new GUID string for use as a correlation or request ID
   */
  createCorrelationId() {
    return this.cryptoProvider.createNewGuid();
  }
  /**
   * Processes the network response and converts it to a standardized server token response.
   * This async version allows for source-specific response processing logic while maintaining
   * backward compatibility with the synchronous version.
   *
   * @param response - The network response containing the managed identity token
   * @param _networkClient - Network client used for the request (unused in base implementation)
   * @param _networkRequest - The original network request parameters (unused in base implementation)
   * @param _networkRequestOptions - The network request options (unused in base implementation)
   *
   * @returns Promise resolving to a standardized server authorization token response
   */
  async getServerTokenResponseAsync(response, _networkClient, _networkRequest, _networkRequestOptions) {
    return this.getServerTokenResponse(response);
  }
  /**
   * Converts a managed identity token response to a standardized server authorization token response.
   * Handles time format conversion, expiration calculation, and error mapping to ensure
   * compatibility with the MSAL response handling pipeline.
   *
   * @param response - The network response containing the managed identity token
   *
   * @returns Standardized server authorization token response with normalized fields
   */
  getServerTokenResponse(response) {
    let refreshIn, expiresIn;
    if (response.body.expires_on) {
      if (isIso8601(response.body.expires_on)) {
        response.body.expires_on = new Date(response.body.expires_on).getTime() / 1e3;
      }
      expiresIn = response.body.expires_on - TimeUtils_exports.nowSeconds();
      if (expiresIn > 2 * 3600) {
        refreshIn = expiresIn / 2;
      }
    }
    const serverTokenResponse = {
      status: response.status,
      // success
      access_token: response.body.access_token,
      expires_in: expiresIn,
      scope: response.body.resource,
      token_type: response.body.token_type,
      refresh_in: refreshIn,
      // error
      correlation_id: response.body.correlation_id || response.body.correlationId,
      error: typeof response.body.error === "string" ? response.body.error : response.body.error?.code,
      error_description: response.body.message || (typeof response.body.error === "string" ? response.body.error_description : response.body.error?.message),
      error_codes: response.body.error_codes,
      timestamp: response.body.timestamp,
      trace_id: response.body.trace_id
    };
    return serverTokenResponse;
  }
  /**
   * Acquires an access token using the managed identity endpoint for the specified resource.
   * This is the primary method for token acquisition, handling the complete flow from
   * request creation through response processing and token caching.
   *
   * @param managedIdentityRequest - The managed identity request containing resource and optional parameters
   * @param managedIdentityId - The managed identity configuration (system or user-assigned)
   * @param fakeAuthority - Authority instance used for token caching (managed identity uses a placeholder authority)
   * @param refreshAccessToken - Whether this is a token refresh operation
   *
   * @returns Promise resolving to an authentication result containing the access token and metadata
   *
   * @throws {AuthError} When network requests fail or token validation fails
   * @throws {ClientAuthError} When network errors occur during the request
   */
  async acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
    const networkRequest = this.createRequest(managedIdentityRequest.resource, managedIdentityId);
    if (managedIdentityRequest.revokedTokenSha256Hash) {
      this.logger.info(`[Managed Identity] The following claims are present in the request: ${managedIdentityRequest.claims}`, "");
      networkRequest.queryParameters[ManagedIdentityQueryParameters.SHA256_TOKEN_TO_REFRESH] = managedIdentityRequest.revokedTokenSha256Hash;
    }
    if (managedIdentityRequest.clientCapabilities?.length) {
      const clientCapabilities = managedIdentityRequest.clientCapabilities.toString();
      this.logger.info(`[Managed Identity] The following client capabilities are present in the request: ${clientCapabilities}`, "");
      networkRequest.queryParameters[ManagedIdentityQueryParameters.XMS_CC] = clientCapabilities;
    }
    const headers = networkRequest.headers;
    headers[Constants_exports.HeaderNames.CONTENT_TYPE] = Constants_exports.URL_FORM_CONTENT_TYPE;
    const networkRequestOptions = { headers };
    if (Object.keys(networkRequest.bodyParameters).length) {
      networkRequestOptions.body = networkRequest.computeParametersBodyString();
    }
    const networkClientHelper = this.disableInternalRetries ? this.networkClient : new HttpClientWithRetries(this.networkClient, networkRequest.retryPolicy, this.logger);
    const reqTimestamp = TimeUtils_exports.nowSeconds();
    let response;
    try {
      if (networkRequest.httpMethod === HttpMethod2.POST) {
        response = await networkClientHelper.sendPostRequestAsync(networkRequest.computeUri(), networkRequestOptions);
      } else {
        response = await networkClientHelper.sendGetRequestAsync(networkRequest.computeUri(), networkRequestOptions);
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      } else {
        throw createClientAuthError(ClientAuthErrorCodes_exports.networkError, managedIdentityRequest.correlationId);
      }
    }
    const responseHandler = new ResponseHandler(managedIdentityId.id, this.nodeStorage, this.cryptoProvider, this.logger, new StubPerformanceClient(), null, null);
    const serverTokenResponse = await this.getServerTokenResponseAsync(response, networkClientHelper, networkRequest, networkRequestOptions);
    responseHandler.validateTokenResponse(serverTokenResponse, serverTokenResponse.correlation_id || "", refreshAccessToken);
    return responseHandler.handleServerTokenResponse(serverTokenResponse, fakeAuthority, reqTimestamp, managedIdentityRequest, ApiId.acquireTokenWithManagedIdentity);
  }
  /**
   * Determines the appropriate query parameter name for user-assigned managed identity
   * based on the identity type, API version, and endpoint characteristics.
   * Different Azure services and API versions use different parameter names for the same identity types.
   *
   * @param managedIdentityIdType - The type of user-assigned managed identity (client ID, object ID, or resource ID)
   * @param isImds - Whether the request is being made to the IMDS (Instance Metadata Service) endpoint
   * @param usesApi2017 - Whether the endpoint uses the 2017-09-01 API version (affects client ID parameter name)
   *
   * @returns The correct query parameter name for the specified identity type and endpoint
   *
   * @throws {ManagedIdentityError} When an invalid managed identity ID type is provided
   */
  getManagedIdentityUserAssignedIdQueryParameterKey(managedIdentityIdType, isImds, usesApi2017) {
    switch (managedIdentityIdType) {
      case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
        this.logger.info(`[Managed Identity] [API version ${usesApi2017 ? "2017+" : "2019+"}] Adding user assigned client id to the request.`, "");
        return usesApi2017 ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID_2017 : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;
      case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
        this.logger.info("[Managed Identity] Adding user assigned resource id to the request.", "");
        return isImds ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS;
      case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
        this.logger.info("[Managed Identity] Adding user assigned object id to the request.", "");
        return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
      default:
        throw createManagedIdentityError(invalidManagedIdentityIdType, "");
    }
  }
};
BaseManagedIdentitySource.getValidatedEnvVariableUrlString = (envVariableStringName, envVariable, sourceName, logger) => {
  try {
    return new UrlString(envVariable, "").urlString;
  } catch (error) {
    logger.info(`[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`, "");
    throw createManagedIdentityError(MsiEnvironmentVariableUrlMalformedErrorCodes[envVariableStringName], "");
  }
};

// node_modules/@azure/msal-node/dist/retry/DefaultManagedIdentityRetryPolicy.mjs
var DEFAULT_MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON = [
  Constants_exports.HTTP_NOT_FOUND,
  Constants_exports.HTTP_REQUEST_TIMEOUT,
  Constants_exports.HTTP_TOO_MANY_REQUESTS,
  Constants_exports.HTTP_SERVER_ERROR,
  Constants_exports.HTTP_SERVICE_UNAVAILABLE,
  Constants_exports.HTTP_GATEWAY_TIMEOUT
];

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/AzureArc.mjs
var SUPPORTED_AZURE_ARC_PLATFORMS = {
  win32: `${process.env["ProgramData"]}\\AzureConnectedMachineAgent\\Tokens\\`,
  linux: "/var/opt/azcmagent/tokens/"
};
var AZURE_ARC_FILE_DETECTION = {
  win32: `${process.env["ProgramFiles"]}\\AzureConnectedMachineAgent\\himds.exe`,
  linux: "/opt/azcmagent/bin/himds"
};

// node_modules/@azure/msal-node/dist/retry/ImdsRetryPolicy.mjs
var HTTP_STATUS_400_CODES_FOR_EXPONENTIAL_STRATEGY = [
  Constants_exports.HTTP_NOT_FOUND,
  Constants_exports.HTTP_REQUEST_TIMEOUT,
  Constants_exports.HTTP_GONE,
  Constants_exports.HTTP_TOO_MANY_REQUESTS
];
var HTTP_STATUS_GONE_RETRY_AFTER_MS = 10 * 1e3;

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/Imds.mjs
var IMDS_TOKEN_PATH = "/metadata/identity/oauth2/token";
var DEFAULT_IMDS_ENDPOINT = `http://169.254.169.254${IMDS_TOKEN_PATH}`;

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/MachineLearning.mjs
var MANAGED_IDENTITY_MACHINE_LEARNING_UNSUPPORTED_ID_TYPE_ERROR = `Only client id is supported for user-assigned managed identity in ${ManagedIdentitySourceNames.MACHINE_LEARNING}.`;

// node_modules/@azure/msal-node/dist/client/ManagedIdentityApplication.mjs
var SOURCES_THAT_SUPPORT_TOKEN_REVOCATION = [ManagedIdentitySourceNames.SERVICE_FABRIC];

// node_modules/@azure/msal-node/dist/index.mjs
var PromptValue2 = Constants_exports.PromptValue;
var ResponseMode2 = Constants_exports.ResponseMode;

// node_modules/open/index.js
import process10 from "node:process";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import childProcess4 from "node:child_process";
import fs5, { constants as fsConstants2 } from "node:fs/promises";

// node_modules/wsl-utils/index.js
import path from "node:path";
import { promisify as promisify2 } from "node:util";
import childProcess2 from "node:child_process";
import fs4, { constants as fsConstants } from "node:fs/promises";

// node_modules/is-wsl/index.js
import process2 from "node:process";
import os from "node:os";
import fs3 from "node:fs";

// node_modules/is-inside-container/index.js
import fs2 from "node:fs";

// node_modules/is-docker/index.js
import fs from "node:fs";
var isDockerCached;
function hasDockerEnv() {
  try {
    fs.statSync("/.dockerenv");
    return true;
  } catch {
    return false;
  }
}
function hasDockerCGroup() {
  try {
    return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
  } catch {
    return false;
  }
}
function isDocker() {
  if (isDockerCached === void 0) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup();
  }
  return isDockerCached;
}

// node_modules/is-inside-container/index.js
var cachedResult;
var hasContainerEnv = () => {
  try {
    fs2.statSync("/run/.containerenv");
    return true;
  } catch {
    return false;
  }
};
function isInsideContainer() {
  if (cachedResult === void 0) {
    cachedResult = hasContainerEnv() || isDocker();
  }
  return cachedResult;
}

// node_modules/is-wsl/index.js
var isWsl = () => {
  if (process2.platform !== "linux") {
    return false;
  }
  if (os.release().toLowerCase().includes("microsoft")) {
    if (isInsideContainer()) {
      return false;
    }
    return true;
  }
  try {
    if (fs3.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft")) {
      return !isInsideContainer();
    }
  } catch {
  }
  if (fs3.existsSync("/proc/sys/fs/binfmt_misc/WSLInterop") || fs3.existsSync("/run/WSL")) {
    return !isInsideContainer();
  }
  return false;
};
var is_wsl_default = process2.env.__IS_WSL_TEST__ ? isWsl : isWsl();

// node_modules/wsl-utils/node_modules/powershell-utils/index.js
import process3 from "node:process";
import { Buffer as Buffer2 } from "node:buffer";
import { promisify } from "node:util";
import childProcess from "node:child_process";
var execFile = promisify(childProcess.execFile);
var powerShellPath = () => `${process3.env.SYSTEMROOT || process3.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
var executePowerShell = async (command, options = {}) => {
  const {
    powerShellPath: psPath,
    ...execFileOptions
  } = options;
  const encodedCommand = executePowerShell.encodeCommand(command);
  return execFile(
    psPath ?? powerShellPath(),
    [
      ...executePowerShell.argumentsPrefix,
      encodedCommand
    ],
    {
      encoding: "utf8",
      ...execFileOptions
    }
  );
};
executePowerShell.argumentsPrefix = [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-EncodedCommand"
];
executePowerShell.encodeCommand = (command) => Buffer2.from(command, "utf16le").toString("base64");
executePowerShell.escapeArgument = (value) => `'${String(value).replaceAll("'", "''")}'`;

// node_modules/wsl-utils/utilities.js
function parseMountPointFromConfig(content) {
  for (const line of content.split("\n")) {
    if (/^\s*#/.test(line)) {
      continue;
    }
    const match = /^\s*root\s*=\s*(?<mountPoint>"[^"]*"|'[^']*'|[^#]*)/.exec(line);
    if (!match) {
      continue;
    }
    return match.groups.mountPoint.trim().replaceAll(/^["']|["']$/g, "");
  }
}

// node_modules/wsl-utils/index.js
var execFile2 = promisify2(childProcess2.execFile);
var wslDrivesMountPoint = /* @__PURE__ */ (() => {
  const defaultMountPoint = "/mnt/";
  let mountPoint;
  return async function() {
    if (mountPoint) {
      return mountPoint;
    }
    const configFilePath = "/etc/wsl.conf";
    let isConfigFileExists = false;
    try {
      await fs4.access(configFilePath, fsConstants.F_OK);
      isConfigFileExists = true;
    } catch {
    }
    if (!isConfigFileExists) {
      return defaultMountPoint;
    }
    const configContent = await fs4.readFile(configFilePath, { encoding: "utf8" });
    const parsedMountPoint = parseMountPointFromConfig(configContent);
    if (parsedMountPoint === void 0) {
      return defaultMountPoint;
    }
    mountPoint = parsedMountPoint;
    mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
    return mountPoint;
  };
})();
var powerShellPathFromWsl = async () => {
  const mountPoint = await wslDrivesMountPoint();
  return `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
};
var powerShellPath2 = is_wsl_default ? powerShellPathFromWsl : powerShellPath;
var canAccessPowerShellPromise;
var canAccessPowerShell = async () => {
  canAccessPowerShellPromise ??= (async () => {
    try {
      const psPath = await powerShellPath2();
      await fs4.access(psPath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  })();
  return canAccessPowerShellPromise;
};
var wslDefaultBrowser = async () => {
  const psPath = await powerShellPath2();
  const command = String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`;
  const { stdout } = await executePowerShell(command, {
    powerShellPath: psPath,
    cwd: path.dirname(psPath)
  });
  return stdout.trim();
};
var isUrl = (path3) => /^[a-z]+:\/\//i.test(path3);
var convertWslPathToWindows = async (paths) => {
  const isBatch = Array.isArray(paths);
  const pathArray = isBatch ? paths : [paths];
  const indicesToConvert = [];
  const pathsToConvert = [];
  for (const [index, path3] of pathArray.entries()) {
    if (!isUrl(path3)) {
      indicesToConvert.push(index);
      pathsToConvert.push(path3);
    }
  }
  const results = [...pathArray];
  if (pathsToConvert.length > 0) {
    try {
      const { stdout } = await execFile2("wslpath", ["-aw", ...pathsToConvert], { encoding: "utf8" });
      const convertedPaths = stdout.split(/\r?\n/).filter(Boolean);
      for (const [index, originalIndex] of indicesToConvert.entries()) {
        results[originalIndex] = convertedPaths[index] ?? pathArray[originalIndex];
      }
    } catch {
    }
  }
  return isBatch ? results : results[0];
};

// node_modules/powershell-utils/index.js
import process4 from "node:process";
import { Buffer as Buffer3 } from "node:buffer";
import { promisify as promisify3 } from "node:util";
import childProcess3 from "node:child_process";
var execFile3 = promisify3(childProcess3.execFile);
var powerShellPath3 = () => `${process4.env.SYSTEMROOT || process4.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
var argumentsPrefix = [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-EncodedCommand"
];
var encodeCommand = (command) => Buffer3.from(command, "utf16le").toString("base64");
var escapeArgument = (value) => `'${String(value).replaceAll(/['‘’‚‛]/g, (match) => match + match)}'`;
var createArguments = (command) => [...argumentsPrefix, encodeCommand(command)];
var createExecFileOptions = (options) => ({
  encoding: "utf8",
  ...options,
  shell: false
});
var executePowerShell2 = async (command, options = {}) => {
  const {
    powerShellPath: psPath,
    ...execFileOptions
  } = options;
  return execFile3(
    psPath ?? powerShellPath3(),
    createArguments(command),
    createExecFileOptions(execFileOptions)
  );
};
executePowerShell2.argumentsPrefix = argumentsPrefix;
executePowerShell2.encodeCommand = encodeCommand;
executePowerShell2.escapeArgument = escapeArgument;
executePowerShell2.createArguments = createArguments;

// node_modules/define-lazy-prop/index.js
function defineLazyProperty(object3, propertyName, valueGetter) {
  const define = (value) => Object.defineProperty(object3, propertyName, { value, enumerable: true, writable: true });
  Object.defineProperty(object3, propertyName, {
    configurable: true,
    enumerable: true,
    get() {
      const result = valueGetter();
      define(result);
      return result;
    },
    set(value) {
      define(value);
    }
  });
  return object3;
}

// node_modules/default-browser/index.js
import { promisify as promisify7 } from "node:util";
import process8 from "node:process";
import { execFile as execFile7 } from "node:child_process";

// node_modules/default-browser-id/index.js
import { promisify as promisify4 } from "node:util";
import process5 from "node:process";
import { execFile as execFile4 } from "node:child_process";
var execFileAsync = promisify4(execFile4);
async function defaultBrowserId() {
  if (process5.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const { stdout } = await execFileAsync("defaults", ["read", "com.apple.LaunchServices/com.apple.launchservices.secure", "LSHandlers"]);
  const match = /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout);
  const browserId = match?.groups.id ?? "com.apple.Safari";
  if (browserId === "com.apple.safari") {
    return "com.apple.Safari";
  }
  return browserId;
}

// node_modules/run-applescript/index.js
import process6 from "node:process";
import { promisify as promisify5 } from "node:util";
import { execFile as execFile5, execFileSync } from "node:child_process";
var execFileAsync2 = promisify5(execFile5);
async function runAppleScript(script, { humanReadableOutput = true, signal } = {}) {
  if (process6.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const outputArguments = humanReadableOutput ? [] : ["-ss"];
  const execOptions = {};
  if (signal) {
    execOptions.signal = signal;
  }
  const { stdout } = await execFileAsync2("osascript", ["-e", script, outputArguments], execOptions);
  return stdout.trim();
}

// node_modules/bundle-name/index.js
async function bundleName(bundleId) {
  return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}

// node_modules/default-browser/windows.js
import process7 from "node:process";
import { promisify as promisify6 } from "node:util";
import { execFile as execFile6 } from "node:child_process";
var execFileAsync3 = promisify6(execFile6);
var windowsBrowserProgIds = {
  MSEdgeHTM: { name: "Edge", id: "com.microsoft.edge" },
  // The missing `L` is correct.
  MSEdgeBHTML: { name: "Edge Beta", id: "com.microsoft.edge.beta" },
  MSEdgeDHTML: { name: "Edge Dev", id: "com.microsoft.edge.dev" },
  AppXq0fevzme2pys62n3e0fbqa7peapykr8v: { name: "Edge", id: "com.microsoft.edge.old" },
  ChromeHTML: { name: "Chrome", id: "com.google.chrome" },
  ChromeBHTML: { name: "Chrome Beta", id: "com.google.chrome.beta" },
  ChromeDHTML: { name: "Chrome Dev", id: "com.google.chrome.dev" },
  ChromiumHTM: { name: "Chromium", id: "org.chromium.Chromium" },
  BraveHTML: { name: "Brave", id: "com.brave.Browser" },
  BraveBHTML: { name: "Brave Beta", id: "com.brave.Browser.beta" },
  BraveDHTML: { name: "Brave Dev", id: "com.brave.Browser.dev" },
  BraveSSHTM: { name: "Brave Nightly", id: "com.brave.Browser.nightly" },
  FirefoxURL: { name: "Firefox", id: "org.mozilla.firefox" },
  OperaStable: { name: "Opera", id: "com.operasoftware.Opera" },
  VivaldiHTM: { name: "Vivaldi", id: "com.vivaldi.Vivaldi" },
  "IE.HTTP": { name: "Internet Explorer", id: "com.microsoft.ie" }
};
var _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));
var UnknownBrowserError = class extends Error {
};
async function defaultBrowser(_execFileAsync = execFileAsync3) {
  const regPath = `${process7.env.SYSTEMROOT ?? process7.env.windir ?? "C:\\Windows"}\\System32\\reg.exe`;
  const { stdout } = await _execFileAsync(regPath, [
    "QUERY",
    " HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
    "/v",
    "ProgId"
  ]);
  const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout);
  if (!match) {
    throw new UnknownBrowserError(`Cannot find Windows browser in stdout: ${JSON.stringify(stdout)}`);
  }
  const { id } = match.groups;
  const dotIndex = id.lastIndexOf(".");
  const hyphenIndex = id.lastIndexOf("-");
  const baseIdByDot = dotIndex === -1 ? void 0 : id.slice(0, dotIndex);
  const baseIdByHyphen = hyphenIndex === -1 ? void 0 : id.slice(0, hyphenIndex);
  return windowsBrowserProgIds[id] ?? windowsBrowserProgIds[baseIdByDot] ?? windowsBrowserProgIds[baseIdByHyphen] ?? { name: id, id };
}

// node_modules/default-browser/index.js
var execFileAsync4 = promisify7(execFile7);
var titleize = (string) => string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
async function defaultBrowser2() {
  if (process8.platform === "darwin") {
    const id = await defaultBrowserId();
    const name3 = await bundleName(id);
    return { name: name3, id };
  }
  if (process8.platform === "linux") {
    const { stdout } = await execFileAsync4("xdg-mime", ["query", "default", "x-scheme-handler/http"]);
    const id = stdout.trim();
    const name3 = titleize(id.replace(/.desktop$/, "").replace("-", " "));
    return { name: name3, id };
  }
  if (process8.platform === "win32") {
    return defaultBrowser();
  }
  throw new Error("Only macOS, Linux, and Windows are supported");
}

// node_modules/is-in-ssh/index.js
import process9 from "node:process";
var isInSsh = Boolean(process9.env.SSH_CONNECTION || process9.env.SSH_CLIENT || process9.env.SSH_TTY);
var is_in_ssh_default = isInSsh;

// node_modules/open/index.js
var fallbackAttemptSymbol = /* @__PURE__ */ Symbol("fallbackAttempt");
var __dirname = import.meta.url ? path2.dirname(fileURLToPath(import.meta.url)) : "";
var localXdgOpenPath = path2.join(__dirname, "xdg-open");
var { platform, arch } = process10;
var tryEachApp = async (apps2, opener) => {
  if (apps2.length === 0) {
    return;
  }
  const errors = [];
  for (const app of apps2) {
    try {
      return await opener(app);
    } catch (error) {
      errors.push(error);
    }
  }
  throw new AggregateError(errors, "Failed to open in all supported apps");
};
var baseOpen = async (options) => {
  options = {
    wait: false,
    background: false,
    newInstance: false,
    allowNonzeroExitCode: false,
    ...options
  };
  const isFallbackAttempt = options[fallbackAttemptSymbol] === true;
  delete options[fallbackAttemptSymbol];
  if (Array.isArray(options.app)) {
    return tryEachApp(options.app, (singleApp) => baseOpen({
      ...options,
      app: singleApp,
      [fallbackAttemptSymbol]: true
    }));
  }
  let { name: app, arguments: appArguments = [] } = options.app ?? {};
  appArguments = [...appArguments];
  if (Array.isArray(app)) {
    return tryEachApp(app, (appName) => baseOpen({
      ...options,
      app: {
        name: appName,
        arguments: appArguments
      },
      [fallbackAttemptSymbol]: true
    }));
  }
  if (app === "browser" || app === "browserPrivate") {
    const ids = {
      "com.google.chrome": "chrome",
      "google-chrome.desktop": "chrome",
      "com.brave.browser": "brave",
      "org.mozilla.firefox": "firefox",
      "firefox.desktop": "firefox",
      "com.microsoft.msedge": "edge",
      "com.microsoft.edge": "edge",
      "com.microsoft.edgemac": "edge",
      "microsoft-edge.desktop": "edge",
      "com.apple.safari": "safari"
    };
    const flags = {
      chrome: "--incognito",
      brave: "--incognito",
      firefox: "--private-window",
      edge: "--inPrivate"
      // Safari doesn't support private mode via command line
    };
    let browser;
    if (is_wsl_default) {
      const progId = await wslDefaultBrowser();
      const browserInfo = _windowsBrowserProgIdMap.get(progId);
      browser = browserInfo ?? {};
    } else {
      browser = await defaultBrowser2();
    }
    if (Object.hasOwn(ids, browser.id)) {
      const browserName = ids[browser.id.toLowerCase()];
      if (browserName === void 0) {
        throw new Error(`${browser.name} is not supported as a default browser`);
      }
      if (app === "browserPrivate") {
        if (browserName === "safari") {
          throw new Error("Safari doesn't support opening in private mode via command line");
        }
        appArguments.push(flags[browserName]);
      }
      return baseOpen({
        ...options,
        app: {
          name: apps[browserName],
          arguments: appArguments
        }
      });
    }
    throw new Error(`${browser.name} is not supported as a default browser`);
  }
  let command;
  const cliArguments = [];
  const childProcessOptions = {};
  let shouldUseWindowsInWsl = false;
  if (is_wsl_default && !isInsideContainer() && !is_in_ssh_default && !app) {
    shouldUseWindowsInWsl = await canAccessPowerShell();
  }
  if (platform === "darwin") {
    command = "open";
    if (options.wait) {
      cliArguments.push("--wait-apps");
    }
    if (options.background) {
      cliArguments.push("--background");
    }
    if (options.newInstance) {
      cliArguments.push("--new");
    }
    if (app) {
      cliArguments.push("-a", app);
    }
  } else if (platform === "win32" || shouldUseWindowsInWsl) {
    command = await powerShellPath2();
    cliArguments.push(...executePowerShell2.argumentsPrefix);
    if (!is_wsl_default) {
      childProcessOptions.windowsVerbatimArguments = true;
    }
    if (is_wsl_default && options.target) {
      options.target = await convertWslPathToWindows(options.target);
    }
    const encodedArguments = ["$ProgressPreference = 'SilentlyContinue';", "Start"];
    if (options.wait) {
      encodedArguments.push("-Wait");
    }
    if (app) {
      encodedArguments.push(executePowerShell2.escapeArgument(app));
      if (options.target) {
        appArguments.push(options.target);
      }
    } else if (options.target) {
      encodedArguments.push(executePowerShell2.escapeArgument(options.target));
    }
    if (appArguments.length > 0) {
      appArguments = appArguments.map((argument) => executePowerShell2.escapeArgument(argument));
      encodedArguments.push("-ArgumentList", appArguments.join(","));
    }
    options.target = executePowerShell2.encodeCommand(encodedArguments.join(" "));
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
    }
    if (is_wsl_default) {
      childProcessOptions.cwd = path2.dirname(command);
    }
  } else {
    if (app) {
      command = app;
    } else {
      const isBundled = !__dirname || __dirname === "/";
      let exeLocalXdgOpen = false;
      try {
        await fs5.access(localXdgOpenPath, fsConstants2.X_OK);
        exeLocalXdgOpen = true;
      } catch {
      }
      const useSystemXdgOpen = process10.versions.electron ?? (platform === "android" || isBundled || !exeLocalXdgOpen);
      command = useSystemXdgOpen ? "xdg-open" : localXdgOpenPath;
    }
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
      childProcessOptions.detached = true;
    }
  }
  if (platform === "darwin" && appArguments.length > 0) {
    cliArguments.push("--args", ...appArguments);
  }
  if (options.target) {
    cliArguments.push(options.target);
  }
  const subprocess = childProcess4.spawn(command, cliArguments, childProcessOptions);
  if (options.wait) {
    return new Promise((resolve6, reject) => {
      subprocess.once("error", reject);
      subprocess.once("close", (exitCode) => {
        if (!options.allowNonzeroExitCode && exitCode !== 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }
        resolve6(subprocess);
      });
    });
  }
  if (isFallbackAttempt) {
    return new Promise((resolve6, reject) => {
      subprocess.once("error", reject);
      subprocess.once("spawn", () => {
        subprocess.once("close", (exitCode) => {
          subprocess.off("error", reject);
          if (exitCode !== 0) {
            reject(new Error(`Exited with code ${exitCode}`));
            return;
          }
          subprocess.unref();
          resolve6(subprocess);
        });
      });
    });
  }
  subprocess.unref();
  return new Promise((resolve6, reject) => {
    subprocess.once("error", reject);
    subprocess.once("spawn", () => {
      subprocess.off("error", reject);
      resolve6(subprocess);
    });
  });
};
var open3 = (target, options) => {
  if (typeof target !== "string") {
    throw new TypeError("Expected a `target`");
  }
  return baseOpen({
    ...options,
    target
  });
};
function detectArchBinary(binary) {
  if (typeof binary === "string" || Array.isArray(binary)) {
    return binary;
  }
  const { [arch]: archBinary } = binary;
  if (!archBinary) {
    throw new Error(`${arch} is not supported`);
  }
  return archBinary;
}
function detectPlatformBinary({ [platform]: platformBinary }, { wsl } = {}) {
  if (wsl && is_wsl_default) {
    return detectArchBinary(wsl);
  }
  if (!platformBinary) {
    throw new Error(`${platform} is not supported`);
  }
  return detectArchBinary(platformBinary);
}
var apps = {
  browser: "browser",
  browserPrivate: "browserPrivate"
};
defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
  darwin: "google chrome",
  win32: "chrome",
  // `chromium-browser` is the older deb package name used by Ubuntu/Debian before snap.
  linux: ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
  }
}));
defineLazyProperty(apps, "brave", () => detectPlatformBinary({
  darwin: "brave browser",
  win32: "brave",
  linux: ["brave-browser", "brave"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
    x64: ["/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe", "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"]
  }
}));
defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
  darwin: "firefox",
  win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
  linux: "firefox"
}, {
  wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe"
}));
defineLazyProperty(apps, "edge", () => detectPlatformBinary({
  darwin: "microsoft edge",
  win32: "msedge",
  linux: ["microsoft-edge", "microsoft-edge-dev"]
}, {
  wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
}));
defineLazyProperty(apps, "safari", () => detectPlatformBinary({
  darwin: "Safari"
}));
var open_default = open3;

// src/msal-client.ts
function createIdentityNetwork(signal, request = fetch) {
  async function send(target, method, options) {
    const url = new URL(target);
    if (url.origin !== "https://login.microsoftonline.com" || url.username || url.password || url.hash) {
      throw new RepositoryError("invalid_request");
    }
    if (signal.aborted) throw new RepositoryError("invalid_context");
    try {
      const response = await request(url, {
        method,
        headers: options?.headers,
        body: method === "POST" ? options?.body : void 0,
        redirect: "error",
        signal: AbortSignal.any([signal, AbortSignal.timeout(1e4)])
      });
      if (Number(response.headers.get("content-length")) > 1048576 || !response.body) throw new RepositoryError("upstream_unavailable");
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 1048576) {
            await reader.cancel();
            throw new RepositoryError("upstream_unavailable");
          }
          chunks.push(part.value);
        }
      } finally {
        reader.releaseLock();
      }
      if (signal.aborted) throw new RepositoryError("invalid_context");
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: JSON.parse(Buffer.concat(chunks).toString("utf8"))
      };
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(signal.aborted ? "invalid_context" : "upstream_unavailable");
    }
  }
  return {
    sendGetRequestAsync: (url, options) => send(url, "GET", options),
    sendPostRequestAsync: (url, options) => send(url, "POST", options)
  };
}
function createMsalClient(profile, signal) {
  const client = new PublicClientApplication({
    auth: { clientId: profile.clientId, authority: `https://login.microsoftonline.com/${profile.tenantId}` },
    system: {
      networkClient: createIdentityNetwork(signal),
      disableInternalRetries: true,
      loggerOptions: { piiLoggingEnabled: false, logLevel: LogLevel.Error, loggerCallback: () => void 0 }
    }
  });
  return {
    getAuthCodeUrl: (request) => client.getAuthCodeUrl(request),
    acquireTokenByCode: (request) => client.acquireTokenByCode(request),
    acquireTokenSilent: (request) => client.acquireTokenSilent(request),
    async clear() {
      const cache = client.getTokenCache();
      for (const account of await cache.getAllAccounts()) await cache.removeAccount(account);
    }
  };
}
function nativeAuthDependencies(onChange) {
  return {
    createClient: createMsalClient,
    generatePkce: () => new CryptoProvider().generatePkceCodes(),
    openBrowser: async (url) => {
      await open_default(url);
    },
    onChange
  };
}

// src/remote-review.ts
import { createHash as createHash6, randomBytes as randomBytes7 } from "node:crypto";
import { posix } from "node:path";
var ROOTS = ["/.specify", "/specs"];
var identity = (operation) => JSON.stringify([operation.access.tenantId, operation.access.accountId, operation.access.connectionId, operation.access.generation]);
function allowedArtifactPath(path3) {
  if (typeof path3 !== "string" || path3.length > 4096 || /[\p{Cc}\p{Cf}\\%?:#]/u.test(path3) || !ROOTS.some((root) => path3 === root || path3.startsWith(`${root}/`)) || path3.split("/").slice(1).some((segment2) => !segment2 || segment2 === "." || segment2 === "..")) throw new RepositoryError("invalid_request");
  return path3;
}
function decodeArtifact(bytes, encoding, binary = false) {
  if (binary) throw new RepositoryError("unsupported_file");
  if (bytes.length > 5242880) throw new RepositoryError("file_too_large");
  let label = "utf-8";
  let offset = 0;
  if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) offset = 3;
  else if (bytes[0] === 255 && bytes[1] === 254) {
    label = "utf-16le";
    offset = 2;
  } else if (bytes[0] === 254 && bytes[1] === 255) {
    label = "utf-16be";
    offset = 2;
  } else if (encoding !== void 0 && encoding !== null) {
    const metadata = String(encoding).trim().toLowerCase();
    if (["1200", "utf-16", "utf-16le", "unicode"].includes(metadata)) label = "utf-16le";
    else if (["1201", "utf-16be", "unicodefffe"].includes(metadata)) label = "utf-16be";
    else if (!["", "65001", "1252", "utf8", "utf-8"].includes(metadata)) throw new RepositoryError("unsupported_file");
  }
  let content;
  try {
    content = new TextDecoder(label, { fatal: true }).decode(bytes.subarray(offset));
  } catch {
    throw new RepositoryError("unsupported_file");
  }
  const sample = content.slice(0, 8192);
  const controls = [...sample].filter((character) => {
    const code = character.charCodeAt(0);
    return code < 9 || code > 13 && code < 32;
  }).length;
  if (content.includes("\0") || sample.length > 0 && controls / sample.length > 0.3) throw new RepositoryError("unsupported_file");
  if (Buffer.byteLength(content, "utf8") > 5242880) throw new RepositoryError("file_too_large");
  return content;
}
function createRemoteReview({ client, now = Date.now }) {
  const states = /* @__PURE__ */ new Map();
  const cursors = createContinuations({ now });
  async function use(contextId) {
    const state = states.get(contextId);
    if (!state || state.expiresAt <= now()) {
      states.delete(contextId);
      throw new RepositoryError("invalid_context");
    }
    const operation = await client.open();
    if (state.identity !== identity(operation)) {
      states.delete(contextId);
      throw new RepositoryError("invalid_context");
    }
    try {
      const repository = await client.repository(operation, state.context.repository.id);
      if (repository.operationalState !== "active") throw new RepositoryError("resource_unavailable");
    } catch (error) {
      if (error instanceof RepositoryError && error.code === "resource_unavailable") states.delete(contextId);
      throw error;
    }
    return { state, operation };
  }
  function asItem(state, raw) {
    const path3 = allowedArtifactPath(String(raw.path));
    if (typeof raw.objectId !== "string" || !/^[a-f0-9]{40}$/i.test(raw.objectId) || raw.gitObjectType === "commit") throw new RepositoryError("unsupported_file");
    const objectId = raw.objectId.toLowerCase();
    const kind = raw.isFolder === true ? "folder" : "file";
    const id = `remote_${createHash6("sha256").update(JSON.stringify([state.context.contextId, path3, objectId, kind])).digest("base64url")}`;
    return { id, path: path3, objectId, kind, label: posix.basename(path3) };
  }
  async function read(state, operation, item) {
    if (item.kind !== "file") throw new RepositoryError("unsupported_file");
    const source = state.context;
    const metadata = await client.item(operation, source.repository.id, source.sourceVersion, item.path);
    if (metadata.path !== item.path || metadata.isFolder || metadata.objectId !== item.objectId) throw new RepositoryError("source_unavailable");
    const contentMetadata = metadata.contentMetadata && typeof metadata.contentMetadata === "object" ? metadata.contentMetadata : {};
    if (contentMetadata.isBinary === true) throw new RepositoryError("unsupported_file");
    const bytes = await client.blob(operation, source.repository.id, item.objectId);
    const content = decodeArtifact(bytes, contentMetadata.encoding, contentMetadata.isBinary === true);
    operation.access.assertCurrent();
    return {
      artifact: { id: item.id, relativePath: item.path.slice(1), label: item.label, role: "reference", availability: "available" },
      revision: `sha256:${createHash6("sha256").update(bytes).digest("hex")}`,
      content,
      byteSize: bytes.length,
      sourceKind: "git-commit",
      source: {
        provider: "azure-devops",
        repositoryId: source.repository.id,
        repositoryName: source.repository.name,
        branch: source.repository.defaultBranch,
        commit: source.sourceVersion,
        objectId: item.objectId
      },
      format: /\.(?:md|markdown)$/i.test(item.path) ? "markdown" : "text",
      contextId: source.contextId,
      generation: source.generation
    };
  }
  const service = {
    async open(repositoryId) {
      const operation = await client.open();
      const repository = await repositoryDetail(client, operation, repositoryId);
      if (!repository.sourceVersion || repository.operationalState !== "active") throw new RepositoryError("source_unavailable");
      const context = {
        contextId: `remote-context_${randomBytes7(24).toString("base64url")}`,
        repository,
        sourceVersion: repository.sourceVersion,
        generation: operation.access.generation,
        roots: repository.speckitStatus === "enabled" ? [...ROOTS] : []
      };
      for (const [key, entry] of states) if (entry.expiresAt <= now()) states.delete(key);
      if (states.size >= 16) states.delete(states.keys().next().value);
      states.set(context.contextId, { context, identity: identity(operation), expiresAt: now() + 6e5, items: /* @__PURE__ */ new Map(), roots: /* @__PURE__ */ new Map() });
      return structuredClone(context);
    },
    async items(contextId, root, cursor) {
      const { state, operation } = await use(contextId);
      if (!state.context.roots.includes(root)) throw new RepositoryError("invalid_request");
      let items = state.roots.get(root);
      if (!items) {
        let raw;
        try {
          raw = await client.tree(operation, state.context.repository.id, state.context.sourceVersion, root);
        } catch (error) {
          if (!(error instanceof RepositoryError) || error.code !== "resource_unavailable") throw error;
          await client.repository(operation, state.context.repository.id);
          raw = [];
        }
        if (raw.length > 1e4) throw new RepositoryError("upstream_unavailable");
        const paths = /* @__PURE__ */ new Set();
        items = [];
        for (const entry of raw) {
          if (entry.path === root && entry.isFolder === true) continue;
          const item = asItem(state, entry);
          if (!item.path.startsWith(`${root}/`) || paths.has(item.path)) throw new RepositoryError("source_unavailable");
          paths.add(item.path);
          items.push(item);
        }
        items.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : left.objectId.localeCompare(right.objectId, "en"));
        operation.access.assertCurrent();
        state.roots.set(root, items);
        for (const item of items) state.items.set(item.id, item);
      }
      const binding = { identity: state.identity, contextId, root, commit: state.context.sourceVersion, pageSize: 50 };
      const offset = cursor ? cursors.verify(cursor, "items", binding) : 0;
      if (offset > items.length) throw new RepositoryError("invalid_context");
      const page = items.slice(offset, offset + 50);
      const hasMore = offset + page.length < items.length;
      operation.access.assertCurrent();
      return {
        items: page.map((item) => ({ ...item })),
        hasMore,
        cursor: hasMore ? cursors.issue("items", binding, offset + page.length) : null,
        contextId,
        sourceVersion: state.context.sourceVersion
      };
    },
    async content(contextId, itemId) {
      const { state, operation } = await use(contextId);
      const item = state.items.get(itemId);
      if (!item) throw new RepositoryError("invalid_context");
      return read(state, operation, item);
    },
    async reference(contextId, itemId, target) {
      const { state, operation } = await use(contextId);
      const source = state.items.get(itemId);
      if (!source || source.kind !== "file" || typeof target !== "string" || target.length > 4096 || /[\p{Cc}\p{Cf}\\]/u.test(target)) throw new RepositoryError("invalid_request");
      let url;
      let path3;
      let fragment;
      try {
        url = new URL(target, `https://repository.invalid${source.path}`);
        if (url.origin !== "https://repository.invalid" || url.search || url.username || url.password) throw new Error();
        path3 = allowedArtifactPath(decodeURIComponent(url.pathname));
        fragment = decodeURIComponent(url.hash.slice(1));
      } catch {
        throw new RepositoryError("invalid_request");
      }
      const raw = await client.item(operation, state.context.repository.id, state.context.sourceVersion, path3);
      if (raw.path !== path3) throw new RepositoryError("source_unavailable");
      const item = asItem(state, raw);
      operation.access.assertCurrent();
      state.items.set(item.id, item);
      return { document: await read(state, operation, item), fragment };
    },
    async refresh(contextId) {
      const { state } = await use(contextId);
      const next = await service.open(state.context.repository.id);
      states.delete(contextId);
      return next;
    },
    async source(contextId) {
      const { state, operation } = await use(contextId);
      operation.access.assertCurrent();
      return structuredClone(state.context);
    },
    clear() {
      states.clear();
    },
    dispose() {
      states.clear();
      cursors.dispose();
    }
  };
  return service;
}

// src/workspace-binding.ts
import { lstat as lstat4, readFile as readFile3, readdir as readdir2, realpath as realpath4 } from "node:fs/promises";
import { homedir as homedir5 } from "node:os";
import { dirname as dirname4, isAbsolute as isAbsolute6, join as join5, relative as relative3, resolve as resolve5, sep as sep3 } from "node:path";
function inside2(root, path3) {
  const part = relative3(root, path3);
  return part !== ".." && !part.startsWith(`..${sep3}`) && !isAbsolute6(part);
}
async function inspectCurrentRepository({ workspacePath, homeDirectory = homedir5(), runner = runGit, executable, signal: cancellation }) {
  try {
    if (!isAbsolute6(workspacePath) || /[\p{Cc}\p{Cf}]/u.test(workspacePath)) throw new Error();
    for (let directory = resolve5(workspacePath); ; directory = dirname4(directory)) {
      const info = await lstat4(directory);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error();
      if (dirname4(directory) === directory) break;
    }
    const workingDirectory = await realpath4(workspacePath);
    let repositoryRoot = workingDirectory;
    for (; ; ) {
      try {
        const marker = await lstat4(join5(repositoryRoot, ".git"));
        if (marker.isSymbolicLink() || !marker.isFile() && !marker.isDirectory()) throw new Error();
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        const parent = dirname4(repositoryRoot);
        if (parent === repositoryRoot) return null;
        repositoryRoot = parent;
      }
    }
    const home = await realpath4(homeDirectory);
    const git = executable ?? await findGitExecutable(workingDirectory);
    const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
    delete env.GIT_CONFIG_KEY_0;
    delete env.GIT_CONFIG_VALUE_0;
    env.GIT_CONFIG_COUNT = "0";
    env.GIT_OPTIONAL_LOCKS = "0";
    const signal = AbortSignal.any([AbortSignal.timeout(1e4), ...cancellation ? [cancellation] : []]);
    const execute = (args) => runner({ executable: git, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workingDirectory, env, signal });
    const root = await execute(["rev-parse", "--path-format=absolute", "--show-toplevel"]);
    const common = await execute(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
    if (!isAbsolute6(root) || !isAbsolute6(common)) throw new Error();
    const worktreeRoot = await realpath4(root);
    const gitCommonDirectory = await realpath4(common);
    if (worktreeRoot !== await realpath4(repositoryRoot) || !inside2(worktreeRoot, workingDirectory)) throw new Error();
    const optional = async (args) => {
      try {
        return await execute(args);
      } catch (error) {
        if (signal.aborted) throw error;
        return null;
      }
    };
    const head = await optional(["rev-parse", "--verify", "HEAD"]);
    const branch = await optional(["symbolic-ref", "--quiet", "HEAD"]);
    const rawOrigin = await optional(["remote", "get-url", "origin"]);
    if (head !== null && !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(head)) throw new Error();
    if (branch !== null && (!branch.startsWith("refs/heads/") || branch.length > 1024 || /[\p{Cc}\p{Cf}]/u.test(branch))) throw new Error();
    let origin2 = null;
    if (rawOrigin && rawOrigin.length <= 4096 && !/[\p{Cc}\p{Cf}]/u.test(rawOrigin)) {
      try {
        const address = new URL(rawOrigin);
        if (["https:", "ssh:"].includes(address.protocol) && !address.password && !address.search && !address.hash && (!address.username || address.username === "git")) origin2 = address.href.replace(/\/$/, "");
      } catch {
        if (/^git@[a-z0-9.-]+:[^?#\s]+$/i.test(rawOrigin)) origin2 = rawOrigin;
      }
    }
    if (signal.aborted) throw new Error();
    return { workingDirectory, worktreeRoot, gitCommonDirectory, origin: origin2, head, branch };
  } catch {
    throw new RepositoryError("local_context_mismatch");
  }
}
async function readOnlyGit(workspacePath, options, signal) {
  const home = await realpath4(options.homeDirectory ?? homedir5());
  const executable = options.executable ?? await findGitExecutable(workspacePath);
  const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: process.platform === "win32" ? "NUL" : "/dev/null" });
  delete env.GIT_CONFIG_KEY_0;
  delete env.GIT_CONFIG_VALUE_0;
  env.GIT_CONFIG_COUNT = "0";
  env.GIT_OPTIONAL_LOCKS = "0";
  return (args) => (options.runner ?? runGit)({ executable, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workspacePath, env, signal });
}
async function verifyPreparedRepository(options) {
  const { record: record3 } = options;
  const signal = options.signal ?? AbortSignal.timeout(1e4);
  try {
    await createPreparationStore({ homeDirectory: options.homeDirectory }).verifyOwnership(record3);
    const identity2 = await inspectCurrentRepository({ ...options, workspacePath: record3.destination, signal });
    if (!identity2 || identity2.workingDirectory !== record3.destination || identity2.worktreeRoot !== record3.destination || identity2.gitCommonDirectory !== record3.gitCommonDirectory || identity2.origin !== record3.originIdentity || identity2.head !== record3.sourceCommit || identity2.branch !== record3.branch) throw new Error();
    const execute = await readOnlyGit(record3.destination, options, signal);
    if (await execute(["status", "--porcelain=v1", "--untracked-files=all"])) throw new Error();
    if (await fingerprintCheckout(record3.destination, signal) !== record3.initialWorktreeFingerprint || signal.aborted) throw new Error();
    return identity2;
  } catch {
    throw new RepositoryError("clone_identity_changed");
  }
}
async function verifyActivatedRepository(options) {
  const { record: record3, activation, snapshot } = options;
  const signal = options.signal ?? AbortSignal.timeout(1e4);
  try {
    if (!activation.attemptId || snapshot.sessionId !== activation.sessionId || snapshot.contextRevision !== activation.contextRevision || snapshot.workingDirectory !== activation.workingDirectory || !activation.targetBranch.startsWith("refs/heads/")) throw new Error();
    const original = await verifyPreparedRepository({ ...options, signal });
    if (activation.targetKind === "prepared_checkout") {
      if (activation.workingDirectory !== record3.destination || activation.targetBranch !== record3.branch) throw new Error();
      return original;
    }
    if (activation.targetKind !== "host_worktree" || activation.workingDirectory === record3.destination) throw new Error();
    const identity2 = await inspectCurrentRepository({ ...options, workspacePath: activation.workingDirectory, signal });
    if (!identity2 || identity2.workingDirectory !== activation.workingDirectory || identity2.worktreeRoot !== activation.workingDirectory || identity2.gitCommonDirectory !== record3.gitCommonDirectory || identity2.origin !== record3.originIdentity || identity2.head !== record3.sourceCommit || identity2.branch !== activation.targetBranch) throw new Error();
    const execute = await readOnlyGit(identity2.worktreeRoot, options, signal);
    const registrations = (await execute(["worktree", "list", "--porcelain", "-z"])).split("\0\0").map((block) => block.split("\0"));
    let matches = 0;
    for (const fields2 of registrations) {
      const path3 = fields2.find((field) => field.startsWith("worktree "))?.slice(9);
      if (!path3 || !isAbsolute6(path3)) continue;
      let canonical;
      try {
        canonical = await realpath4(path3);
      } catch {
        continue;
      }
      if (canonical !== identity2.worktreeRoot) continue;
      if (fields2.some((field) => field === "bare" || field === "detached" || field.startsWith("prunable")) || !fields2.includes(`branch ${activation.targetBranch}`) || !fields2.includes(`HEAD ${record3.sourceCommit}`)) throw new Error();
      matches++;
    }
    if (matches !== 1 || await execute(["status", "--porcelain=v1", "--untracked-files=all"]) || await fingerprintCheckout(identity2.worktreeRoot, signal) !== record3.initialWorktreeFingerprint || signal.aborted) throw new Error();
    return identity2;
  } catch {
    throw new RepositoryError("clone_identity_changed");
  }
}
async function verifyReadyRepository(options) {
  const { record: record3, snapshot, providerId, instanceId } = options;
  try {
    const accepted = record3.acceptedTarget;
    if (!accepted || record3.handoff?.status !== "canvas_ready" || accepted.sessionId !== snapshot.sessionId || accepted.contextRevision !== snapshot.contextRevision || accepted.workingDirectory !== snapshot.workingDirectory || accepted.providerId !== providerId || accepted.instanceId !== instanceId) throw new Error();
    const identity2 = await inspectCurrentRepository({ ...options, workspacePath: snapshot.workingDirectory });
    if (!identity2 || identity2.worktreeRoot !== accepted.workingDirectory || identity2.gitCommonDirectory !== record3.gitCommonDirectory || identity2.origin !== record3.originIdentity) throw new Error();
    return identity2;
  } catch {
    throw new RepositoryError("clone_identity_changed");
  }
}
async function createWorkflowBinding({ host, providerId, instanceId, homeDirectory = homedir5(), runner, executable }) {
  const initial = await host.inspectCurrent();
  const options = { homeDirectory, runner, executable };
  const store = createPreparationStore({ homeDirectory });
  const identity2 = await inspectCurrentRepository({ ...options, workspacePath: initial.workingDirectory });
  const records = await store.list();
  if (records.hasMore) throw new RepositoryError("entry_required");
  const candidates = records.items.flatMap((item) => item.record && (item.record.gitCommonDirectory === identity2?.gitCommonDirectory || item.record.destination === identity2?.worktreeRoot || item.record.handoff?.activation?.workingDirectory === initial.workingDirectory) ? [item.record] : []);
  if (candidates.length > 1) throw new RepositoryError("entry_required");
  const prepared = candidates[0];
  const managed = join5(await realpath4(homeDirectory), "SpecKitCanvas", "repositories");
  if (!prepared && (inside2(managed, resolve5(initial.workingDirectory)) || identity2 && inside2(managed, identity2.gitCommonDirectory))) {
    throw new RepositoryError("entry_required");
  }
  if (prepared && !prepared.acceptedTarget) {
    const attempt = prepared.handoff;
    if (!attempt?.activation || attempt.status !== "workspace_activated" || attempt.instanceId !== instanceId || !providerId) throw new RepositoryError("entry_required");
    await verifyActivatedRepository({ ...options, record: prepared, activation: attempt.activation, snapshot: initial });
    const current = await host.inspectCurrent();
    if (current.sessionId !== initial.sessionId || current.contextRevision !== initial.contextRevision || current.workingDirectory !== initial.workingDirectory) {
      throw new RepositoryError("context_changed");
    }
  }
  return {
    workspacePath: identity2?.worktreeRoot ?? initial.workingDirectory,
    operationId: prepared?.operationId,
    preparation: prepared ? {
      state: "verified",
      operationId: prepared.operationId,
      repositoryId: prepared.repositoryId,
      initialCommit: prepared.sourceCommit,
      gitDirectory: prepared.gitCommonDirectory
    } : void 0,
    async ready() {
      if (!prepared || prepared.acceptedTarget) return;
      const current = await host.inspectCurrent();
      const latest = await store.read(prepared.operationId);
      const attempt = latest.handoff;
      if (!attempt?.activation || attempt.instanceId !== instanceId || attempt.status !== "workspace_activated") throw new RepositoryError("entry_required");
      await verifyActivatedRepository({ ...options, record: latest, activation: attempt.activation, snapshot: current });
      const after = await host.inspectCurrent();
      if (after.sessionId !== current.sessionId || after.contextRevision !== current.contextRevision || after.workingDirectory !== current.workingDirectory) {
        throw new RepositoryError("context_changed");
      }
      await store.updateAttempt(prepared.operationId, { ...attempt, status: "canvas_ready", result: { ...attempt.activation, providerId, instanceId } });
    },
    async verify() {
      const current = await host.inspectCurrent();
      if (current.sessionId !== initial.sessionId || current.contextRevision !== initial.contextRevision || current.workingDirectory !== initial.workingDirectory) {
        throw new RepositoryError("context_changed");
      }
      const local = await inspectCurrentRepository({ ...options, workspacePath: current.workingDirectory });
      if (identity2?.worktreeRoot !== local?.worktreeRoot || identity2?.gitCommonDirectory !== local?.gitCommonDirectory || identity2?.origin !== local?.origin) {
        throw new RepositoryError("local_context_mismatch");
      }
      if (prepared) {
        const latest = await store.read(prepared.operationId);
        if (!latest.acceptedTarget || latest.handoff?.status !== "canvas_ready" || latest.gitCommonDirectory !== local?.gitCommonDirectory || latest.originIdentity !== local?.origin) {
          throw new RepositoryError("entry_required");
        }
      }
    }
  };
}
async function inspectWorkspaceBinding({ workspacePath, homeDirectory = homedir5(), runner = runGit, executable, previous }) {
  let entries;
  const requiresPreparation = previous?.state === "verified" || inside2(join5(resolve5(homeDirectory), "SpecKitCanvas", "repositories"), resolve5(workspacePath));
  const unprepared = { state: requiresPreparation ? "mismatch" : "ordinary" };
  try {
    const gitEntry = await lstat4(join5(workspacePath, ".git"));
    if (gitEntry.isSymbolicLink() || !gitEntry.isFile() && !gitEntry.isDirectory()) return { state: "unavailable" };
  } catch (error) {
    if (error.code === "ENOENT") return unprepared;
    return { state: "unavailable" };
  }
  const directory = join5(homeDirectory, ".speckit-canvas", "preparations");
  try {
    const info = await lstat4(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) return { state: "unavailable" };
    entries = await readdir2(directory, { withFileTypes: true });
  } catch (error) {
    return { state: error.code === "ENOENT" ? unprepared.state : "unavailable" };
  }
  if (entries.length > 256) return { state: "unavailable" };
  const records = [];
  try {
    const home = await realpath4(homeDirectory);
    for (const entry of entries) {
      if (!/^[a-f0-9]{32}\.json$/.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) continue;
      const file = join5(directory, entry.name);
      if ((await lstat4(file)).size > 4096) continue;
      const record4 = JSON.parse(await readFile3(file, "utf8"));
      const root = join5(home, "SpecKitCanvas", "repositories", entry.name.slice(0, -5));
      if (record4.schemaVersion !== 1 || record4.kind !== "sdd-prepared-repository" || record4.operationId !== entry.name.slice(0, -5) || !/^[a-f0-9]{40}$/.test(record4.initialCommit) || record4.initialBranch !== `speckit/canvas-${record4.operationId}` || !isAbsolute6(record4.gitDirectory) || !inside2(root, record4.gitDirectory) || resolve5(record4.checkout) !== join5(root, "checkout")) continue;
      const remote2 = new URL(record4.remote);
      if (remote2.origin !== "https://dev.azure.com" || remote2.username || remote2.password || remote2.search || remote2.hash || !remote2.pathname.endsWith(`/_git/${record4.repositoryId}`)) continue;
      records.push(record4);
    }
    if (!records.length) return unprepared;
    const git = executable ?? await findGitExecutable(workspacePath);
    const empty = process.platform === "win32" ? "NUL" : "/dev/null";
    const env = cloneEnvironment({ token: "", remote: "https://unused.invalid", home, emptyFile: empty });
    delete env.GIT_CONFIG_KEY_0;
    delete env.GIT_CONFIG_VALUE_0;
    env.GIT_CONFIG_COUNT = "0";
    const signal = AbortSignal.timeout(1e4);
    const execute = (args) => runner({ executable: git, args: ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", ...args], cwd: workspacePath, env, signal });
    const common = await realpath4(await execute(["rev-parse", "--path-format=absolute", "--git-common-dir"]));
    const candidates = [];
    for (const record4 of records) {
      try {
        if (await realpath4(record4.gitDirectory) === common) candidates.push(record4);
      } catch {
        continue;
      }
    }
    if (!candidates.length) {
      return requiresPreparation || records.some((record4) => inside2(record4.checkout, resolve5(workspacePath))) ? { state: "mismatch" } : { state: "ordinary" };
    }
    if (candidates.length !== 1) return { state: "mismatch" };
    const record3 = candidates[0];
    const remote = await execute(["remote", "get-url", "origin"]);
    const head = await execute(["rev-parse", "HEAD"]);
    const branch = await execute(["symbolic-ref", "--short", "HEAD"]);
    const alreadyAcknowledged = previous?.state === "verified" && previous.operationId === record3.operationId && previous.gitDirectory === common;
    if (remote !== record3.remote || !/^[a-f0-9]{40}$/.test(head) || !branch || !alreadyAcknowledged && head !== record3.initialCommit) return { state: "mismatch" };
    return { state: "verified", operationId: record3.operationId, repositoryId: record3.repositoryId, initialCommit: record3.initialCommit, gitDirectory: common };
  } catch {
    return { state: "unavailable" };
  }
}
function assertWorkspaceBinding(binding) {
  if (binding.state === "mismatch" || binding.state === "unavailable") throw new RepositoryError("local_context_mismatch");
}

// src/repository-service.ts
async function createRepositoryService({ workspacePath, profileStatus, dependencies, request, cloneOptions, bindingOptions, workflowBinding, onChange = () => void 0 }) {
  const configuration = profileStatus ?? await loadRepositoryProfile();
  const localContextId = `local_${randomBytes8(24).toString("base64url")}`;
  let workspaceBinding = workflowBinding?.preparation ?? await inspectWorkspaceBinding({ workspacePath, ...bindingOptions });
  const artifactTime = await createPreparedArtifactClock({ workspacePath, binding: workspaceBinding, ...bindingOptions });
  let mode = "local";
  let selectedContextId;
  let generation = 0;
  let selectionGeneration = 0;
  let disposed = false;
  const profile = configuration.state === "configured" ? configuration.profile : void 0;
  const adapter = dependencies ?? nativeAuthDependencies();
  const connection = profile ? createRepositoryConnection(profile, { ...adapter, onChange: (snapshot) => {
    if (snapshot.generation !== generation || snapshot.state !== "connected") {
      generation = snapshot.generation;
      selectionGeneration++;
      discovery?.clear();
      review?.clear();
      clones?.clear();
      selectedContextId = void 0;
      mode = "local";
    }
    adapter.onChange?.(snapshot);
    onChange();
  } }) : void 0;
  const client = profile && connection ? createAdoClient({ profile, connection, request }) : void 0;
  const discovery = client && profile ? createRepositoryDiscovery({ client, profile }) : void 0;
  const review = client ? createRemoteReview({ client }) : void 0;
  const clones = review && profile && connection ? createCloneService({ readSource: (contextId) => review.source(contextId), profile, connection, workspacePath, ...cloneOptions, onChange }) : void 0;
  function available() {
    if (disposed || !connection || !discovery || !review) throw new RepositoryError("connection_required");
    return { connection, discovery, review };
  }
  const service = {
    artifactTime,
    snapshot() {
      return {
        configuration: configuration.state,
        connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" },
        localContext: { contextId: localContextId, label: basename(workspacePath), binding: workspaceBinding.state },
        mode,
        selectedContextId: selectedContextId ?? null,
        capabilities: { browse: Boolean(connection), clone: Boolean(clones) }
      };
    },
    connect() {
      return available().connection.connect();
    },
    disconnect() {
      connection?.disconnect();
    },
    search: (query, cursor) => available().discovery.search(query, cursor),
    relevant: (cursor) => available().discovery.relevant(cursor),
    detail: (id) => available().discovery.detail(id),
    async context(repositoryId) {
      const selection = ++selectionGeneration;
      const context = await available().review.open(repositoryId);
      if (selection !== selectionGeneration || disposed) throw new RepositoryError("invalid_context");
      mode = "remote";
      selectedContextId = context.contextId;
      onChange();
      return context;
    },
    items: (contextId, root, cursor) => available().review.items(contextId, root, cursor),
    content: (contextId, itemId) => available().review.content(contextId, itemId),
    reference: (contextId, itemId, target) => available().review.reference(contextId, itemId, target),
    async refresh(contextId) {
      const selection = ++selectionGeneration;
      const context = await available().review.refresh(contextId);
      if (selection !== selectionGeneration || disposed) throw new RepositoryError("invalid_context");
      mode = "remote";
      selectedContextId = context.contextId;
      onChange();
      return context;
    },
    selectLocal() {
      selectionGeneration++;
      mode = "local";
      selectedContextId = void 0;
      onChange();
      return service.snapshot();
    },
    cloneConfirm(contextId) {
      available();
      if (!clones) throw new RepositoryError("clone_conflict");
      return clones.confirm(contextId);
    },
    cloneStart(operationId, confirmation) {
      available();
      if (!clones) throw new RepositoryError("clone_conflict");
      return clones.start(operationId, confirmation);
    },
    cloneStatus(operationId) {
      available();
      if (!clones) throw new RepositoryError("clone_conflict");
      return clones.status(operationId);
    },
    cloneCancel(operationId) {
      available();
      if (!clones) throw new RepositoryError("clone_conflict");
      clones.cancel(operationId);
    },
    assertLocal(contextId) {
      if (disposed) throw new RepositoryError("invalid_context");
      if (mode !== "local") throw new RepositoryError("remote_read_only");
      if ((profile || contextId !== void 0) && contextId !== localContextId) throw new RepositoryError("local_context_mismatch");
    },
    async verifyLocal(contextId) {
      service.assertLocal(contextId);
      await workflowBinding?.verify();
      workspaceBinding = workflowBinding?.preparation ?? await inspectWorkspaceBinding({ workspacePath, ...bindingOptions, previous: workspaceBinding });
      service.assertLocal(contextId);
      assertWorkspaceBinding(workspaceBinding);
    },
    dispose() {
      disposed = true;
      connection?.dispose();
      discovery?.dispose();
      review?.dispose();
      clones?.dispose();
    }
  };
  return service;
}
async function createEntryCoordinator({
  host,
  profileStatus,
  dependencies,
  request,
  cloneOptions,
  handoffOptions,
  inspectWorkspace = (workspacePath) => inspectCurrentRepository({ workspacePath }),
  onChange = () => void 0
}) {
  const configuration = profileStatus ?? await loadRepositoryProfile();
  const profile = configuration.state === "configured" ? configuration.profile : void 0;
  let disposed = false;
  let currentHost;
  let localContextId = `local_${randomBytes8(24).toString("base64url")}`;
  let localFingerprint;
  let phase = "chooser";
  let selectionGeneration = 0;
  let selected;
  let clones;
  let activeOperationId;
  let retainedOperation;
  let activeRecord;
  let handoffError;
  const automatic = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Set();
  const retries = /* @__PURE__ */ new Map();
  const transitions = /* @__PURE__ */ new Set();
  const store = createPreparationStore({ homeDirectory: cloneOptions?.homeDirectory });
  const localRequests = /* @__PURE__ */ new Map();
  const adapter = dependencies ?? nativeAuthDependencies();
  const connection = profile ? createRepositoryConnection(profile, { ...adapter, onChange: (snapshot) => {
    if (disposed) return;
    selectionGeneration++;
    selected = void 0;
    clones?.invalidate();
    for (const eligibility of automatic.values()) eligibility.eligible = false;
    retainedOperation = void 0;
    activeRecord = void 0;
    handoffError = void 0;
    activeOperationId = void 0;
    phase = "chooser";
    discovery?.clear();
    adapter.onChange?.(snapshot);
    onChange();
  } }) : void 0;
  const client = profile && connection ? createAdoClient({ profile, connection, request }) : void 0;
  const discovery = profile && client ? createRepositoryDiscovery({ profile, client }) : void 0;
  function remoteAvailable() {
    if (disposed || !profile || !connection || !discovery) throw new RepositoryError("connection_required");
    return { profile, connection, discovery };
  }
  function remoteReason(snapshot) {
    return !supportsRemotePreparation(snapshot) ? "host_handoff_unsupported" : snapshot.activity === "busy" ? "session_busy" : snapshot.activity === "unknown" ? "activity_unknown" : null;
  }
  function preparationReason(snapshot) {
    return !supportsRepositoryCloning(snapshot) || snapshot.activity === "unknown" ? "activity_unknown" : snapshot.activity === "busy" ? "session_busy" : null;
  }
  const accountKey = (access) => createHash7("sha256").update(JSON.stringify([access.tenantId, access.accountId])).digest("hex");
  const sameSource = (source, current) => source.sessionId === current.sessionId && source.contextRevision === current.contextRevision && source.workingDirectory === current.workingDirectory && source.capabilityGeneration === current.capabilityGeneration && source.activityRevision === current.activityRevision && current.activity === "idle";
  function remember(record3, repositoryName) {
    activeRecord = record3;
    activeOperationId = record3.operationId;
    retainedOperation = {
      operationId: record3.operationId,
      state: "prepared",
      repositoryName: repositoryName ?? retainedOperation?.repositoryName ?? "Prepared repository",
      branch: record3.defaultRef,
      sourceCommit: record3.sourceCommit,
      localBranch: record3.branch.slice(11),
      destination: record3.destination
    };
  }
  function operationView() {
    if (!activeOperationId || connection?.snapshot().state !== "connected") return null;
    let operation = retainedOperation;
    if (!operation && clones) {
      try {
        operation = clones.status(activeOperationId);
      } catch {
        return null;
      }
    }
    if (!operation || operation.state === "awaiting_confirmation") return null;
    return { ...operation, ...handoffError ? { error: handoffError } : {} };
  }
  async function authorizedRecord(operationId) {
    try {
      const remote = remoteAvailable();
      const access = await remote.connection.access();
      const record3 = await store.read(operationId);
      if (record3.accountKey !== accountKey(access) || record3.profileFingerprint !== createHash7("sha256").update(JSON.stringify(remote.profile)).digest("hex")) throw new Error();
      const repository = await remote.discovery.detail(record3.repositoryId);
      access.assertCurrent();
      return { record: record3, repository, access };
    } catch {
      throw new RepositoryError("resource_unavailable");
    }
  }
  async function outcomeFor(attemptId) {
    let timer;
    try {
      return await Promise.race([host.getHandoffOutcome(attemptId), new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new RepositoryError("handoff_unknown")), 5e3);
      })]);
    } catch {
      throw new RepositoryError("handoff_unknown");
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  async function performHandoff(operationId, expected, reconcile) {
    if (transitions.has(operationId)) throw new RepositoryError("handoff_in_progress");
    transitions.add(operationId);
    let attempt;
    let submitted = false;
    try {
      const authorized = await authorizedRecord(operationId);
      let record3 = authorized.record;
      remember(record3, authorized.repository.name);
      const reason = remoteReason(await readHost());
      if (reason) throw new RepositoryError(reason);
      let outcome;
      attempt = record3.handoff;
      if (attempt && reconcile) {
        outcome = await outcomeFor(attempt.attemptId);
        if (attempt.activation && !["workspace_activated", "canvas_ready"].includes(outcome.status)) throw new RepositoryError("handoff_unknown");
        if (outcome.status === "unknown" || outcome.status === "in_progress") {
          record3 = await store.updateAttempt(operationId, { ...attempt, status: outcome.status });
          remember(record3, authorized.repository.name);
          phase = outcome.status === "unknown" ? "handoff_unknown" : "handoff_pending";
          throw new RepositoryError(outcome.status === "unknown" ? "handoff_unknown" : "handoff_in_progress");
        }
        if (outcome.status === "not_started" || outcome.status === "rejected") {
          record3 = await store.updateAttempt(operationId, { ...attempt, status: "rejected" });
          attempt = void 0;
          outcome = void 0;
        }
      } else if (attempt) throw new RepositoryError("handoff_in_progress");
      if (!record3.acceptedTarget) {
        await (handoffOptions?.verifyPrepared ? handoffOptions.verifyPrepared(record3) : verifyPreparedRepository({ record: record3, ...cloneOptions }));
      }
      const current = await readHost();
      const currentReason = remoteReason(current);
      if (currentReason) throw new RepositoryError(currentReason);
      if (record3.acceptedTarget) await verifyReadyRepository({
        record: record3,
        snapshot: current,
        providerId: record3.acceptedTarget.providerId,
        instanceId: record3.acceptedTarget.instanceId,
        ...cloneOptions
      });
      if (!attempt) {
        if (!sameSource(expected, current)) throw new RepositoryError("context_changed");
        const attemptId = randomBytes8(16).toString("hex");
        attempt = {
          attemptId,
          operationId,
          expectedSource: { sessionId: current.sessionId, contextRevision: current.contextRevision },
          instanceId: `entry-target-${attemptId}`,
          status: "requested",
          createdAt: (handoffOptions?.now ?? Date.now)()
        };
        record3 = await store.beginAttempt(operationId, attempt);
      }
      const submittedAttempt = attempt;
      if (automatic.has(operationId)) automatic.get(operationId).eligible = false;
      phase = "handoff_pending";
      handoffError = void 0;
      onChange();
      submitted = true;
      const result = await executeHostHandoff({
        host,
        outcome,
        timeoutMs: handoffOptions?.timeoutMs,
        request: {
          attemptId: attempt.attemptId,
          expectedSource: attempt.expectedSource,
          target: record3,
          canvasId: "sdd-canvas-direct",
          instanceId: attempt.instanceId
        },
        persistActivation: async (activation) => {
          const latest = await store.read(operationId);
          if (latest.handoff?.attemptId !== submittedAttempt.attemptId) throw new RepositoryError("context_changed");
          if (latest.handoff.activation) {
            if (JSON.stringify(latest.handoff.activation) !== JSON.stringify(activation)) throw new RepositoryError("clone_identity_changed");
          } else {
            await store.updateAttempt(operationId, { ...submittedAttempt, status: "workspace_activated", activation });
          }
          if (!disposed) {
            phase = "target_binding";
            onChange();
          }
        },
        readReadiness: async () => {
          const latest = await store.read(operationId);
          return latest.handoff?.attemptId === submittedAttempt.attemptId && latest.handoff.status === "canvas_ready" ? latest.acceptedTarget : void 0;
        }
      });
      if (result.status !== "canvas_ready") {
        const status = result.status === "not_started" ? "rejected" : result.status;
        await store.updateAttempt(operationId, { ...submittedAttempt, status });
        if (status === "unknown") throw new RepositoryError("handoff_unknown");
        if (status === "in_progress") throw new RepositoryError("handoff_in_progress");
        throw new RepositoryError("canvas_unavailable");
      }
      remember(await store.read(operationId), authorized.repository.name);
      phase = "ready";
      handoffError = void 0;
      onChange();
      return { ...retainedOperation };
    } catch (error) {
      const failure = knownRepositoryError(error?.code);
      if (attempt) {
        try {
          const latest = await store.read(operationId);
          if (latest.handoff?.attemptId === attempt.attemptId && latest.handoff.status !== "canvas_ready") {
            const definite = ["session_busy", "activity_unknown", "context_changed", "host_handoff_unsupported"].includes(failure.code);
            const status = latest.handoff.activation ? "workspace_activated" : failure.code === "handoff_unknown" ? "unknown" : failure.code === "handoff_in_progress" ? "in_progress" : latest.handoff.status === "rejected" || definite ? "rejected" : submitted ? "unknown" : latest.handoff.status;
            remember(await store.updateAttempt(operationId, { ...latest.handoff, status, errorCode: failure.code }));
          }
        } catch {
          handoffError = "handoff_unknown";
        }
      }
      handoffError ??= failure.code;
      phase = failure.code === "handoff_unknown" ? "handoff_unknown" : failure.code === "handoff_in_progress" ? "handoff_pending" : ["clone_identity_changed", "resource_unavailable", "context_changed"].includes(failure.code) ? "validation_blocked" : ["session_busy", "activity_unknown"].includes(failure.code) ? "waiting_user" : "handoff_failed";
      if (!disposed) onChange();
      throw failure;
    } finally {
      transitions.delete(operationId);
    }
  }
  function continueAfterPreparation(operationId) {
    const job = (async () => {
      await clones.completion(operationId);
      if (disposed || clones.status(operationId).state !== "prepared") return;
      const authorized = await authorizedRecord(operationId);
      remember(authorized.record, authorized.repository.name);
      const eligibility = automatic.get(operationId);
      const current = await readHost();
      if (!eligibility || !supportsRemotePreparation(eligibility.source) || !supportsRemotePreparation(current)) {
        phase = "prepared";
        handoffError = void 0;
        onChange();
        return;
      }
      if (!eligibility?.eligible || !sameSource(eligibility.source, current)) {
        phase = "waiting_user";
        handoffError = remoteReason(current) ?? "context_changed";
        onChange();
        return;
      }
      await performHandoff(operationId, current, false);
    })().catch((error) => {
      if (!disposed && !["handoff_unknown", "handoff_pending", "handoff_failed", "validation_blocked", "waiting_user"].includes(phase)) {
        phase = "validation_blocked";
        handoffError = knownRepositoryError(error?.code).code;
        onChange();
      }
    });
    pending.add(job);
    void job.finally(() => pending.delete(job));
  }
  async function readSelectionSource(selectionId) {
    const remote = remoteAvailable();
    const current = selected;
    if (!current || current.selection.selectionId !== selectionId || current.selection.matchesCurrentWorkspace) throw new RepositoryError("context_changed");
    const access = await remote.connection.access();
    if (accountKey(access) !== current.selection.accountKey || access.generation !== current.selection.connectionGeneration) throw new RepositoryError("invalid_context");
    const repository = await remote.discovery.detail(current.selection.repository.id);
    access.assertCurrent();
    if (selected !== current || !repository.sourceVersion || repository.sourceVersion !== current.selection.repository.sourceVersion || repository.defaultBranch !== current.selection.repository.defaultBranch) throw new RepositoryError("source_changed");
    return { repository, sourceVersion: repository.sourceVersion, generation: access.generation };
  }
  function ensureClones(snapshot) {
    const remote = remoteAvailable();
    clones ??= createEntryCloneService({
      host,
      readSource: readSelectionSource,
      connection: remote.connection,
      profile: remote.profile,
      workspacePath: snapshot.workingDirectory,
      ...cloneOptions,
      onChange: () => {
        if (disposed) return;
        if (activeOperationId) {
          const state = clones.status(activeOperationId).state;
          phase = state === "preparing" || state === "verifying" ? "preparing" : state === "prepared" ? "prepared" : state === "cancelled" ? "cancelled" : state === "failed" ? "failed" : phase;
        }
        onChange();
      }
    });
    return clones;
  }
  async function readHost() {
    if (disposed) throw new RepositoryError("invalid_context");
    const snapshot = await host.inspectCurrent();
    if (disposed) throw new RepositoryError("invalid_context");
    for (const eligibility of automatic.values()) if (!sameSource(eligibility.source, snapshot)) eligibility.eligible = false;
    if (currentHost && (currentHost.sessionId !== snapshot.sessionId || currentHost.contextRevision !== snapshot.contextRevision || currentHost.workingDirectory !== snapshot.workingDirectory)) localContextId = `local_${randomBytes8(24).toString("base64url")}`;
    currentHost = snapshot;
    return snapshot;
  }
  async function readLocal() {
    const snapshot = await readHost();
    const repository = await inspectWorkspace(snapshot.workingDirectory);
    const current = await readHost();
    if (current.sessionId !== snapshot.sessionId || current.contextRevision !== snapshot.contextRevision || current.workingDirectory !== snapshot.workingDirectory) throw new RepositoryError("context_changed");
    const fingerprint2 = JSON.stringify([current.sessionId, current.contextRevision, current.workingDirectory, repository]);
    if (localFingerprint !== void 0 && localFingerprint !== fingerprint2) {
      localContextId = `local_${randomBytes8(24).toString("base64url")}`;
      if (!activeOperationId) phase = "chooser";
    }
    localFingerprint = fingerprint2;
    return { snapshot: current, repository };
  }
  async function openLocal(snapshot, instanceId) {
    const opened = await host.openCurrentCanvas(snapshot, instanceId);
    const after = await readHost();
    if (disposed || opened.sessionId !== snapshot.sessionId || opened.contextRevision !== snapshot.contextRevision || opened.workingDirectory !== snapshot.workingDirectory || opened.instanceId !== instanceId || after.sessionId !== snapshot.sessionId || after.contextRevision !== snapshot.contextRevision || after.workingDirectory !== snapshot.workingDirectory) throw new RepositoryError("context_changed");
  }
  const service = {
    snapshot() {
      return { configuration: configuration.state, connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" } };
    },
    async state() {
      const localContext = { contextId: localContextId, label: "Current workspace", state: "unavailable" };
      let snapshot;
      let reason = null;
      try {
        const local = await readLocal();
        snapshot = local.snapshot;
        const repository = local.repository;
        localContext.contextId = localContextId;
        localContext.state = repository ? "repository" : "not_repository";
        if (repository) localContext.label = basename(repository.worktreeRoot);
        reason = preparationReason(snapshot);
      } catch (error) {
        reason = knownRepositoryError(error?.code).code;
      }
      return {
        configuration: configuration.state,
        connection: connection?.snapshot() ?? { state: "disconnected", generation: 0, projectLabel: "" },
        phase,
        localContext,
        host: {
          activity: snapshot?.activity ?? "unknown",
          canOpenCurrent: Boolean(snapshot?.capabilities.localCanvas && localContext.state === "repository"),
          canPrepareRemote: Boolean(snapshot && supportsRepositoryCloning(snapshot) && snapshot.activity === "idle"),
          canHandoff: Boolean(snapshot && supportsRemotePreparation(snapshot)),
          canRetryHandoff: Boolean(snapshot && supportsRemotePreparation(snapshot) && snapshot.activity === "idle" && activeOperationId && retainedOperation && !transitions.has(activeOperationId) && !automatic.get(activeOperationId)?.eligible && phase !== "ready"),
          reason
        },
        operation: operationView()
      };
    },
    async local(contextId, requestId) {
      text(contextId);
      text(requestId);
      const { snapshot, repository } = await readLocal();
      if (contextId !== localContextId) throw new RepositoryError("context_changed");
      if (!repository) throw new RepositoryError("local_context_mismatch");
      const existing = localRequests.get(requestId);
      if (existing) {
        if (existing.contextId !== contextId) throw new RepositoryError("context_changed");
        return existing.completion;
      }
      if (localRequests.size >= 32) throw new RepositoryError("invalid_context");
      const instanceId = `entry-local-${randomBytes8(16).toString("hex")}`;
      const completion = (async () => {
        await openLocal(snapshot, instanceId);
        await readLocal();
        if (contextId !== localContextId) throw new RepositoryError("context_changed");
        phase = "ready";
        onChange();
        return { opened: true };
      })();
      localRequests.set(requestId, { contextId, completion });
      return completion;
    },
    async direct(requestId) {
      text(requestId);
      const snapshot = await readHost();
      await openLocal(snapshot, `entry-direct-${randomBytes8(16).toString("hex")}`);
      return { opened: true };
    },
    async select(repositoryId, contextId) {
      text(repositoryId);
      text(contextId);
      const remote = remoteAvailable();
      if (transitions.size || activeRecord?.handoff && !["rejected", "canvas_ready"].includes(activeRecord.handoff.status)) throw new RepositoryError("handoff_in_progress");
      if (activeOperationId && clones && ["preparing", "verifying"].includes(clones.status(activeOperationId).state)) throw new RepositoryError("clone_conflict");
      activeOperationId = void 0;
      retainedOperation = void 0;
      activeRecord = void 0;
      handoffError = void 0;
      const generation = ++selectionGeneration;
      selected = void 0;
      const local = await readLocal();
      if (contextId !== localContextId) throw new RepositoryError("context_changed");
      const access = await remote.connection.access();
      const repository = await remote.discovery.detail(repositoryId);
      access.assertCurrent();
      const after = await readHost();
      if (generation !== selectionGeneration || contextId !== localContextId || after.contextRevision !== local.snapshot.contextRevision || after.sessionId !== local.snapshot.sessionId) throw new RepositoryError("context_changed");
      const originIdentity = `https://dev.azure.com/${[remote.profile.organization, remote.profile.project, "_git", repository.id].map(encodeURIComponent).join("/")}`;
      const namedOrigin = `https://dev.azure.com/${[remote.profile.organization, remote.profile.project, "_git", repository.name].map(encodeURIComponent).join("/")}`;
      const currentOrigin = local.repository?.origin?.replace(/\/$/, "").toLowerCase();
      const matchesCurrentWorkspace = currentOrigin === originIdentity.toLowerCase() || currentOrigin === namedOrigin.toLowerCase();
      const profileFingerprint = createHash7("sha256").update(JSON.stringify(remote.profile)).digest("hex");
      const selection = {
        selectionId: `selection_${randomBytes8(24).toString("base64url")}`,
        repository,
        originIdentity,
        accountKey: accountKey(access),
        connectionGeneration: access.generation,
        profileFingerprint,
        expectedSource: { sessionId: after.sessionId, contextRevision: after.contextRevision },
        matchesCurrentWorkspace
      };
      selected = { selection, snapshot: after, contextId };
      const operationId = randomBytes8(16).toString("hex");
      const home = await realpath5(cloneOptions?.homeDirectory ?? homedir6());
      const reason = preparationReason(after) ?? (!repository.sourceVersion || !repository.defaultBranch || repository.operationalState !== "active" ? "source_unavailable" : null);
      const current = selected;
      if (!matchesCurrentWorkspace && !reason) current.preview = await ensureClones(after).confirm(selection.selectionId, after);
      if (selected !== current || generation !== selectionGeneration) throw new RepositoryError("context_changed");
      phase = "selected";
      onChange();
      return {
        selectionId: selection.selectionId,
        repository,
        accountLabel: remote.connection.snapshot().accountLabel ?? "Microsoft account",
        matchesCurrentWorkspace,
        operationId: current.preview?.operationId ?? operationId,
        destination: current.preview?.destination ?? join6(home, "SpecKitCanvas", "repositories", operationId, "checkout"),
        confirmation: current.preview?.confirmation ?? null,
        expiresAt: current.preview?.expiresAt ?? null,
        reason
      };
    },
    async clone(selectionId, confirmation, requestId) {
      text(selectionId);
      text(confirmation);
      text(requestId);
      const { snapshot } = await readLocal();
      const reason = preparationReason(snapshot);
      if (reason) throw new RepositoryError(reason);
      const current = selected;
      if (!current || current.selection.selectionId !== selectionId || current.contextId !== localContextId || !current.preview || !clones) throw new RepositoryError("context_changed");
      activeOperationId = current.preview.operationId;
      const first = !automatic.has(activeOperationId);
      if (first) automatic.set(activeOperationId, { source: structuredClone(snapshot), eligible: supportsRemotePreparation(snapshot) });
      try {
        const started = await clones.start(activeOperationId, confirmation, requestId);
        if (first) continueAfterPreparation(activeOperationId);
        return started;
      } catch (error) {
        automatic.get(current.preview.operationId).eligible = false;
        if (clones.status(current.preview.operationId).state === "awaiting_confirmation") {
          activeOperationId = void 0;
          phase = "selected";
          onChange();
        }
        throw error;
      }
    },
    async operation(operationId) {
      text(operationId);
      if (retainedOperation?.operationId === operationId) {
        await authorizedRecord(operationId);
        return { ...retainedOperation, ...handoffError ? { error: handoffError } : {} };
      }
      if (clones) return clones.authorized(operationId);
      const authorized = await authorizedRecord(operationId);
      return {
        operationId,
        state: "prepared",
        repositoryName: authorized.repository.name,
        branch: authorized.record.defaultRef,
        sourceCommit: authorized.record.sourceCommit,
        localBranch: authorized.record.branch.slice(11),
        destination: authorized.record.destination
      };
    },
    async cancel(operationId, requestId) {
      text(operationId);
      text(requestId);
      if (!clones) throw new RepositoryError("resource_unavailable");
      const before = await clones.authorized(operationId);
      if (automatic.has(operationId)) automatic.get(operationId).eligible = false;
      clones.cancel(operationId);
      if (before.state === "awaiting_confirmation" && selected?.preview?.operationId === operationId) {
        selected = void 0;
        selectionGeneration++;
        phase = "chooser";
        onChange();
      }
      await clones.completion(operationId);
      return clones.authorized(operationId);
    },
    async handoff(operationId, contextId, requestId) {
      text(operationId);
      text(contextId);
      text(requestId);
      const local = await readLocal();
      if (contextId !== localContextId) throw new RepositoryError("context_changed");
      const reason = remoteReason(local.snapshot);
      if (reason) throw new RepositoryError(reason);
      const existing = retries.get(requestId);
      if (existing) {
        if (existing.operationId !== operationId || existing.contextId !== contextId) throw new RepositoryError("context_changed");
        return existing.completion;
      }
      if (retries.size >= 32) throw new RepositoryError("invalid_context");
      if (automatic.has(operationId)) automatic.get(operationId).eligible = false;
      const completion = performHandoff(operationId, local.snapshot, true);
      retries.set(requestId, { operationId, contextId, completion });
      return completion;
    },
    async preparations() {
      const remote = remoteAvailable();
      const access = await remote.connection.access();
      const fingerprint2 = createHash7("sha256").update(JSON.stringify(remote.profile)).digest("hex");
      const result = await store.list();
      if (result.hasMore) throw new RepositoryError("clone_conflict");
      const items = [];
      for (const item of result.items) {
        const record3 = item.record;
        if (!record3 || record3.accountKey !== accountKey(access) || record3.profileFingerprint !== fingerprint2) continue;
        try {
          const repository = await remote.discovery.detail(record3.repositoryId);
          access.assertCurrent();
          items.push({
            operationId: record3.operationId,
            repositoryName: repository.name,
            sourceCommit: record3.sourceCommit,
            destination: record3.destination,
            state: "prepared",
            handoffState: record3.handoff?.status ?? null
          });
        } catch {
          access.assertCurrent();
        }
      }
      return { items };
    },
    connect() {
      if (disposed || !connection) throw new RepositoryError("connection_required");
      return connection.connect();
    },
    disconnect() {
      connection?.disconnect();
      discovery?.clear();
      onChange();
    },
    search(query, cursor) {
      if (disposed || !discovery) throw new RepositoryError("connection_required");
      return discovery.search(query, cursor);
    },
    relevant(cursor) {
      if (disposed || !discovery) throw new RepositoryError("connection_required");
      return discovery.relevant(cursor);
    },
    detail(repositoryId) {
      if (disposed || !discovery) throw new RepositoryError("connection_required");
      return discovery.detail(repositoryId);
    },
    async settled() {
      await clones?.settled();
      await Promise.all(pending);
    },
    dispose() {
      disposed = true;
      clones?.dispose();
      connection?.dispose();
      discovery?.dispose();
      host.dispose();
    }
  };
  return service;
}
function text(input, maximum = 256) {
  if (typeof input !== "string" || !input || input.length > maximum || /[\p{Cc}]/u.test(input)) throw new RepositoryError("invalid_request");
  return input;
}
async function requestBody(req, strict = false) {
  if (!/^application\/json(?:;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new RepositoryError("invalid_request");
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32768) throw new RepositoryError("invalid_request");
    chunks.push(chunk);
  }
  try {
    const raw = strict ? new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)) : Buffer.concat(chunks).toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    if (strict && (0, import_yaml4.parseDocument)(raw, { schema: "json", uniqueKeys: true }).errors.length) throw new Error();
    return parsed;
  } catch {
    throw new RepositoryError("invalid_request");
  }
}
async function handleRepositoryRequest(req, res, url, service) {
  function json(status, payload) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(JSON.stringify(payload));
  }
  try {
    if (req.method !== "GET" && req.method !== "POST") throw new RepositoryError("invalid_request");
    if (req.method === "POST" && req.headers.origin !== url.origin) throw new RepositoryError("invalid_request");
    const path3 = url.pathname.slice("/api/repositories/".length);
    const queries = { connection: [], relevant: ["cursor"], search: ["q", "cursor"], detail: ["repositoryId"] };
    const bodies = { connect: [], disconnect: [] };
    const allowed = req.method === "GET" ? queries[path3] : bodies[path3];
    if (!allowed) throw new RepositoryError("invalid_request");
    for (const key of url.searchParams.keys()) {
      if (url.searchParams.getAll(key).length !== 1 || key !== "cap" && (req.method !== "GET" || !allowed.includes(key))) throw new RepositoryError("invalid_request");
    }
    const body = req.method === "POST" ? await requestBody(req) : {};
    if (Object.keys(body).some((key) => !allowed.includes(key))) throw new RepositoryError("invalid_request");
    const query = (key, maximum) => text(url.searchParams.get(key), maximum);
    const cursor = url.searchParams.has("cursor") ? query("cursor", 8192) : void 0;
    let data;
    if (path3 === "connection") data = service.snapshot();
    else if (path3 === "connect") {
      const started = service.connect();
      json(202, { ok: true, data: { transactionId: started.transactionId } });
      return;
    } else if (path3 === "disconnect") {
      service.disconnect();
      data = service.snapshot();
    } else if (path3 === "search") data = await service.search(query("q"), cursor);
    else if (path3 === "relevant") data = await service.relevant(cursor);
    else if (path3 === "detail") data = await service.detail(query("repositoryId"));
    else throw new RepositoryError("invalid_request");
    json(200, { ok: true, data });
  } catch (error) {
    const envelope = errorEnvelope(error);
    const status = envelope.error.code === "invalid_request" ? 400 : envelope.error.code === "resource_unavailable" ? 404 : ["connection_required", "interaction_required"].includes(envelope.error.code) ? 401 : ["wrong_tenant", "insufficient_scope", "policy_blocked"].includes(envelope.error.code) ? 403 : envelope.error.code === "rate_limited" ? 429 : envelope.error.code === "upstream_unavailable" ? 503 : 409;
    json(status, envelope);
  }
}
async function handleEntryRequest(req, res, url, entry) {
  function json(status, payload) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(JSON.stringify(payload));
  }
  try {
    if (!url.pathname.startsWith("/api/entry/") || !["GET", "POST"].includes(req.method ?? "")) throw new RepositoryError("invalid_request");
    if (req.method === "POST" && req.headers.origin !== url.origin) throw new RepositoryError("invalid_request");
    const path3 = url.pathname.slice("/api/entry/".length);
    const operation = /^operations\/([a-f0-9]{32})(?:\/(cancel|handoff))?$/.exec(path3);
    const route = operation ? operation[2] ? `operation-${operation[2]}` : "operation" : path3;
    const queries = /* @__PURE__ */ new Map([["state", []], ["operation", []], ["preparations", []]]);
    const bodies = /* @__PURE__ */ new Map([
      ["local", ["contextId", "requestId"]],
      ["direct", ["requestId"]],
      ["selection", ["repositoryId", "contextId"]],
      ["clone", ["selectionId", "confirmation", "requestId"]],
      ["operation-cancel", ["requestId"]],
      ["operation-handoff", ["contextId", "requestId"]]
    ]);
    const allowed = (req.method === "GET" ? queries : bodies).get(route);
    if (!allowed) throw new RepositoryError("invalid_request");
    for (const key of url.searchParams.keys()) {
      if (key !== "cap" || url.searchParams.getAll(key).length !== 1) throw new RepositoryError("invalid_request");
    }
    const body = req.method === "POST" ? await requestBody(req, true) : {};
    if (Object.keys(body).some((key) => !allowed.includes(key))) throw new RepositoryError("invalid_request");
    let data;
    let status = 200;
    if (route === "state") data = await entry.state();
    else if (route === "direct") {
      if (!entry.direct) throw new RepositoryError("canvas_unavailable");
      data = await entry.direct(text(body.requestId));
    } else if (route === "selection" && entry.select) data = await entry.select(text(body.repositoryId), text(body.contextId));
    else if (route === "clone" && entry.clone) {
      data = await entry.clone(text(body.selectionId), text(body.confirmation), text(body.requestId));
      status = 202;
    } else if (route === "operation" && entry.operation) data = await entry.operation(operation[1]);
    else if (route === "operation-cancel" && entry.cancel) data = await entry.cancel(operation[1], text(body.requestId));
    else if (route === "operation-handoff" && entry.handoff) data = await entry.handoff(operation[1], text(body.contextId), text(body.requestId));
    else if (route === "preparations" && entry.preparations) data = await entry.preparations();
    else if (route === "local") data = await entry.local(text(body.contextId), text(body.requestId));
    else throw new RepositoryError("invalid_request");
    json(status, { ok: true, data });
  } catch (error) {
    const envelope = errorEnvelope(error);
    json(repositoryErrorStatus(envelope.error.code), envelope);
  }
}
export {
  createEntryCoordinator,
  createHostHandoffAdapter,
  createRepositoryService,
  createWorkflowBinding,
  handleEntryRequest,
  handleRepositoryRequest,
  loadEntrySettings
};
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

@azure/msal-node/dist/cache/serializer/Serializer.mjs:
@azure/msal-node/dist/cache/serializer/Deserializer.mjs:
@azure/msal-node/dist/internals.mjs:
@azure/msal-node/dist/utils/Constants.mjs:
@azure/msal-node/dist/network/HttpClient.mjs:
@azure/msal-node/dist/error/ManagedIdentityErrorCodes.mjs:
@azure/msal-node/dist/error/ManagedIdentityError.mjs:
@azure/msal-node/dist/config/ManagedIdentityId.mjs:
@azure/msal-node/dist/error/NodeAuthError.mjs:
@azure/msal-node/dist/config/Configuration.mjs:
@azure/msal-node/dist/crypto/GuidGenerator.mjs:
@azure/msal-node/dist/utils/EncodingUtils.mjs:
@azure/msal-node/dist/crypto/HashUtils.mjs:
@azure/msal-node/dist/crypto/PkceGenerator.mjs:
@azure/msal-node/dist/crypto/CryptoProvider.mjs:
@azure/msal-node/dist/cache/CacheHelpers.mjs:
@azure/msal-node/dist/cache/NodeStorage.mjs:
@azure/msal-node/dist/cache/TokenCache.mjs:
@azure/msal-node/dist/error/ClientAuthErrorCodes.mjs:
@azure/msal-node/dist/client/ClientAssertion.mjs:
@azure/msal-node/dist/packageMetadata.mjs:
@azure/msal-node/dist/client/BaseClient.mjs:
@azure/msal-node/dist/client/UsernamePasswordClient.mjs:
@azure/msal-node/dist/protocol/Authorize.mjs:
@azure/msal-node/dist/client/ClientApplication.mjs:
@azure/msal-node/dist/network/LoopbackClient.mjs:
@azure/msal-node/dist/client/DeviceCodeClient.mjs:
@azure/msal-node/dist/client/PublicClientApplication.mjs:
@azure/msal-node/dist/client/ClientCredentialClient.mjs:
@azure/msal-node/dist/client/OnBehalfOfClient.mjs:
@azure/msal-node/dist/client/UserFederatedIdentityCredentialClient.mjs:
@azure/msal-node/dist/client/ConfidentialClientApplication.mjs:
@azure/msal-node/dist/utils/TimeUtils.mjs:
@azure/msal-node/dist/network/HttpClientWithRetries.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/BaseManagedIdentitySource.mjs:
@azure/msal-node/dist/retry/LinearRetryStrategy.mjs:
@azure/msal-node/dist/retry/DefaultManagedIdentityRetryPolicy.mjs:
@azure/msal-node/dist/config/ManagedIdentityRequestParameters.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/AppService.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/AzureArc.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/CloudShell.mjs:
@azure/msal-node/dist/retry/ExponentialRetryStrategy.mjs:
@azure/msal-node/dist/retry/ImdsRetryPolicy.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/Imds.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/ServiceFabric.mjs:
@azure/msal-node/dist/client/ManagedIdentitySources/MachineLearning.mjs:
@azure/msal-node/dist/client/ManagedIdentityClient.mjs:
@azure/msal-node/dist/client/ManagedIdentityApplication.mjs:
@azure/msal-node/dist/cache/distributed/DistributedCachePlugin.mjs:
@azure/msal-node/dist/index.mjs:
  (*! @azure/msal-node v6.0.0 2026-08-28 *)

@azure/msal-common/dist/constants/AADServerParamKeys.mjs:
@azure/msal-common/dist/utils/Constants.mjs:
@azure/msal-common/dist/error/AuthError.mjs:
@azure/msal-common/dist/error/ClientAuthError.mjs:
@azure/msal-common/dist/error/ClientAuthErrorCodes.mjs:
@azure/msal-common/dist/account/ClientInfo.mjs:
@azure/msal-common/dist/account/AuthToken.mjs:
@azure/msal-common/dist/account/AccountInfo.mjs:
@azure/msal-common/dist/authority/AuthorityType.mjs:
@azure/msal-common/dist/account/TokenClaims.mjs:
@azure/msal-common/dist/authority/ProtocolMode.mjs:
@azure/msal-common/dist/cache/utils/AccountEntityUtils.mjs:
@azure/msal-common/dist/error/AuthErrorCodes.mjs:
@azure/msal-common/dist/error/ClientConfigurationError.mjs:
@azure/msal-common/dist/error/ClientConfigurationErrorCodes.mjs:
@azure/msal-common/dist/authority/OpenIdConfigResponse.mjs:
@azure/msal-common/dist/utils/StringUtils.mjs:
@azure/msal-common/dist/url/UrlString.mjs:
@azure/msal-common/dist/authority/AuthorityMetadata.mjs:
@azure/msal-common/dist/authority/AuthorityOptions.mjs:
@azure/msal-common/dist/authority/CloudInstanceDiscoveryResponse.mjs:
@azure/msal-common/dist/authority/CloudInstanceDiscoveryErrorResponse.mjs:
@azure/msal-common/dist/telemetry/performance/PerformanceEvents.mjs:
@azure/msal-common/dist/utils/FunctionWrappers.mjs:
@azure/msal-common/dist/authority/RegionDiscovery.mjs:
@azure/msal-common/dist/utils/TimeUtils.mjs:
@azure/msal-common/dist/cache/utils/CacheHelpers.mjs:
@azure/msal-common/dist/authority/Authority.mjs:
@azure/msal-common/dist/authority/AuthorityFactory.mjs:
@azure/msal-common/dist/request/ScopeSet.mjs:
@azure/msal-common/dist/request/RequestParameterBuilder.mjs:
@azure/msal-common/dist/utils/UrlUtils.mjs:
@azure/msal-common/dist/crypto/ICrypto.mjs:
@azure/msal-common/dist/crypto/ITokenBindingKeyManager.mjs:
@azure/msal-common/dist/logger/Logger.mjs:
@azure/msal-common/dist/packageMetadata.mjs:
@azure/msal-common/dist/error/CacheErrorCodes.mjs:
@azure/msal-common/dist/error/CacheError.mjs:
@azure/msal-common/dist/cache/CacheManager.mjs:
@azure/msal-common/dist/telemetry/performance/PerformanceEvent.mjs:
@azure/msal-common/dist/telemetry/performance/StubPerformanceClient.mjs:
@azure/msal-common/dist/config/ClientConfiguration.mjs:
@azure/msal-common/dist/cache/persistence/TokenCacheContext.mjs:
@azure/msal-common/dist/error/JoseHeaderError.mjs:
@azure/msal-common/dist/utils/ObjectUtils.mjs:
@azure/msal-common/dist/error/JoseHeaderErrorCodes.mjs:
@azure/msal-common/dist/crypto/JoseHeader.mjs:
@azure/msal-common/dist/crypto/PopTokenGenerator.mjs:
@azure/msal-common/dist/crypto/DpopProofGenerator.mjs:
@azure/msal-common/dist/error/InteractionRequiredAuthErrorCodes.mjs:
@azure/msal-common/dist/error/InteractionRequiredAuthError.mjs:
@azure/msal-common/dist/error/ServerError.mjs:
@azure/msal-common/dist/utils/ProtocolUtils.mjs:
@azure/msal-common/dist/response/ResponseHandler.mjs:
@azure/msal-common/dist/account/CcsCredential.mjs:
@azure/msal-common/dist/utils/ClientAssertionUtils.mjs:
@azure/msal-common/dist/network/RequestThumbprint.mjs:
@azure/msal-common/dist/network/ThrottlingUtils.mjs:
@azure/msal-common/dist/error/NetworkError.mjs:
@azure/msal-common/dist/protocol/Token.mjs:
@azure/msal-common/dist/client/AuthorizationCodeClient.mjs:
@azure/msal-common/dist/protocol/Authorize.mjs:
@azure/msal-common/dist/client/RefreshTokenClient.mjs:
@azure/msal-common/dist/telemetry/server/ServerTelemetryManager.mjs:
@azure/msal-common/dist/client/SilentFlowClient.mjs:
@azure/msal-common/dist/request/BaseAuthRequest.mjs:
@azure/msal-common/dist/index-node.mjs:
  (*! @azure/msal-common v16.14.0 2026-08-28 *)
*/
