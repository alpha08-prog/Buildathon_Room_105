MODEL          = "gemini-2.5-flash"
TOKEN_BUDGET   = 3000 
WINDOW_SECONDS = 60  
SCORE_THRESHOLDS = {
    "critical": 15,
    "high":     8,
    "medium":   4,
    "low":      0,
}
SCORE_WEIGHTS = {
    "failed_login":     3,
    "sql_injection":    5,
    "recon_activity":   4,
    "network_activity": 1,
    "web_request":      1,
    "alert":            4,
    "unknown":          0,
}
