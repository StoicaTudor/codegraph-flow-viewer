# CodeGraph Flow Viewer

A deliberately small TypeScript web app for exploring a local CodeGraph SQLite index. It uses plain HTML, CSS, and SVG; there is no graph-rendering library.

## Requirements

- Node.js 22.5 or newer. CodeGraph's documented TypeScript API uses Node's built-in `node:sqlite`.
- A CodeGraph project with `.codegraph/codegraph.db`, or a copied `codegraph.db` file.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Enter a project root, enter a database path, or choose a `.db` file with the file picker.

For a production build:

```bash
npm run build
npm start
```

## How loading works

The server first tries `CodeGraph.open(projectRoot)` for a project-root path, then reads the stable `nodes`, `edges`, and `files` tables in read-only mode to provide a broad graph view. The public CodeGraph facade is intentionally used for validation because its documented API exposes search, callers, callees, and impact methods but not a single “list every graph row” method. Direct `.db` and uploaded-file mode uses schema introspection and gives a compatibility warning in the UI.

The viewer limits the initial response to 5,000 nodes and 15,000 edges. Search, edge-kind filtering, node limits, node inspection, and double-click neighborhood focus are client-side. It skips orphaned edges and reports databases that do not have the expected core tables.

## Security note

This is intended for local use. The server can read any path you enter and temporarily stores a selected database as `.runtime/uploaded-codegraph.db`; do not expose the server to an untrusted network.
