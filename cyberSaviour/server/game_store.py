"""
GameStore — tracks XP, level, streak, rank, and achievement unlock state.

All values are derived from real pipeline run outcomes — no mock data.
"""
from pydantic import BaseModel
from typing import Dict, Set
from datetime import datetime, timezone


# ── XP table ──────────────────────────────────────────────────────────────────
_ACTION_XP = {
    "block":         150,
    "quarantine":    175,
    "isolate":       175,
    "escalate":      100,
    "alert_security": 80,
    "throttle":       60,
    "monitor":        50,
    "log":            25,
    "rejected":        0,
}

_PRIORITY_MULT = {"critical": 2.0, "high": 1.5, "medium": 1.0, "low": 0.5}

_RANKS = [
    (10, "ELITE"),
    (7,  "VETERAN"),
    (5,  "SPECIALIST"),
    (3,  "ANALYST"),
    (1,  "RECRUIT"),
]

# ── Achievement definitions ────────────────────────────────────────────────────
# Each entry: id → {name, description, rarity, icon, xp_reward, check_fn key}
ACHIEVEMENT_DEFS = {
    "first_blood": {
        "name": "First Blood",
        "description": "Complete your first pipeline run",
        "rarity": "common",
        "icon": "Shield",
        "xp_reward": 50,
    },
    "brute_force_buster": {
        "name": "Brute Force Buster",
        "description": "Block a brute-force login campaign",
        "rarity": "common",
        "icon": "ShieldCheck",
        "xp_reward": 75,
    },
    "sql_slayer": {
        "name": "SQL Slayer",
        "description": "Detect and block a SQL injection attempt",
        "rarity": "rare",
        "icon": "Database",
        "xp_reward": 150,
    },
    "threat_hunter": {
        "name": "Threat Hunter",
        "description": "Generate 10 or more alerts across runs",
        "rarity": "rare",
        "icon": "Search",
        "xp_reward": 200,
    },
    "repeat_offender_caught": {
        "name": "Repeat Offender",
        "description": "Catch an IP that has attacked before",
        "rarity": "rare",
        "icon": "UserX",
        "xp_reward": 180,
    },
    "apt_slayer": {
        "name": "APT Slayer",
        "description": "Block a critical-priority advanced threat",
        "rarity": "epic",
        "icon": "Sword",
        "xp_reward": 500,
    },
    "zero_day_hero": {
        "name": "Zero-Day Hero",
        "description": "Detect a threat with a known CVE",
        "rarity": "legendary",
        "icon": "Zap",
        "xp_reward": 1000,
    },
    "lateral_stopper": {
        "name": "Lateral Stopper",
        "description": "Block suspicious network / lateral movement activity",
        "rarity": "rare",
        "icon": "Network",
        "xp_reward": 250,
    },
    "streak_master": {
        "name": "Streak Master",
        "description": "Maintain a response streak of 5 or more",
        "rarity": "epic",
        "icon": "Flame",
        "xp_reward": 400,
    },
}


class GameState(BaseModel):
    level: int = 1
    xp: int = 0
    xp_to_next_level: int = 1000
    streak: int = 0
    rank: str = "RECRUIT"
    total_runs: int = 0
    total_alerts: int = 0
    total_blocks: int = 0

    class Config:
        arbitrary_types_allowed = True


class GameStore:
    def __init__(self):
        self.state = GameState()
        self._unlocked: Dict[str, str] = {}   # achievement_id → ISO timestamp
        # active_missions lives here too (used by HTTP endpoints)
        self.active_missions: Dict[str, dict] = {}

    # ── XP / level ────────────────────────────────────────────────────────────

    def add_xp(self, amount: int, reason: str = "action") -> dict:
        self.state.xp += amount
        while self.state.xp >= self.state.xp_to_next_level:
            self.state.xp -= self.state.xp_to_next_level
            self.state.level += 1
            self.state.xp_to_next_level = self.state.level * 1000
        self._update_rank()
        return {"xp": self.state.xp, "level": self.state.level, "reason": reason}

    def update_streak(self, success: bool) -> dict:
        self.state.streak = self.state.streak + 1 if success else 0
        return {"streak": self.state.streak}

    def _update_rank(self):
        for lvl, rank in _RANKS:
            if self.state.level >= lvl:
                self.state.rank = rank
                return

    # ── Pipeline-driven update ────────────────────────────────────────────────

    def apply_pipeline_result(self, shaped: dict) -> dict:
        """
        Derive XP, streak, and achievement unlocks from a shaped pipeline result.
        Returns { game_state, newly_unlocked: [Achievement-shaped dicts] }.
        """
        raw         = shaped.get("raw_response", {})
        action      = raw.get("action_taken", "log")
        priority    = raw.get("priority", "low")
        alerts      = shaped.get("alerts", [])
        memory_ctx  = shaped.get("_memory_ctx", {})     # injected by pipeline_bridge
        threat_ctx  = shaped.get("_threat_ctx", {})     # injected by pipeline_bridge
        decision_ctx= shaped.get("_decision_ctx", {})   # injected by pipeline_bridge

        # ── Counters ──────────────────────────────────────────────────────────
        self.state.total_runs   += 1
        self.state.total_alerts += len(alerts)
        if action in ("block", "quarantine", "isolate"):
            self.state.total_blocks += 1

        # ── XP ────────────────────────────────────────────────────────────────
        base_xp = _ACTION_XP.get(action, 25)
        mult    = _PRIORITY_MULT.get(priority.lower(), 1.0)
        # Repeat-offender bonus
        repeat_bonus = 50 * len(memory_ctx.get("repeat_offenders", {}))
        earned = int(base_xp * mult) + repeat_bonus
        self.add_xp(earned, reason=f"{action}/{priority}")

        # ── Streak ────────────────────────────────────────────────────────────
        self.update_streak(action not in ("log", "rejected"))

        # ── Achievement checks ────────────────────────────────────────────────
        alert_types = {a.get("title", "") for a in alerts}
        cves        = threat_ctx.get("mitre_anchor", {}).get("cve", [])
        repeat_ips  = memory_ctx.get("repeat_offenders", {})

        candidates = []

        if self.state.total_runs == 1:
            candidates.append("first_blood")
        if action in ("block", "quarantine") and any("Login" in t for t in alert_types):
            candidates.append("brute_force_buster")
        if any("SQL" in t for t in alert_types):
            candidates.append("sql_slayer")
        if self.state.total_alerts >= 10:
            candidates.append("threat_hunter")
        if repeat_ips:
            candidates.append("repeat_offender_caught")
        if priority.lower() == "critical" and action in ("block", "quarantine", "isolate"):
            candidates.append("apt_slayer")
        if cves:
            candidates.append("zero_day_hero")
        if any("Network" in t for t in alert_types):
            candidates.append("lateral_stopper")
        if self.state.streak >= 5:
            candidates.append("streak_master")

        newly_unlocked = []
        for ach_id in candidates:
            if ach_id not in self._unlocked:
                ts = datetime.now(timezone.utc).isoformat()
                self._unlocked[ach_id] = ts
                defn = ACHIEVEMENT_DEFS[ach_id]
                self.add_xp(defn["xp_reward"], reason=f"achievement:{ach_id}")
                newly_unlocked.append({
                    "id":          ach_id,
                    "name":        defn["name"],
                    "description": defn["description"],
                    "rarity":      defn["rarity"],
                    "icon":        defn["icon"],
                    "xpReward":    defn["xp_reward"],
                    "unlockedAt":  ts,
                })

        return {
            "game_state":       self.state.dict(),
            "xp_earned":        earned,
            "newly_unlocked":   newly_unlocked,
        }

    # ── Read all achievements (unlocked + locked) ─────────────────────────────

    def all_achievements(self) -> list:
        result = []
        for ach_id, defn in ACHIEVEMENT_DEFS.items():
            result.append({
                "id":          ach_id,
                "name":        defn["name"],
                "description": defn["description"],
                "rarity":      defn["rarity"],
                "icon":        defn["icon"],
                "xpReward":    defn["xp_reward"],
                "unlockedAt":  self._unlocked.get(ach_id),   # None if locked
            })
        return result
