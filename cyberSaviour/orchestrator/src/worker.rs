use std::io::Write;
use std::process::{Command, Stdio};
use crate::event::Event;

/// Runs one pipeline window by spawning `pipeline_worker.py` as a subprocess.
///
/// Events are serialised as a JSON array and written to the child's stdin.
/// The child runs the full Python pipeline and writes a JSON response to stdout.
///
/// Memory contract: the child process owns all pipeline state.  When it exits
/// that memory is reclaimed by the OS — no leaks back into the orchestrator.
pub struct PipelineWorker {
    pub python_bin:   String,
    pub script_path:  String,
    pub working_dir:  String,
}

impl PipelineWorker {
    pub fn run(&self, events: Vec<Event>) -> Result<String, String> {
        let input = serde_json::to_string(&events)
            .map_err(|e| format!("Serialise error: {e}"))?;

        let mut child = Command::new(&self.python_bin)
            .arg(&self.script_path)
            .current_dir(&self.working_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())   // let Python errors surface directly
            .spawn()
            .map_err(|e| format!("Spawn error: {e}"))?;

        // Write events to stdin then close it so the child sees EOF
        {
            let stdin = child.stdin.as_mut()
                .ok_or("Could not get stdin handle")?;
            stdin.write_all(input.as_bytes())
                .map_err(|e| format!("Stdin write error: {e}"))?;
        } // stdin dropped here → EOF sent to child

        let output = child.wait_with_output()
            .map_err(|e| format!("Wait error: {e}"))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(format!("Worker exited with code: {}", output.status))
        }
    }
}
