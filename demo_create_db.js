const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
db.serialize(() => {
  db.run("CREATE TABLE scratchbits(id TEXT, dc_time INT)");
  insertX();
  retrieveAll();
})


function insertX(){
  db.run(`INSERT INTO scratchbits(id,dc_time) VALUES('LLK9',20)`, [], function(err) {
    if (err) {
      return console.log(err.message);
    }
  //  console.log(`x_tilt inserted ${x_tilt}`);
  })
}

/*function insertX(tableName,name,x_tilt){
  sql = `INSERT INTO scratchbits(id,x_tilt) VALUES ('LLK9'),(20)`;
  db.run(sql,[], (error) => {
    if(error) throw error;
    console.log(`a row has been inserted with ${x_tilt}`);
  })
}*/
function retrieveTime(name){
  sql = `SELECT dc_time FROM scratchbits WHERE id == ${name}`
  db.all(sql,[],(err,rows) =>{
    if(err) throw err;
    rows.forEach((row) =>{
      console.log(row);
    })
  })
}
function retrieveAll(){
  sql = `SELECT * FROM scratchbits`
  db.all(sql,[],(err,rows) =>{
    if(err) throw err;
    rows.forEach((row) =>{
      console.log(row);
    })
  })
}
