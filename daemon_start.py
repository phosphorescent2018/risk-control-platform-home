#!/usr/bin/env python3
"""Detach-start the Axhub dev server so it outlives the agent session."""
import os, sys, time, socket

PORT = 51722
CWD = '/Users/sun/Axhub/risk-control-platform-home'
LOG = '/tmp/axhub-home-dev.log'
PIDFILE = '/tmp/axhub-home-dev.pid'

def port_busy():
    s = socket.socket()
    s.settimeout(0.5)
    try:
        return s.connect_ex(('127.0.0.1', PORT)) == 0
    finally:
        s.close()

if port_busy():
    print('already running on', PORT)
    sys.exit(0)

pid = os.fork()
if pid == 0:
    os.setsid()
    if os.fork() > 0:
        os._exit(0)
    fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, 0)
    os.chdir(CWD)
    os.execvp('npm', ['npm', 'run', 'dev'])
os.waitpid(pid, 0)
time.sleep(0.3)
with open(PIDFILE, 'w') as f:
    f.write(str(os.getpid()))
print('daemon spawned, log:', LOG)
