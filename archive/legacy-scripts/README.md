# Archived Legacy Scripts

This directory contains historical repair scripts, patch scripts, database dumps, metadata snapshots, and temporary analysis artifacts.

They are retained for audit and recovery reference only. They are not part of the product runtime and must not be imported by `src/` or invoked by production build scripts.

The canonical application code remains under `src/`, with SQLite persistence owned by the database and repository layers.
