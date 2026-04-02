from ingestion.live import logCapture 
from ingestion.parse import LogNorm
import threading
from queue import Queue



normalizer = LogNorm()
logs=logCapture('logs/web','logs/system','logs/alerts','wlan0')


class ingestEngine:

    def __init__(self):
        self.event_queue = Queue()
        self.normalizer = normalizer

    def push_event(self, source, raw):
        event = self.normalizer.normalize(source, raw)
        if event:
            self.event_queue.put(event)

    def startIngestion(self):

        def web_cb(line):
            self.push_event("web", line)

        def sys_cb(line):
            self.push_event("system", line)

        def alert_cb(line):
            self.push_event("alert", line)

        def net_cb(packet):
            self.push_event("network", packet)

        threading.Thread(target=lambda: logs.web_capture(web_cb), daemon=True).start()
        threading.Thread(target=lambda: logs.system_capture(sys_cb), daemon=True).start()
        threading.Thread(target=lambda: logs.alert_capture(alert_cb), daemon=True).start()
        threading.Thread(target=lambda: logs.network_logs(net_cb), daemon=True).start()

        return self.event_queue

engine = ingestEngine()
q = engine.startIngestion()

while True:
    event = q.get()
    print(event)
