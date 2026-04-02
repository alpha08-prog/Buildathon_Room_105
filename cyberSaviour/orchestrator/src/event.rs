use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Normalized event produced by the Python ingestion layer.
/// Unknown fields are captured in `extra` so nothing is silently dropped.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    #[serde(default)]
    pub source_ip: Option<String>,

    #[serde(default)]
    pub event_type: Option<String>,

    #[serde(default)]
    pub raw: Option<String>,

    #[serde(default)]
    pub protocol: Option<String>,

    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}
