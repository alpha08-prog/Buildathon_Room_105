import os

# Short-term FIFO queue size (number of incidents kept in memory per session)
SHORT_TERM_SIZE = 20

# SQLite DB file — lives next to this file so it's always found regardless of cwd
DB_PATH = os.path.join(os.path.dirname(__file__), "incidents.db")

# How many past incidents to surface to the decision layer for context
RECALL_LIMIT = 5
