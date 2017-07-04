import cherrypy
from cherrypy.lib.static import serve_file
import json
import re
import time
import datetime
import os
import yaml
import socket
import string

from threading import Thread
from time import sleep

dir_path = os.path.dirname(os.path.realpath(__file__)) + "/"
config_file = "config.yml"

class SotaStream(object):
    lastmessage = 0
    fluck = []
    def index(self):
        return serve_file(dir_path+"index.html")
    def chat(self):
        return json.dumps(self.fluck)
    index.exposed = True
    chat.exposed = True
    def getTime(self,line):
        #print line
        match = re.match(r"^\[([^\]]*)\]\s",line)
        if match:
            match = match.groups()
            date = datetime.datetime.strptime(match[0], "%m/%d/%Y %I:%M:%S %p")
            date = time.mktime(date.timetuple())
            return date
        return 0
    def categorizeLine(self, line):
        for match_type, pattern in regex.items():
            result = re.match(pattern, line)
            if result:
                return (match_type,result)
        return ("other", line)

    def shiftlist(self, line, category = "other"):
        if len(self.fluck) == config["max_size"]:
            self.fluck.pop(0)
        self.fluck.append({"value":line,"type":category})

    def updatefluck(self, line):
        category, text = self.categorizeLine(line)
        print category
        if category == "localChat" and re.match(r"^[^\)\(]*: \(.*ing\).*$", line):
            category = "other"
        if category not in config["chats"].keys() or config["chats"][category]==0:
            return
        self.shiftlist(line,category)
    def loadConfig(self):
        stream = open(dir_path+config_file, "r")
        config = yaml.load(stream)
        print config
        return config

    def twitchloop(self):
        if config["twitch_enabled"] != 1:
            return

        HOST = "irc.chat.twitch.tv"
        PORT = 6667
        PASS = config["twitch_oauth"]
        NICK = config["twitch_username"]
        CHANNEL = config["twitch_username"]

        readbuffer=""

        s=socket.socket( )
        s.connect((HOST, PORT))
        s.send("PASS " + PASS + "\r\n") 
        s.send("NICK " + NICK + "\r\n")
        s.send("JOIN #" + CHANNEL + "\r\n")

        while True:
            readbuffer=readbuffer+s.recv(1024)
            temp=string.split(readbuffer, "\n")
            readbuffer=temp.pop( )

            print temp

            for rcv in temp:
                if "PING" in rcv:
                    rcv=string.rstrip(rcv)
                    rcv=string.split(rcv)

                    if(rcv[0]=="PING"):
                        s.send("PONG %s\r\n" % rcv[1])
                        print "pong sent"
                elif "PRIVMSG" in rcv:
                    line = string.split(rcv, ":")
                    user = string.split(line[1], "!")[0]
                    message = line[2]
                    print user
                    print message
                    self.shiftlist(user + " (From Twitch): " + message,"twitch")
            sleep(3)
    def readloop(self):
        while True:
            strings = time.strftime("%Y,%m,%d").split(",")
            fname = config["sota_log_path"] + "SotAChatLog_"+config["sota_name"]+"_"+strings[0]+"-"+strings[1]+"-"+strings[2]+".txt"
            with open(fname) as f:
                content = f.readlines()
            index = 0
            print self.fluck
            for line in content:
                index += 1
                nowtime = self.getTime(line)
                line = line.strip()
                if self.lastmessage == 0:
                    cmptime = time.mktime((datetime.datetime.now()-datetime.timedelta(seconds=130)).timetuple())
                else:
                    cmptime = self.lastmessage
                if nowtime > cmptime:
                    line = re.sub(r"^\[[^\]]*\]\s","",line)
                    self.updatefluck(line)
                    self.lastmessage = nowtime
                elif nowtime == cmptime:
                    line = re.sub(r"^\[[^\]]*\]\s","",line)
                    noline = True
                    for flu in self.fluck:
                        if line == flu["value"]:
                            noline = False
                            break
                    if noline:
                        self.updatefluck(line)

            sleep(3)

stream = SotaStream()
config = stream.loadConfig()
print config
regex = {"onlineOffline":r"(.*)online.$|(.*)offline.$","localChat":r"^[^\)\(]*:.*$","partyChat":r"^[^:]*\(To Party\):","guildChat":r"^[^:]*\(To Guild\):", "zoneChat":r"^[^:]*\(To Zone\):","whispersFromMe":r"^["+config["sota_name"]+":]*\(To [^\)]+\):","whispersToMe":r"^[^:]*\(To "+config["sota_name"]+"\):","selfCombat":r"^(.*) attacks (.*) and hits, dealing (.*) points of","myKills":r"^(.*) has been slain by " + config["sota_name"] + "(!|'s .*!)$","myDeaths":r"^"+config["sota_name"]+" has been slain by (.*)!","localKills":r"(.*) has been slain by (.*)"}
filethread = Thread(target = stream.readloop)
twitchthread = Thread(target = stream.twitchloop)
filethread.daemon = True
twitchthread.daemon = True
filethread.start()
twitchthread.start()

conf = {"/js": {"tools.staticdir.on":True,"tools.staticdir.dir":dir_path+"js/"},"/css": {"tools.staticdir.on":True,"tools.staticdir.dir":dir_path+"css/"}}
cherrypy.server.socket_host = '0.0.0.0'
cherrypy.quickstart(stream,'/',conf)
