import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3002;

const database = './example.db';

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Single routing
const router = express.Router();


app.use(express.static(__dirname + '\\public'));

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors());

router.get('/get/icons/:text', cors(corsOptions), async function (req, res, next) {
  fs.readFile(__filename.replace('\\index.js', '\\public\\icons') + '/icons.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const autoCompleteSearch = [];
    const files = data.split(/\r?\n/);

    files.forEach((element, index) => {
      files[index] = element.replace('C:\\Users\\Manog\\Desktop\\expenses\\src\\public\\icons\\', ' ')
    });

    if (req.params.text != '') {
      files.map(i => i.indexOf(req.params.text) > -1 ? autoCompleteSearch.push(i) : null);
    }
    res.send(autoCompleteSearch.slice(0, 10));
  });
})

router.get('/getAllYearlyMovementsByCategory/:year', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database)

  let sql = `
    select SUM(m."value") as total, c."name"
    from movements m 
    left join category c 
    on c."id" = m."category_id"
    where strftime('%Y', m."date") = '2023'
    group by c."name";
    `;

  return db.all(sql, [], async (err, rows) => {
    res.send(rows);
  })
})

router.get('/getAllMonthlyMovementsByCategory/:month', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database)

  let sql = `
  select SUM(m."value") as total, c."name"
  from movements m 
  left join category c 
  on c."id" = m."category_id"
  where strftime('%m', m."date") = '${req.params.month}'
  group by c."name";
  `;

  db.all(sql, [], async (err, rows) => {
    res.send(rows);
  })

})

router.get('/getAllMonthlyMovementsByUser/:year', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database)

  let sql = `
  select SUM(m."value") as total, strftime('%m', m.date) as month, p.name
  from movements m,
  person p
  where p.id = m.user_id and strftime('%Y', m."date") = '${req.params.year}'
  group by p.name, strftime('%m', m.date)
  order by month asc;
    `;


  db.all(sql, [], async (err, rows) => {
    res.send(rows);
  })

})

router.get('/getAllMonthlyMovementsAverage/:year', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database)
  let today = new Date();

  let sql = `
    select sum(value) as total, strftime('%m', date) as month
    from movements
    where strftime('%Y', date) = '${req.params.year}'
    group by month;
    `;


  db.all(sql, [], async (err, rows) => {
    res.send(rows);
  })

})

router.get('/getHistoryByYear/:year/:limit/:skip', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);

  let sql = `
  select m.id, m."date", m."value", m."description", c."icon"
	from movements m, category c
	where m.category_id = c.id 
  and strftime('%Y', m.date) = '${req.params.year}'
	order by m."date" desc
	limit ${req.params.limit};
    `;

  console.log('hello')

  db.all(sql, [], async (err, rows) => {
    console.log(rows)
    if (err)
      console.log('Error: ', err);
    res.send(rows);
  });
});

router.get('/all/categories', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);

  let sql = `
    select id, name, icon
    from category;
    `;


  db.all(sql, [], async (err, rows) => {
    if (err)
      console.log('Error: ', err);

    res.send(rows);
  });
});

router.post('/create/category', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);


  let name = req.body.name;
  let icon = req.body.iconpath;

  let sql = `
    insert into category 
    (
      name,
      icon
    ) 
    values
    (
      '${name}',
      '${icon}'
    )
    `;

  db.all(sql, [], async (err, rows) => {
    if (err)
      console.log('Error: ', err);

    res.send(rows);
  });

  db.close();
});

router.post('/create/movement', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);


  let desc = req.body.description;
  let categoryId = req.body.categoryId;
  let value = req.body.value;
  let date = new Date(req.body.date);
  let user = req.body.user;

  let sql = `
  insert into movements
  (
    description,
    category_id,
    user_id,
    value,
    date
    ) 
    values
    (
      '${desc}',
      ${categoryId},
      ${user},
      ${value},
      strftime('%Y-%m-%d %H:%M:%S', '${date.getFullYear()}-${(date.getMonth() + 1).toString().length == 1 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}-${date.getDate().toString().length == 1 ? '0' + date.getDate() : date.getDate()}')
      )
      `;



  db.all(sql, [], async (err, rows) => {
    if (err)
      console.log('Error: ', err);

    res.send(rows);
  });

  db.close();
});

router.put('/update/movements', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);

  let movements = req.body;

  movements.forEach(movement => {
    let id = movement.id;
    let desc = movement.desc;
    let value = movement.value;
    let date = new Date(movement.date);

    let sql = `
      update movements
      set description = '${desc}', value = ${value}, date = strftime('%Y-%m-%d %H:%M:%S', '${date.getFullYear()}-${(date.getMonth() + 1).toString().length == 1 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}-${date.getDate().toString().length == 1 ? '0' + date.getDate() : date.getDate()}')
      where id = ${id}
      `;


    db.all(sql, [], async (err, rows) => {
      if (err)
        console.log('Error: ', err);

    });
  });

  db.close();
});

router.get('/delete/movement/:id', cors(corsOptions), async function (req, res, next) {
  let db = new sqlite3.Database(database);

  let sql = `
      delete from movements
      where id = ${req.params.id}
      `;


  db.all(sql, [], async (err, rows) => {
    if (err)
      console.log('Error: ', err);

  });

  db.close();
});

app.use(router);

app.listen(PORT, '0.0.0.0', function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});