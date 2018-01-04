echo "====================" >> tests/mocha-bignumber/test.log
echo "====================" >> tests/mocha-bignumber/test.log
echo "NEW TEST $(date)" >> tests/mocha-bignumber/test.log
echo "====================" >> tests/mocha-bignumber/test.log

node index-bignumber.js >> tests/mocha-bignumber/test.log &
sleep 2

node_modules/mocha/bin/mocha --reporter spec tests/mocha-bignumber/index.js
kill $(ps aux | grep "node index-bignumber\.js" | awk '{ print $2}')
