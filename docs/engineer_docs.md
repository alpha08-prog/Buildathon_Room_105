## commands to test ingestion pipeline 
### for system alerts 
``` bash 
while true; do echo "{\"severity\":\"high\",\"source_ip\":\"192.168.1.10\"}" >> logs/alerts/alerts.json; sleep 4; done
```
### for web access logs 
``` bash 
while true; do echo "192.168.1.1 GET /login?id=1" >> logs/web/access.log; sleep 2; done
```
### for system authentication logs
``` bash 
while true; do   echo "Failed password from 192.168.1.5" >> logs/system/auth.log;
```
# Agents 
## god
defines the structure of every agent 
## logAgent 
an extractor from the events 
