MODEL        = "gemini-2.5-flash"
TOKEN_BUDGET = 4000

# MITRE ATT&CK quick-lookup: alert type → (technique_id, tactic, technique_name)
MITRE_MAP = {
    "failed_login":     ("T1110", "Credential Access",  "Brute Force"),
    "sql_injection":    ("T1190", "Initial Access",     "Exploit Public-Facing Application"),
    "recon_activity":   ("T1595", "Reconnaissance",     "Active Scanning"),
    "network_activity": ("T1071", "Command and Control","Application Layer Protocol"),
    "alert":            ("T1059", "Execution",          "Command and Scripting Interpreter"),
    "unknown":          ("T0000", "Unknown",            "Unknown Technique"),
}
