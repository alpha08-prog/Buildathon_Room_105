use crossbeam_channel::{bounded, Receiver, Sender, TrySendError};
use crate::event::Event;

/// Bounded SPMC event queue.
///
/// When the channel is full the oldest slot is not recoverable — the producer
/// simply drops the new event and logs a warning.  This gives us hard memory
/// bounds: the queue never grows beyond `capacity` events regardless of how
/// fast the ingestion layer fires.
pub struct BoundedQueue {
    tx: Sender<Event>,
    rx: Receiver<Event>,
}

impl BoundedQueue {
    pub fn new(capacity: usize) -> Self {
        let (tx, rx) = bounded(capacity);
        Self { tx, rx }
    }

    /// Push an event.  Returns `false` (and drops the event) if the channel
    /// is full — the oldest events are already being processed by workers so
    /// dropping new arrivals is the correct backpressure strategy here.
    pub fn push(&self, event: Event) -> bool {
        match self.tx.try_send(event) {
            Ok(_) => true,
            Err(TrySendError::Full(_)) => {
                eprintln!("[Queue] Full — event dropped (backpressure)");
                false
            }
            Err(TrySendError::Disconnected(_)) => false,
        }
    }

    /// Clone the receiver so window collectors and workers can share it.
    pub fn receiver(&self) -> Receiver<Event> {
        self.rx.clone()
    }
}
