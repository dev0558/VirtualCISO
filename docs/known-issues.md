# Known issues and limitations

- **Invitations** produce a one-time link to share manually; no email service is wired up.
- **Embeddings** are local (hashing + BM25 hybrid). Good for compliance vocabulary; a hosted semantic model would improve paraphrased questions. Without `ANTHROPIC_API_KEY`, answers are extractive and conservatively flagged.
- **Google Workspace** facts cover users, admin roles, login and OAuth token audit; Groups/Drive sharing settings need extra APIs and are not yet checked.
- **GitHub** branch protection on private repos requires a paid plan; such repos are skipped (not failed).
- **Intune** device compliance is skipped when the tenant has no Intune licence.
- **Scores** count controls without automated or policy evidence as not passing ("manual"); manual evidence upload is future work.
- **Rate limiting** depends on Redis; it fails open in development.
- **PDF export** needs Pango (present in the Docker image, not on a bare macOS host).
- Control IDs and titles must be double-checked against the official ISO and NIST documents by the compliance lead (PRD §3).
