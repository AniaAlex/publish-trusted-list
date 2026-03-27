# Ideas

## TODO: AI Agent Pipeline for wp4-trust Context Updates

1. Define the scope of "ideas" to track — what counts as a relevant update in wp4-trust (new TSL entries, schema changes, LOTL updates, policy shifts).
2. Set up a data source monitor — watch wp4-trust repos, mailing lists, or publication feeds for new content.
3. Build an ingestion step — fetch and parse new trusted list data (XML/JSON) as it is published.
4. Implement a diff/change-detection layer — compare incoming data against the last known state to identify meaningful changes.
5. Feed detected changes into an LLM agent — summarize what changed, why it matters, and what action (if any) is needed.
6. Store context updates in a structured format — append summaries to a versioned context log so the agent can build on prior knowledge.
7. Add a notification/output step — route the agent's output to a relevant channel (Slack, GitHub issue, markdown file, etc.).
8. Define a trigger schedule — decide whether the pipeline runs on a cron schedule, on git push, or on external webhook.
9. Add evaluation/feedback loop — review agent outputs periodically to tune prompts and relevance filters.
10. Document the pipeline — record architecture decisions, data sources, and how to extend or rerun the pipeline.
