/* map-live.js - the map bench for learn-mind-mapping-with-phoebe.
 *
 * A real outline goes in, a real radial map comes out, and every number the bench
 * reports is computed from that outline or read back off the rendered SVG after it
 * is drawn. Nothing is looked up from a table of "what the lever should do".
 *
 * Two kinds of number, and the widget labels each one:
 *   measured  - counted in the parsed tree or the rendered DOM
 *   heuristic - the one-line verdict, which is a rule of thumb and says so
 *
 * There is no recall estimate anywhere in here. The evidence on what a mind map does
 * for memory is contested and the course teaches the disagreement rather than
 * modelling a side of it.
 *
 * Public API (window.MAP_LIVE) exists so the course map and the session pages can be
 * verified against a live browser rather than against my memory of one.
 */
(function () {
  "use strict";

  /* ---------- the outlines --------------------------------------------- */
  /* One meeting at Daybreak, the coffee subscription company from the sibling
     courses: planning the autumn roast launch. The same fourteen things were said
     in every version. Only the shape changes. Two-space indentation, first line is
     the centre. */
  var PRESETS = [
    { id: "captured", label: "As captured",
      note: "One line per thing said, in the order it was said. This is what most notes look like.",
      text: [
        "Autumn roast launch",
        "  Launch date is pencilled for the second week of October",
        "  Guji supply is still short so the autumn blend leans on Sidamo",
        "  Packaging needs a new sleeve because the old one names Guji",
        "  Email to subscribers goes out ten days before launch",
        "  Pricing stays at the current tier for existing subscribers",
        "  New subscribers see the seasonal price for the first two months",
        "  The roastery can do the first batch of four thousand bags by the first of October",
        "  We need three product photos and one short video for the launch email",
        "  Customer support wants the FAQ a week before the email goes out",
        "  Legal has to sign off the sleeve copy because of the origin claim",
        "  The landing page copy is owed by marketing on the twentieth",
        "  Retention wants a win-back offer for lapsed Guji subscribers in the launch",
        "  Finance wants the seasonal price modelled before we commit",
        "  Someone has to own the launch checklist and it is not clear who"
      ].join("\n") },

    { id: "grouped", label: "Grouped into branches",
      note: "The same lines sorted under five headings. Nothing shortened yet.",
      text: [
        "Autumn roast launch",
        "  Supply",
        "    Guji supply is still short so the autumn blend leans on Sidamo",
        "    The roastery can do the first batch of four thousand bags by the first of October",
        "  Packaging",
        "    Packaging needs a new sleeve because the old one names Guji",
        "    Legal has to sign off the sleeve copy because of the origin claim",
        "  Pricing",
        "    Pricing stays at the current tier for existing subscribers",
        "    New subscribers see the seasonal price for the first two months",
        "    Finance wants the seasonal price modelled before we commit",
        "  Communications",
        "    Email to subscribers goes out ten days before launch",
        "    We need three product photos and one short video for the launch email",
        "    Customer support wants the FAQ a week before the email goes out",
        "    The landing page copy is owed by marketing on the twentieth",
        "    Retention wants a win-back offer for lapsed Guji subscribers in the launch",
        "  Ownership",
        "    Launch date is pencilled for the second week of October",
        "    Someone has to own the launch checklist and it is not clear who"
      ].join("\n") },

    { id: "keywords", label: "One keyword per branch",
      note: "Each line cut to the word or two that brings the rest back. Detail moves one level out.",
      text: [
        "Autumn roast launch",
        "  Supply",
        "    Guji short",
        "      Sidamo blend",
        "    First batch",
        "      4000 bags",
        "      1 Oct",
        "  Packaging",
        "    New sleeve",
        "    Legal sign-off",
        "      origin claim",
        "  Pricing",
        "    Existing: hold",
        "    New: seasonal",
        "      2 months",
        "    Price model",
        "  Comms",
        "    Email",
        "      T-10 days",
        "    Photos x3",
        "    Video x1",
        "    FAQ",
        "      T-17 days",
        "    Landing page",
        "      20th",
        "      Legal sign-off",
        "    Win-back",
        "      lapsed Guji",
        "  Ownership",
        "    Launch date",
        "      Oct week 2",
        "    Checklist owner",
        "      unassigned"
      ].join("\n") },

    { id: "onehome", label: "One home per idea",
      note: "Legal sign-off lived under Packaging and under Comms. It now lives once, with a pointer.",
      text: [
        "Autumn roast launch",
        "  Supply",
        "    Guji short",
        "      Sidamo blend",
        "    First batch",
        "      4000 bags",
        "      1 Oct",
        "  Packaging",
        "    New sleeve",
        "    Legal sign-off",
        "      origin claim",
        "      see Comms",
        "  Pricing",
        "    Existing: hold",
        "    New: seasonal",
        "      2 months",
        "    Price model",
        "  Comms",
        "    Email",
        "      T-10 days",
        "    Photos x3",
        "    Video x1",
        "    FAQ",
        "      T-17 days",
        "    Landing page",
        "      20th",
        "    Win-back",
        "      lapsed Guji",
        "  Ownership",
        "    Launch date",
        "      Oct week 2",
        "    Checklist owner",
        "      unassigned"
      ].join("\n") },

    { id: "rim", label: "Every point its own branch", anti: true,
      note: "Grouping felt like losing detail, so every keyword went straight onto the centre.",
      text: [
        "Autumn roast launch",
        "  Guji short", "  Sidamo blend", "  First batch", "  4000 bags", "  1 Oct",
        "  New sleeve", "  Legal sign-off", "  origin claim", "  Existing: hold",
        "  New: seasonal", "  2 months", "  Price model", "  Email", "  T-10 days",
        "  Photos x3", "  Video x1", "  FAQ", "  T-17 days", "  Landing page", "  20th",
        "  Win-back", "  lapsed Guji", "  Launch date", "  Oct week 2", "  Checklist owner",
        "  unassigned"
      ].join("\n") }
  ];

  /* Branch colours: this repo's ramp plus the flagship, cycling for the anti preset. */
  var BRANCH = ["#2F6B4F", "#B85015", "#4A7F63", "#7A3410", "#1E4A36"];
  var INK = "#14261D", MUTED = "#5F7368", FAINT = "#CFDCD4";

  var W = 880, H = 800, CX = 440, CY = 400;
  var R = [0, 160, 270, 380];              /* radius per level; deeper clamps to the last */
  var FS = 11.5, PADX = 8, LABH = 22;      /* label font size, padding, label box height */
  var CHAR = 6.6;                          /* px per character at 11.5px Inter, semibold */

  var root, ta, stage, readout, presetBtns = {}, current = null, timer = null;
  var out = {};

  /* ---------- parse --------------------------------------------------- */
  function parse(text) {
    var lines = text.replace(/\t/g, "  ").split("\n");
    var tree = null, stack = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      if (!raw.trim()) continue;
      var indent = raw.match(/^ */)[0].length;
      var level = Math.round(indent / 2);
      var node = { label: raw.trim(), children: [], level: 0 };
      if (!tree) { tree = node; stack = [node]; continue; }
      if (level < 1) level = 1;
      if (level > stack.length) level = stack.length;   /* skipped a level: clamp */
      node.level = level;
      stack.length = level;
      stack[level - 1].children.push(node);
      node.parent = stack[level - 1];
      stack.push(node);
    }
    return tree || { label: "", children: [], level: 0 };
  }

  function leaves(n) {
    if (!n.children.length) return 1;
    var s = 0;
    for (var i = 0; i < n.children.length; i++) s += leaves(n.children[i]);
    return s;
  }
  function walk(n, fn, depth) {
    depth = depth || 0;
    fn(n, depth);
    for (var i = 0; i < n.children.length; i++) walk(n.children[i], fn, depth + 1);
  }

  /* ---------- layout -------------------------------------------------- */
  /* Each first-level branch gets a slice of the circle proportional to the leaves it
     carries. Children share their parent's slice evenly. This is the ordinary radial
     rule and it is deliberately not clever: if a map only reads because the layout
     engine hid the problem, the learner has learnt the wrong thing. */
  function layout(tree) {
    var nodes = [], edges = [];
    tree.x = CX; tree.y = CY; tree.branch = -1;
    nodes.push(tree);
    var total = 0, i;
    for (i = 0; i < tree.children.length; i++) total += leaves(tree.children[i]);
    var a0 = -Math.PI / 2;
    for (i = 0; i < tree.children.length; i++) {
      var b = tree.children[i];
      var span = (leaves(b) / total) * Math.PI * 2;
      place(b, a0, a0 + span, 1, i, nodes, edges);
      a0 += span;
    }
    return { nodes: nodes, edges: edges };
  }
  function place(n, a, b, level, branch, nodes, edges) {
    var mid = (a + b) / 2, r = R[Math.min(level, R.length - 1)];
    n.x = CX + r * Math.cos(mid); n.y = CY + r * Math.sin(mid);
    n.branch = branch; n.depth = level;
    nodes.push(n);
    edges.push({ from: n.parent, to: n, branch: branch, level: level });
    if (!n.children.length) return;
    var total = 0, i;
    for (i = 0; i < n.children.length; i++) total += leaves(n.children[i]);
    var a0 = a;
    for (i = 0; i < n.children.length; i++) {
      var c = n.children[i], span = (leaves(c) / total) * (b - a);
      place(c, a0, a0 + span, level + 1, branch, nodes, edges);
      a0 += span;
    }
  }

  /* ---------- paint --------------------------------------------------- */
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function col(i) { return BRANCH[((i % BRANCH.length) + BRANCH.length) % BRANCH.length]; }

  function paint(tree) {
    var g = layout(tree), s = "", i;
    /* data-scan-skip: the estate geometry gate skips this SVG. Its collisions are the
       thing being measured, not a defect in an authored diagram. */
    s += '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" role="img" data-scan-skip ' +
         'aria-label="The outline above drawn as a radial map">';
    for (i = 0; i < g.edges.length; i++) {
      var e = g.edges[i];
      var mx = (e.from.x + e.to.x) / 2, my = (e.from.y + e.to.y) / 2;
      /* bow the curve slightly outward from the centre so branches read as branches */
      var dx = mx - CX, dy = my - CY, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var qx = mx + (dx / d) * 18, qy = my + (dy / d) * 18;
      s += '<path class="mb-edge" d="M' + e.from.x.toFixed(1) + " " + e.from.y.toFixed(1) +
           " Q" + qx.toFixed(1) + " " + qy.toFixed(1) + " " + e.to.x.toFixed(1) + " " + e.to.y.toFixed(1) +
           '" stroke="' + (e.level === 1 ? col(e.branch) : FAINT) + '" stroke-width="' +
           (e.level === 1 ? 3 : 1.5) + '"/>';
    }
    for (i = 0; i < g.nodes.length; i++) {
      var n = g.nodes[i];
      if (n === tree) {
        var rw = Math.max(120, n.label.length * 7.4 + 24), rh = 40;
        s += '<rect class="mb-lab mb-lab-root" data-level="0" x="' + (n.x - rw / 2).toFixed(1) + '" y="' + (n.y - rh / 2) +
             '" width="' + rw.toFixed(1) + '" height="' + rh + '" rx="12" fill="' + "#1E4A36" + '"/>';
        s += '<text class="mb-root" x="' + n.x + '" y="' + (n.y + 4.5) + '" text-anchor="middle">' + esc(n.label) + "</text>";
        continue;
      }
      var w = n.label.length * CHAR + PADX * 2;
      var fill = n.depth === 1 ? col(n.branch) : "#FFFFFF";
      var stroke = n.depth === 1 ? "none" : col(n.branch);
      var tc = n.depth === 1 ? "#FFFFFF" : INK;
      s += '<rect class="mb-lab" data-level="' + n.depth + '" x="' + (n.x - w / 2).toFixed(1) + '" y="' + (n.y - LABH / 2).toFixed(1) +
           '" width="' + w.toFixed(1) + '" height="' + LABH + '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2"/>';
      s += '<text class="mb-lab" x="' + n.x.toFixed(1) + '" y="' + (n.y + 4).toFixed(1) + '" text-anchor="middle" fill="' + tc + '">' + esc(n.label) + "</text>";
    }
    s += "</svg>";
    stage.innerHTML = s;
    measure(tree);
  }

  /* ---------- measure ------------------------------------------------- */
  function words(t) { var m = t.trim().split(/\s+/); return m[0] ? m.length : 0; }

  function measure(tree) {
    /* from the parsed tree */
    var branches = tree.children.length, depth = 0, count = 0, wsum = 0, shortN = 0;
    var homes = {};
    walk(tree, function (n, d) {
      if (n === tree) return;
      count++; depth = Math.max(depth, d);
      var w = words(n.label); wsum += w; if (w <= 2) shortN++;
      var key = n.label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      var top = n; while (top.parent && top.parent !== tree) top = top.parent;
      (homes[key] = homes[key] || {})[tree.children.indexOf(top)] = 1;
    });
    var shared = 0;
    for (var k in homes) if (Object.keys(homes[k]).length > 1) shared++;
    var lv = tree.children.map(leaves);
    var balance = lv.length ? Math.max.apply(null, lv) / Math.min.apply(null, lv) : 0;

    /* from the rendered SVG: label boxes read back with getBBox */
    var svg = stage.querySelector("svg");
    var rects = [].slice.call(stage.querySelectorAll("rect.mb-lab"));
    var boxes = rects.map(function (r) { var b = r.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
    var collisions = 0, offPage = 0, i, j;
    for (i = 0; i < boxes.length; i++) {
      var a = boxes[i];
      if (a.x < 0 || a.y < 0 || a.x + a.w > W || a.y + a.h > H) offPage++;
      for (j = i + 1; j < boxes.length; j++) {
        var b = boxes[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) collisions++;
      }
    }
    var scale = svg ? svg.getBoundingClientRect().width / W : 1;
    var minPx = Math.round(FS * scale * 10) / 10;

    out = { nodes: count, branches: branches, depth: depth,
            meanWords: count ? Math.round(wsum / count * 10) / 10 : 0,
            shortShare: count ? Math.round(shortN / count * 100) : 0,
            balance: Math.round(balance * 10) / 10,
            shared: shared, collisions: collisions, offPage: offPage, minPx: minPx };
    render();
  }

  /* The verdict is a rule of thumb and is labelled as one on the widget. The two
     numbers it leans on, four and seven, are the two capacity estimates the course
     teaches side by side (Cowan 2001, Miller 1956). Neither is a law about mind maps. */
  function grade() {
    if (out.branches === 0) return ["bad", "Nothing to map yet"];
    if (out.branches === 1 || (out.depth === 1 && out.branches > 7))
      return ["bad", out.depth === 1 && out.branches > 7 ? "A list wearing a circle" : "One branch is an outline, not a map"];
    if (out.branches > 7) return ["bad", out.branches + " main branches is more than anyone holds"];
    if (out.collisions + out.offPage > 2) return ["bad", "The labels do not fit the page"];
    if (out.shortShare < 60) return ["ok", "Right shape, still written in sentences"];
    if (out.shared > 0) return ["ok", "Readable, and one idea lives in two branches"];
    if (out.branches <= 7 && out.branches >= 3 && out.collisions === 0 && out.offPage === 0)
      return ["good", "Reads at a glance"];
    return ["ok", "Readable"];
  }

  function metric(label, value, unit, kind) {
    return '<div class="mb-metric"><span class="mb-mlabel">' + label + "</span>" +
           '<span class="mb-mvalue">' + value + "</span>" +
           '<span class="mb-munit">' + unit + "</span>" +
           '<span class="mb-mkind is-' + kind + '">' + kind + "</span></div>";
  }

  function render() {
    var g = grade();
    readout.innerHTML =
      '<div class="mb-verdict is-' + g[0] + '">' + esc(g[1]) + ' <span class="mb-mkind is-heuristic">heuristic</span></div>' +
      '<div class="mb-metrics">' +
        metric("Main branches", out.branches, "off the centre", "measured") +
        metric("Levels deep", out.depth, "centre not counted", "measured") +
        metric("Words per node", out.meanWords, out.shortShare + "% are 1-2 words", "measured") +
        metric("Fattest to thinnest branch", out.balance + "x", "by leaves carried", "measured") +
        metric("Ideas living in two branches", out.shared, "a concept-map signal", "measured") +
        metric("Labels colliding", out.collisions, "pairs, in the drawn map", "measured") +
        metric("Labels off the page", out.offPage, "of " + out.nodes + " nodes", "measured") +
        metric("Smallest label", out.minPx + "px", "as rendered here", "measured") +
      "</div>";
  }

  /* ---------- wiring -------------------------------------------------- */
  function setText(text, presetId) {
    ta.value = text;
    current = presetId || null;
    Object.keys(presetBtns).forEach(function (id) {
      presetBtns[id].classList.toggle("is-on", id === current);
      presetBtns[id].querySelector("input").checked = (id === current);
    });
    paint(parse(text));
  }

  function setPreset(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0];
    if (p) setText(p.text, id);
  }

  function build() {
    var panel = document.createElement("div");
    panel.className = "mb-presets";
    PRESETS.forEach(function (p) {
      var lab = document.createElement("label");
      lab.className = "mb-preset" + (p.anti ? " is-anti" : "");
      lab.innerHTML = '<input type="radio" name="mb-preset" value="' + p.id + '">' +
        '<span class="mb-pname">' + esc(p.label) +
        (p.anti ? ' <em class="mb-anti">the one that feels thorough</em>' : "") + "</span>" +
        '<span class="mb-pnote">' + esc(p.note) + "</span>";
      panel.appendChild(lab);
      presetBtns[p.id] = lab;
      lab.querySelector("input").addEventListener("change", function () { setPreset(p.id); });
    });

    var edit = document.createElement("div");
    edit.className = "mb-edit";
    edit.innerHTML = '<label for="mb-outline">The outline - edit it, the map and the numbers follow</label>' +
      '<textarea id="mb-outline" spellcheck="false"></textarea>' +
      '<span class="mb-hint">Two spaces per level. First line is the centre. Paste your own notes from any meeting.</span>';
    ta = edit.querySelector("textarea");
    ta.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        current = null;
        Object.keys(presetBtns).forEach(function (id) {
          presetBtns[id].classList.remove("is-on");
          presetBtns[id].querySelector("input").checked = false;
        });
        paint(parse(ta.value));
      }, 160);
    });

    readout = document.createElement("div");
    readout.className = "mb-readout";
    stage = document.createElement("div");
    stage.className = "mb-stage";

    root.appendChild(panel);
    root.appendChild(edit);
    root.appendChild(readout);
    root.appendChild(stage);
    setPreset("captured");
  }

  function init() {
    root = document.getElementById("map-bench");
    if (!root) return;
    build();
    window.addEventListener("resize", function () { if (stage.querySelector("svg")) measure(parse(ta.value)); });
    window.MAP_LIVE = {
      presets: PRESETS.map(function (p) { return p.id; }),
      preset: setPreset,
      set: function (text) { setText(text, null); },
      get text() { return ta.value; },
      get current() { return current; },
      get metrics() { return out; }
    };
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
