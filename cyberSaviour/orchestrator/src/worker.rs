use std::io::Write;
use std::process::{Command, Stdio};
use crate::event::Event;

/// Runs one pipeline window by spawning `pipeline_bridge_worker.py` as a subprocess,
/// then POSTs the frontend-shaped JSON result to the FastAPI SOC server.
///
/// Memory contract: the child process owns all pipeline state.  When it exits
/// that memory is reclaimed by the OS — no leaks back into the orchestrator.
pub struct PipelineWorker {
    pub python_bin:   String,
    pub script_path:  String,
    pub working_dir:  String,
    /// Base URL of the FastAPI SOC server, e.g. "http://127.0.0.1:8000"
    pub server_url:   String,
}

impl PipelineWorker {
    /// Run the pipeline subprocess, return the raw JSON string from stdout.
    fn run_subprocess(&self, events: &Vec<Event>) -> Result<String, String> {
        let input = serde_json::to_string(events)
            .map_err(|e| format!("Serialise error: {e}"))?;

        let mut child = Command::new(&self.python_bin)
            .arg(&self.script_path)
            .current_dir(&self.working_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("Spawn error: {e}"))?;

        {
            let stdin = child.stdin.as_mut()
                .ok_or("Could not get stdin handle")?;
            stdin.write_all(input.as_bytes())
                .map_err(|e| format!("Stdin write error: {e}"))?;
        } // EOF sent to child

        let output = child.wait_with_output()
            .map_err(|e| format!("Wait error: {e}"))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(format!("Worker exited with code: {}", output.status))
        }
    }

    /// POST the pipeline result JSON to the SOC server's ingest endpoint.
    fn push_to_server(&self, json_body: &str) -> Result<(), String> {
        let url = format!("{}/api/pipeline/result", self.server_url);
        ureq::post(&url)
            .set("Content-Type", "application/json")
            .send_string(json_body)
            .map_err(|e| format!("Server push error: {e}"))?;
        Ok(())
    }

    /// Run the pipeline and push results to the SOC server.
    /// Returns the raw JSON string (for local logging).
    pub fn run(&self, events: Vec<Event>) -> Result<String, String> {
        let json_str = self.run_subprocess(&events)?;

        // Best-effort push — log but don't fail the worker on server errors.
        match self.push_to_server(&json_str) {
            Ok(())   => eprintln!("[Worker] Result pushed to SOC server"),
            Err(e)   => eprintln!("[Worker] Could not reach SOC server: {e}"),
        }

        Ok(json_str)
    }
}
