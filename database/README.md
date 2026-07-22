# Aegis local database

Persistent scan history is stored in `history/aegis-history.sqlite3` while the
backend is running. SQLite was chosen instead of CSV so concurrent writes,
deletes, ordering, and future queries remain reliable as the history grows.

The database files are local runtime data and are intentionally ignored by Git.
The backend creates them automatically; no manual setup is required.

Uploaded media is not archived here. Images and audio are processed in memory,
and temporary video/audio files are removed after analysis.
