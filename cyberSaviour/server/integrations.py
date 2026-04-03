"""
integrations.py — Phase 5.1

IntegrationManager: unified API surface for CybORG and Cybersleuth pipelines.

Provides:
- Async wrappers for both bridge functions
- Background job queue for long-running forensic analyses
- Health/status summary consumed by /api/status
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional


class IntegrationManager:
    """Singleton manager for all third-party integrations."""

    def __init__(self):
        # Job store: job_id → job record
        self._forensic_jobs: dict[str, dict] = {}

    # ── CybORG ────────────────────────────────────────────────────────────────

    async def run_cyborg_scenario(self, scenario: str, steps: int) -> dict:
        """Run a CybORG scenario asynchronously (offloaded to thread pool)."""
        from integrations.cyborg_bridge import run_cyborg_scenario as _run
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _run, scenario, steps)

    async def list_cyborg_scenarios(self) -> list:
        """Return all available CybORG scenarios."""
        from integrations.cyborg_bridge import list_scenarios
        return list_scenarios()

    # ── Cybersleuth / Forensic (synchronous) ─────────────────────────────────

    async def run_forensic_analysis(self, event_id: str, benchmark: str = "CFA") -> dict:
        """Run forensic analysis synchronously (blocks until complete)."""
        from integrations.cybersleuth_bridge import run_forensic_analysis as _run
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _run, event_id, benchmark)

    # ── Forensic async job queue ──────────────────────────────────────────────

    def submit_forensic_job(self, event_id: str, benchmark: str = "CFA") -> str:
        """
        Submit a forensic analysis as a background job.

        Returns
        -------
        job_id : str
            8-character identifier. Poll GET /api/forensic/jobs/{job_id}
        """
        job_id = str(uuid.uuid4())[:8]
        self._forensic_jobs[job_id] = {
            "job_id":       job_id,
            "status":       "running",
            "event_id":     event_id,
            "benchmark":    benchmark,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "result":       None,
            "error":        None,
        }
        # Fire-and-forget background coroutine
        asyncio.ensure_future(self._run_forensic_bg(job_id, event_id, benchmark))
        return job_id

    async def _run_forensic_bg(self, job_id: str, event_id: str, benchmark: str):
        """Internal background worker for forensic analysis jobs."""
        try:
            result = await self.run_forensic_analysis(event_id, benchmark)
            self._forensic_jobs[job_id].update({
                "status":       "complete",
                "result":       result,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            self._forensic_jobs[job_id].update({
                "status": "error",
                "error":  str(exc),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })

    def get_job(self, job_id: str) -> Optional[dict]:
        """Return the job record for a given job_id, or None if not found."""
        return self._forensic_jobs.get(job_id)

    def list_jobs(self) -> list[dict]:
        """Return all job records sorted by submission time (newest first)."""
        return sorted(
            self._forensic_jobs.values(),
            key=lambda j: j["submitted_at"],
            reverse=True,
        )

    # ── System health summary ─────────────────────────────────────────────────

    def get_status(self) -> dict:
        """
        Returns a lightweight health snapshot consumed by /api/status.
        """
        jobs = self._forensic_jobs.values()
        return {
            "cyborg_enabled":        True,
            "cybersleuth_enabled":   True,
            "forensic_jobs_total":   len(self._forensic_jobs),
            "forensic_jobs_running": sum(1 for j in jobs if j["status"] == "running"),
            "forensic_jobs_done":    sum(1 for j in jobs if j["status"] == "complete"),
            "forensic_jobs_error":   sum(1 for j in jobs if j["status"] == "error"),
        }

    # ── Pipeline bridge ───────────────────────────────────────────────────────

    async def run_pipeline(self, events: list[dict]) -> dict:
        """Run the full CyberSaviour pipeline on a set of raw events."""
        from .pipeline_bridge import run_pipeline as _run
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _run, events)


# ── Singleton instance (imported by app.py) ───────────────────────────────────
integration_manager = IntegrationManager()
