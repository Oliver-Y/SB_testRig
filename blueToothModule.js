//Packages needed
const sqlite3 = require('sqlite3').verbose();
const noble = require('noble');
const wedo = require('wedo-support');
//UUID
const SERVICE_UUID = '4cdbbd87d6e646c29d0bdf87551e159a';
const CHAR_UUID = '4cdb8702d6e646c29d0bdf87551e159a';
//Defining ScratchBit Class
//var globalwatch = Stopwatch.create();
//Variables + SQL Database
//var wd = new wedo.WeDo();
var scratchBitCount = 0;
var wd_direction = 0;
var scratchBitHolder={};
var scratchBit_limit = 4;
var db = new sqlite3.Database('',(err) =>{
  if (err){
    return console.log(err.message);
  }
  db.run("CREATE TABLE IF NOT EXISTS scratchbits(id TEXT,start_time INT, dc_time INT)");
})
//ScratchBit Class
var ScratchBit = function(name) {
  this.name = name;
  this.time = -1;
  };
  ScratchBit.prototype.setTime = function(time) {
    this.time = time;
  }
ScratchBit.prototype.getTime = function() {
  return this.time;

  };
ScratchBit.prototype.getName = function() {
  return this.name;
}
//Helper Functions
function destroy(name){
  console.log("before decremented Count" +  scratchBitCount);
  scratchBitCount--;
  console.log("after decremented Count" + scratchBitCount);
  delete scratchBitHolder[name];
}

function insert(name,begin_time,run_time){
  db.run(`INSERT INTO scratchbits(id,start_time,dc_time) VALUES('${name}','${begin_time}',${run_time})`, [], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`At ${begin_time}, ${name} has been inserted into table with ${run_time} disconnect time`);
  })
}

function retrieveTime(name){
  sql = `SELECT * FROM scratchbits`
  db.all(sql,[],(err,rows) =>{
    if(err) throw err;
    rows.forEach((row) =>{
      console.log(row);
    })
  })
}

//Motor Script
//wd.motorB = 0;
/*setInterval(() => {
  wd_direction *= -1
  wd.motorB = wd_direction;
},1000);*/



noble.on('stateChange', state => {
  console.log(state);
  if (state === 'poweredOn') {
    //Connect multiple times if true?
    noble.startScanning([SERVICE_UUID], false);
  } else {
    noble.stopScanning();
  }
});
//Found ScratchBit
noble.on('discover', function (peripheral) {
  var scratchBit = new ScratchBit(peripheral.advertisement.localName);
  scratchBitHolder[scratchBit.getName()] = scratchBit;
  console.log(scratchBitHolder);
  if (++scratchBitCount > scratchBit_limit) {
    noble.stopScanning();
    return;
  }
  //Connected
  peripheral.connect((error) => {
    //TODO error on connect
    if (error) {
      destroy(scratchBit.getName());
      throw error;
    }
    console.log("Connected to " + scratchBit.getName());
    //Disconnect
    peripheral.once('disconnect', () => {
      console.log('device disconnected');
      var stoppedTime = new Date().getTime();
      var scratchBitTime = scratchBit.getTime();
      var secondsElapsed = ((stoppedTime - scratchBitTime)/1000);
      console.log("the " + scratchBit.getName() + " ran for " + secondsElapsed + "seconds");
      db.serialize(() =>{
        insert(scratchBit.getName(),new Date().toDateString() + " " + new Date().toTimeString(),secondsElapsed);
        retrieveTime(scratchBit.getName());
      })
      destroy(scratchBit.getName());
      //TODO only start scanning if we can remember to remove it above and decrement the counter
  //    noble.startScanning([SERVICE_UUID], false);
    });

    peripheral.discoverSomeServicesAndCharacteristics([SERVICE_UUID],[CHAR_UUID],(error,services,chars)=>{
      var tilt = chars[0];
      scratchBit.setTime(new Date().getTime());
      tilt.subscribe((error) => {
        if(error) {
          destroy(scratchBit.getName());
          throw error;
        }
      })
      tilt.on('data',(data,isNotification) =>{
      var x_tilt = data[4];
        if((data[2]>>2)&1){
          x_tilt *= -1;
        }
        var y_tilt = data[3];
        if((data[2]>>3)&1){
          y_tilt *= -1;
        }
        //console.log(((data[2]>>3)&1) + ", " + ((data[2]>>2)&1));
    //    console.log(peripheral.advertisement.localName + ' tiltX:' + x_tilt + ' tiltY:' + y_tilt);
      })
    });
  });
});
