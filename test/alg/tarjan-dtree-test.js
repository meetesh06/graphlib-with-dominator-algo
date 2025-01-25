var expect = require("../chai").expect;
var Graph = require("../..").Graph;
var dominatorTarjan = require("../..").alg.dominatorTarjan;

describe("alg.tarjanDtree", function () {


  it("test1", function () {
    // Create a new directed graph
    const graph = new Graph({ directed: true });
    // Add nodes
    const nodes = ['R', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    nodes.forEach((node) => graph.setNode(node));
    // Add edges
    const edges = [
      ['R', 'C'], ['R', 'B'], ['R', 'A'],
      ['A', 'D'],
      ['B', 'E'], ['B', 'A'], ['B', 'D'],
      ['C', 'F'], ['C', 'G'],
      ['D', 'L'],
      ['E', 'H'],
      ['F', 'I'],
      ['G', 'I'], ['G', 'J'],
      ['H', 'E'], ['H', 'K'],
      ['I', 'K'],
      ['J', 'I'],
      ['K', 'R'], ['K', 'I'],
      ['L', 'H']
    ];
    edges.forEach(([from, to]) => graph.setEdge(from, to));
    let domTree = dominatorTarjan(graph, "R");
    let expectedResult = {
      'R': [],
      'A': ['R'],
      'B': ['R'],
      'C': ['R'],
      'D': ['R'],
      'E': ['R'],
      'F': ['C'],
      'G': ['C'],
      'H': ['R'],
      'I': ['R'],
      'J': ['G'],
      'K': ['R'],
      'L': ['D'],
    }
    for (let n of nodes) {
      let obtainedRes = domTree.predecessors(n)
      let expectedRes = expectedResult[n]
      expect(obtainedRes).to.eql(expectedRes);
    }
  });

  it("test2", function () {
    // Create a new directed graph
    const graph = new Graph({ directed: true });

    // Add nodes
    const nodes = ['r', 'd', 's', 'y', 'm3', 'n', 'x', 'm1', 'u', 'm2', 'v'];
    nodes.forEach((node) => graph.setNode(node));
    // Add edges
    const edges = [
      ['r', 'd'],
      ['d', 's'], ['d', 'x'],
      ['s', 'y'], ['s', 'u'],
      ['y', 'm3'],
      ['m3', 'n'],
      ['x', 'm1'],
      ['m1', 'y'],
      ['s', 'u'],
      ['u', 'm2'],
      ['m2', 'v'],
      ['v', 'n'],
    ];
    edges.forEach(([from, to]) => graph.setEdge(from, to));

    let domTree = dominatorTarjan(graph, "r")

    let expectedResult = {
      'r': [],
      'd': ['r'],
      's': ['d'],
      'y': ['d'],
      'm3': ['y'],
      'n': ['d'],
      'x': ['d'],
      'm1': ['x'],
      'u': ['s'],
      'm2': ['u'],
      'v': ['m2']
    }
    for (let n of nodes) {
      let obtainedRes = domTree.predecessors(n)
      let expectedRes = expectedResult[n]
      expect(obtainedRes).to.eql(expectedRes);
    }
  });
});

// A helper that sorts components and their contents
function sort(cmpts) {
  return cmpts.map(cmpt => cmpt.sort()).sort((a, b) => a[0].localeCompare(b[0]));
}
