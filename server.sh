source env.conf
kill "$(< server.pid)"
nohup node server/server > server.log & echo $! > server.pid
echo "server PID = " & cat server.pid