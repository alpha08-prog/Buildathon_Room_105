use std::time::{Duration, Instant};
use crossbeam_channel::{Receiver, RecvTimeoutError};
use crate::event::Event;

/// Collects events into a window of up to `size` events.
///
/// Blocks until either:
///   - `size` events have arrived, or
///   - `timeout` has elapsed since the first call.
///
/// Returns whatever was collected — may be empty if the channel is idle.
pub fn collect(rx: &Receiver<Event>, size: usize, timeout: Duration) -> Vec<Event> {
    let mut events = Vec::with_capacity(size);
    let deadline   = Instant::now() + timeout;

    while events.len() < size {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            break;
        }

        // Cap individual waits so we don't block longer than needed
        let wait = remaining.min(Duration::from_millis(500));

        match rx.recv_timeout(wait) {
            Ok(event)                          => events.push(event),
            Err(RecvTimeoutError::Timeout)     => break,
            Err(RecvTimeoutError::Disconnected) => break,
        }
    }

    events
}
