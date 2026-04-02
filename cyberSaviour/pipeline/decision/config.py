MODEL = "gemini-2.5-flash"

# Severities that always require human approval
HUMAN_REQUIRED_SEVERITIES = {"critical", "high"}

# If an IP has been seen this many times before, force a block regardless of severity
REPEAT_OFFENDER_THRESHOLD = 2
