#!/usr/bin/env python3
#-*- coding:UTF-8 -*-

'''
    为了满足pixiJS的需要，启动一个简单的服务器，并调用系统浏览器访问localhost:8923
'''
import webbrowser
import threading
from http.server import HTTPServer, CGIHTTPRequestHandler

'''
    启动CGI服务器
'''
def run(server_class=HTTPServer, handler_class=CGIHTTPRequestHandler):
    server_address = ('', 8923)
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()

server = threading.Thread(target=run)
server.start()

webbrowser.open("http://127.0.0.1:8923")
