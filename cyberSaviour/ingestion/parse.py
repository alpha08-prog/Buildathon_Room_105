import re 
import json 

class LogNorm:
    def __init__(self):
        pass

    def extract_ip(self, text):
        match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', str(text))
        return match.group(0) if match else None


    def detect_event_type(self, raw):
        raw = str(raw).lower()

        if "failed password" in raw:
            return "failed_login"

        if "get" in raw or "post" in raw:
            return "web_request"

        if "alert" in raw or "severity" in raw:
            return "alert"

        return "unknown"

    def parse_alert(self, raw):
        return json.loads(raw)
    
    def parse_system(self,raw):
        return {"message":raw}

    def parse_web(self, raw):
        return {
            "method": "GET" if "GET" in raw else "POST" if "POST" in raw else None,
            "url": raw
        }
    def parse_network(self, packet):
        try:
            return {
                "timestamp": str(packet.sniff_time),
                "source_ip": packet.ip.src,
                "destination_ip": packet.ip.dst,
                "protocol": packet.transport_layer,
                "event_type": "network",
                "data": {},
                "raw": packet
            }
        except:
            return None
    def normalize(self, source, raw):
        if source == "network":
            return self.parse_network(raw)

        raw_str = str(raw)

        ip = self.extract_ip(raw_str)
        event_type = self.detect_event_type(raw_str)

        data = {}

        if source == "web":
            data = self.parse_web(raw_str)

        elif source == "system":
            data = self.parse_system(raw_str)

        elif source == "alert":
            data = self.parse_alert(raw_str)

        return {
            "timestamp": None,
            "source_ip": ip,
            "destination_ip": None,
            "event_type": event_type,
            "protocol": None,
            "data": data,
            "raw": raw
        }
