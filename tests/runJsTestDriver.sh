#!/bin/sh
java -jar library/JsTestDriver-1.2.2.jar --port 9876 --config jsTestDriver.conf --browser firefox --tests all --testOutput coverage
