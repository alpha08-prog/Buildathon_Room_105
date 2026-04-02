mod event;
mod queue;
mod window;
mod worker;

use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use std::sync::mpsc;

use queue::BoundedQueue;
use worker::PipelineWorker;
use event::Event;

// ── Configuration ────────────────────────────────────────────────────────────

/// Max events held in the ingestion queue before backpressure kicks in.
const QUEUE_CAPACITY: usize = 1_000;

/// Max events per pipeline window.
const WINDOW_SIZE: usize = 10;

/// Max seconds to wait before processing a partial window.
const WINDOW_TIMEOUT_SECS: u64 = 5;

/// Number of parallel pipeline workers.
/// Each worker spawns a Python subprocess — keep this ≤ CPU cores.
const WORKER_THREADS: usize = 4;

const PYTHON_BIN:         &str = "/home/guy_who_likes_to_code/miniconda3/envs/dsp/bin/python";
const INGESTION_SCRIPT:   &str = "orchestrator/ingestion_bridge.py";
const PIPELINE_SCRIPT:    &str = "orchestrator/pipeline_worker.py";

/// Working directory for all subprocesses — must be cyberSaviour/ so that
/// relative imports (agents/, pipeline/, memory/) resolve correctly.
const WORKING_DIR: &str = ".";

// ── Ingestion thread ─────────────────────────────────────────────────────────

/// Spawns `ingestion_bridge.py` and forwards every JSON-line event into the
/// bounded queue.  Runs forever in a background thread.
fn start_ingestion(queue: Arc<BoundedQueue>, script: String) {
    thread::spawn(move || {
        let child = Command::new(PYTHON_BIN)
            .arg(&script)
            .current_dir(WORKING_DIR)
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .expect("[Ingestion] Failed to start ingestion_bridge.py");

        let stdout = child.stdout.expect("[Ingestion] No stdout handle");
        let reader = BufReader::new(stdout);

        for line in reader.lines() {
            match line {
                Ok(json_str) if !json_str.trim().is_empty() => {
                    match serde_json::from_str::<Event>(&json_str) {
                        Ok(event) => { queue.push(event); }
                        Err(e)    => eprintln!("[Ingestion] Parse error: {e} — {json_str}"),
                    }
                }
                Ok(_)    => {}
                Err(e)   => eprintln!("[Ingestion] Read error: {e}"),
            }
        }

        eprintln!("[Ingestion] Bridge process exited");
    });
}

// ── Worker pool ───────────────────────────────────────────────────────────────

/// Spawns `WORKER_THREADS` threads.  Each waits for a window on the mpsc
/// channel, spawns `pipeline_worker.py`, and prints the result.
///
/// Returns a `Sender` the main loop uses to dispatch windows.
fn start_worker_pool() -> mpsc::Sender<Vec<Event>> {
    let (tx, rx) = mpsc::channel::<Vec<Event>>();
    // Wrap receiver in Arc<Mutex> so all worker threads can share it
    let rx = Arc::new(Mutex::new(rx));

    for id in 0..WORKER_THREADS {
        let rx = Arc::clone(&rx);
        thread::spawn(move || {
            let worker = PipelineWorker {
                python_bin:  PYTHON_BIN.to_string(),
                script_path: PIPELINE_SCRIPT.to_string(),
                working_dir: WORKING_DIR.to_string(),
            };

            loop {
                let events = {
                    let guard = rx.lock().unwrap();
                    guard.recv()
                };

                match events {
                    Ok(events) => {
                        println!("[Worker {id}] Processing {} event(s) …", events.len());
                        match worker.run(events) {
                            Ok(resp) => println!("[Worker {id}] Done:\n{resp}"),
                            Err(e)   => eprintln!("[Worker {id}] Error: {e}"),
                        }
                    }
                    Err(_) => {
                        println!("[Worker {id}] Channel closed — exiting");
                        break;
                    }
                }
            }
        });
    }

    tx
}

// ── Main ──────────────────────────────────────────────────────────────────────

fn main() {
    // Optional first argument overrides the ingestion script.
    // Usage: ./cybersaviour-orchestrator [ingestion_script]
    // Default: orchestrator/ingestion_bridge.py
    // Test:    orchestrator/ingestion_bridge_test.py
    let args: Vec<String> = std::env::args().collect();
    let ingestion_script  = args.get(1).map(String::as_str).unwrap_or(INGESTION_SCRIPT);

    println!("╔══════════════════════════════════════╗");
    println!("║   CyberSaviour Orchestrator (Rust)   ║");
    println!("╚══════════════════════════════════════╝");
    println!("  Queue capacity  : {QUEUE_CAPACITY}");
    println!("  Window size     : {WINDOW_SIZE} events / {WINDOW_TIMEOUT_SECS}s");
    println!("  Worker threads  : {WORKER_THREADS}");
    println!("  Ingestion bridge: {ingestion_script}");
    println!();

    let queue    = Arc::new(BoundedQueue::new(QUEUE_CAPACITY));
    let rx       = queue.receiver();
    let tx       = start_worker_pool();

    start_ingestion(Arc::clone(&queue), ingestion_script.to_string());

    println!("[Orchestrator] Listening for events …\n");

    let timeout = Duration::from_secs(WINDOW_TIMEOUT_SECS);

    loop {
        let window = window::collect(&rx, WINDOW_SIZE, timeout);

        if window.is_empty() {
            continue;
        }

        println!("[Orchestrator] Window ready — {} event(s)", window.len());

        if tx.send(window).is_err() {
            eprintln!("[Orchestrator] Worker pool disconnected — shutting down");
            break;
        }
    }
}
