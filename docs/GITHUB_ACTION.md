# GitHub Action Setup

Add this workflow at `.github/workflows/skillgraph.yml` to keep generated Skillgraph artifacts current in pull requests and on `main`.

```yaml
name: Skillgraph

on:
  pull_request:
  push:
    branches: [main]

jobs:
  skillgraph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx --yes github:ming0627/skillgraph generate
      - run: npx --yes github:ming0627/skillgraph check
```
