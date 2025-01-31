const Graph = require("../graph");

// 
// Todo, make it more efficient when applying Theorem 4. Maybe use path compression, etc, from the 
// modern compiler implementation in C. For now this seems fine so no worries.
// 


// 
// Takes as input a graph and the start node.
// If debug is set to true, it prints the generated numbered DFSTree and computed semidominators
// 
function dominatorTarjan(g, vs, debug = false) {
  // Assert Directed
  if (!g.isDirected()) throw new ExpectedDirectedGraph();

  // 1. Numbered DFS Tree
  let dfsTree = getDFSTree(g, vs);
  
  // 2. Apply Theorem 4, compute sdom for each node (in decreasing order of dfsId)
  let sdom = (w) => {
    let wData = dfsTree.node(w);

    // Return precomputed result if it exists
    if (wData.sdom) return wData.sdom;
    
    let candidates = [];
    // incoming
    let incomingNodes = g.predecessors(w);

    // case a. Immediate incoming edge from the tree with the lowest dfs id.
    let wDfsId = wData.dfsId;
    candidates = [...incomingNodes.filter(n => dfsTree.node(n).dfsId < wDfsId)];

    // case b. Nodes whose dfs number is bigger than that of "w"
    let lNodes = dfsTree.nodes().filter(n => dfsTree.node(n).dfsId > wDfsId);
    
    for (let v of incomingNodes) {
      for (let u of lNodes) {
        // { sdom(u) | u > w and there is an edge (v, w) such that u -*-> v } 
        if (isAncestor(u, v, dfsTree)) {
          candidates.push(sdom(u));
        }
      }
    }

    // Min candidate 
    let sdomRes = [undefined, undefined];
    for (let c of candidates) {
      let cDfsId = dfsTree.node(c).dfsId;
      if (sdomRes[0] === undefined || cDfsId < sdomRes[1]) { sdomRes = [c, cDfsId]; continue; }
    }
    wData.sdom = sdomRes[0];
    return sdomRes[0];
  };

  let desOrder = [...dfsTree.nodes()].sort((x, y) => dfsTree.node(y).dfsId - dfsTree.node(x).dfsId);

  for (let w of desOrder) {
    if (w === vs) continue;
    sdom(w);
  }

  if (debug) console.log(generateDFSHighlightedGraphAsDOT(g, dfsTree));

  // 3. Apply Corollary 1, compute idom
  // Compute "u" for each node
  let populateCandidateUs = (w_prime, w, dfsTree, resultHolder) => {
    // All the successors of "w_prime" which can reach "w" are added to resultHolder recursively
    let succ = dfsTree.successors(w_prime);
    for (let s of succ) {
      if (isAncestor(s, w, dfsTree)) {
        resultHolder.push(s);
        populateCandidateUs(s, w, dfsTree, resultHolder);
      }
    }
  };

  for (let w of desOrder) {
    if (w === vs) continue;    
    let candidateUs = [];
    let wData = dfsTree.node(w);
    let sdomOfW = wData.sdom;
    populateCandidateUs(sdomOfW, w, dfsTree, candidateUs);
    candidateUs.sort((x, y) => dfsTree.node(dfsTree.node(x).sdom).dfsId - dfsTree.node(dfsTree.node(y).sdom).dfsId);

    wData.candidateU = candidateUs[0];
  }

  let idom = (w) => {
    let wData = dfsTree.node(w);
    if (wData.idom) return wData.idom;

    let uData = dfsTree.node(wData.candidateU);

    let sdomW = wData.sdom;
    let sdomU = uData.sdom;

    let finalRes;

    if (sdomW === sdomU) {
      finalRes = sdomW;
    } else {
      finalRes = idom(wData.candidateU);
    }

    wData.idom = finalRes;

    return finalRes;
  };

  for (let w of desOrder) {
    if (w === vs) continue;
    idom(w);
  }

  // 4. Generate Dominator Tree
  let dTree = new Graph({ directed: true });
  for (let n of desOrder) {
    dTree.setNode(n);
    if (n === vs) continue;
    let nData = dfsTree.node(n);
    dTree.setEdge(nData.idom, n);
  }

  return dTree;
}

class ExpectedDirectedGraph extends Error {
  constructor() {
    super(...arguments);
  }
}

class NonObjectNodeData extends Error {
  constructor() {
    super(...arguments);
  }
}

module.exports = dominatorTarjan;
dominatorTarjan.NonObjectNodeData = NonObjectNodeData;
dominatorTarjan.ExpectedDirectedGraph = ExpectedDirectedGraph;
dominatorTarjan.getDfsTree = getDFSTree;

function generateDFSHighlightedGraphAsDOT(g, dfsTree) {
  let res = [];
  res.push("digraph DFSTree {");
  res.push("  graph [nodesep=1.0, ranksep=1.5]; // Adjust separation");
  for (let e of g.edges()) {
    let dfsHasEdge = dfsTree.hasEdge(e.v, e.w);
    let edge = "  " + e.v + " -> " + e.w + (dfsHasEdge ? ";" : " [style=\"dashed\"];");
    res.push(edge);
  }
  for (let n of dfsTree.nodes()) {
    let dfsId = dfsTree.node(n).dfsId;
    let sdom = dfsTree.node(n).sdom ? dfsTree.node(n).sdom : "_";
    let nodeInfo = "  " +  n + "[label=\"" + n + "\", xlabel=\"(" + dfsId + "," + sdom + ")\"]";
    res.push(nodeInfo);
  }
  res.push("}");
  return res.join("\n");
}


function getDFSTree(origGraph, rootNode) {
  let markCount = 1;
  let timer = 1; // Initialize the timer for inTime and outTime

  // Mark node with a unique DFS ID
  let markNode = (graph, node) => {
    let nodeData = graph.node(node);
    if (!(nodeData instanceof Object)) throw new NonObjectNodeData();

    nodeData.dfsId = markCount++;
  };

  let resGraph = new Graph({ directed: true });
  let visited = new Set();

  // DFS function
  let visitDFS = (node) => {
    visited.add(node); // Mark node as visited
    resGraph.setNode(node, {}); // Add node to the resulting graph

    let nodeData = resGraph.node(node);
    nodeData.inTime = timer++; // Set inTime
    markNode(resGraph, node); // Assign DFS ID

    // Visit successors in DFS
    let successors = origGraph.successors(node);
    for (let succ of successors) {
      if (visited.has(succ)) continue; // Skip already visited nodes
      resGraph.setEdge(node, succ); // Add edge to the resulting graph
      visitDFS(succ); // Recursive DFS call
    }

    nodeData.outTime = timer++; // Set outTime after processing all children
  };

  visitDFS(rootNode); // Start DFS from the root
  return resGraph;
}

function isAncestor(u, v, dfsTree) {
  const uData = dfsTree.node(u);
  const vData = dfsTree.node(v);
  return uData.inTime <= vData.inTime && uData.outTime >= vData.outTime;
}