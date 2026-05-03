# Privacy

Skillgraph is useful precisely because it reads operational instructions. That also means you should treat generated artifacts as reviewable output, not as automatically-public data.

## What Skillgraph Outputs

Skillgraph writes:

- relative file paths
- skill names
- skill descriptions or first meaningful markdown line
- node kinds
- inferred edges
- optional short evidence snippets
- issue metadata

Skillgraph does not output full skill markdown contents.

## Public Release Checklist

Before publishing generated graph artifacts from a private codebase:

1. Set `privacy.includeEvidence` to `false`.
2. Add private project names, internal domains, customer names, user emails, and old test accounts to `privacy.redactTerms`.
3. Run `skillgraph generate`.
4. Run `skillgraph privacy-scan --terms-file docs/private-leak-terms.txt`.
5. Review `SKILLGRAPH.md` and `skillgraph.html` before publishing.

## Terms File

Create a repo-local file such as `docs/private-leak-terms.txt`:

```txt
secret-project-name
internal-domain.example
person@example.com
old-test-account
```

Then run:

```bash
skillgraph privacy-scan --terms-file docs/private-leak-terms.txt
```

The scan exits nonzero if any term is found in the working tree.

## Recommended Split

For private products, keep generated artifacts private by default. Publish only:

- the generic Skillgraph repo
- fictional examples
- sanitized screenshots
- sanitized sample graph data

Private application repos can still consume Skillgraph without exposing their graph.
