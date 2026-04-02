from agents.god.body import Body 
from agents.god.llm import deployLLM 
from agents.correlation_agent.config import MODEL,TOKEN_BUDGET,WINDOW_SECONDS,SCORE_THRESHOLDS,SCORE_WEIGHTS
from collections import defaultdict 
import math 
import json 
import time 
import yaml 

with open('agents/god/prompts.yaml' ,'r') as f:
    prompt=yaml.safe_load(f).get('correlation')

class CorrelationAgent(Body):
    def __init__(self):
        super().__init__('Correlation_Agent')
        self._ip_buckets=defaultdict(list)

