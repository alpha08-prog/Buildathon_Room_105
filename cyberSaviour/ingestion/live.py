import pyshark 
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import json 

class LiveLogHandler(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback
        self.file_offsets = {} 

    def on_modified(self, event):
        if event.is_directory:
            return

        file_path = event.src_path

        with open(file_path, "r") as f:
            last_offset = self.file_offsets.get(file_path, 0)
            f.seek(last_offset)

            new_lines = f.readlines()

            self.file_offsets[file_path] = f.tell()

        for line in new_lines:
            self.callback(line.strip())



def initialise_file_mon(callback,directory):
    handle=LiveLogHandler(callback)
    watcher=Observer()
    watcher.schedule(handle,directory,recursive=False)
    watcher.start()
    return watcher




class logCapture:
    def __init__(self,web_file_path,system_file_path,alert_file_path,network_interface):
        self.web_file_path=web_file_path
        self.system_file_path=system_file_path
        self.alert_file_path=alert_file_path
        self.network_interface=network_interface
    
    def web_capture(self,cb):
        return initialise_file_mon(cb,self.web_file_path)

    def system_capture(self,cb):
        return initialise_file_mon(cb,self.system_file_path)

    def alert_capture(self,cb):
        return initialise_file_mon(cb,self.alert_file_path)

    def network_logs(self,cb):
        dekho=pyshark.LiveCapture(self.network_interface)
        for packet in dekho.sniff_continuously():
            cb(packet)





