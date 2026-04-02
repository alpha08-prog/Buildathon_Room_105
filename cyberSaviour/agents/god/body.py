class Body:
    def __init__(self,name):
        self.name=name
    def init_state(self,event):
        return {
                "event":[event],
                "alerts":[],
                "context":{},
                "history":[],
                }
    def inter_agent_comms(self,content):
        return {
                "agent":self.name,
                "message":content
                }

