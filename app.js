const express = require('express');
const stringDictionary = require('./strings.js');

const pool = require('./database.js');
const defaultHeader = {"Access-Control-Allow-Origin": "*"}
let requestCounter = 0;


const app = express();
app.use(express.json());

app.use((req, res, next) => {
    requestCounter++;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Content-Type', 'application/json')

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting a MySQL connection:', err);
            res.status(500).json({ error: 'Database connection error' });
        } else {
            req.dbConnection = pool; // Attach the database connection to the request object
            next();
        }
    });

});

const PORT = process.env.PORT || 3000;

class Entry{
    constructor(word, definition, word_langauge, defLanguage) {
        this.word = word;
        this.definition = definition;
        this.wordLanguage = word_langauge;
        this.defLanguage = defLanguage;
    }
}


app.post('/api/v1/definition', (req, res) => {
    const word = req.body.word;
    const definition = req.body.definition;
    const wordLanguage = req.body.wordLanguage;
    const defLanguage = req.body.defLanguage;
    const entry = new Entry(word, definition, wordLanguage, defLanguage);
    const sql = stringDictionary.sqlInsert(entry);
    const sqlGet = stringDictionary.sqlGet(word);

    /// If Any fields Empty, then return 400
    if (!word || !definition || !wordLanguage || !defLanguage) {
        res.status(400).json({
            message: stringDictionary.BadRequestMessage,
            total: requestCounter
        });
        return;
    }
    

    pool.query(sqlGet, (err, result) => {
        if (err) {
            res.status(404).end(
                stringDictionary.error(404, JSON.stringify(err))
            );
        } else if (result.length > 0) {
            res.status(409).json({
                error: stringDictionary.entryExistsError,
                message: stringDictionary.entryExistsMessage(word),
                entry: entry,
                total: requestCounter
            });
        } else {
            pool.query(sql, (err, result) => {
                if (err) {
                    res.status(500).json({

                        error: stringDictionary.error(500, stringDictionary.internalServerError),
                        total: requestCounter
                    });

                } else {
                    res.status(201).json({
                        message: stringDictionary.entryCreated,
                        entry: entry,
                        total: requestCounter
                    });
                }
            });
        }
    });
});

app.patch('/api/v1/definition/:word', (req, res) => {
    const word = req.params.word;
    const definition = req.body.definition;
    const wordLanguage = req.body.wordLanguage;
    const defLanguage = req.body.defLanguage;

    if (!definition || !wordLanguage || !defLanguage) {
        res.status(400).json({
            message: stringDictionary.BadRequestMessage,
            total: requestCounter
        });
        return;
    }

    const entry = new Entry(word, definition, wordLanguage, defLanguage);
    const sqlUpdate = stringDictionary.sqlUpdate(entry);

    pool.query(sqlUpdate, (err, result) => {
        if (err) {
            res.status(500).json({
                error: stringDictionary.error(500, 'Internal server error'),
                total: requestCounter
            });
        } else if (result.affectedRows === 0) {
            res.status(404).json({
                error: stringDictionary.error(404, stringDictionary.wordNotExist(word)),
                total: requestCounter
            });
        } else {
            res.status(200).json({
                message: stringDictionary.definitionUpdated(word),
                entry: entry,
                total: requestCounter
            });
        }
    });
});

app.delete('/api/v1/definition', (req, res) => {
    res.status(400).json({
        message: stringDictionary.BadRequestMessage,
        total: requestCounter
    });
    return;
})

app.delete('/api/v1/definition/:word', (req, res) => {
    const word = req.params.word;
    if (word.length == 0) {
        res.status(400).json({
            message: stringDictionary.BadRequestMessage,
            total: requestCounter
        });
        return;
    }
    const sql = stringDictionary.sqlDelete(word);
    const entry = new Entry(word);

    pool.query(sql, (err, result) => {
        if (err) {
            res.status(404).json(
                {
                    error: stringDictionary.error(404, stringDictionary.wordNotExist(word)),
                    entry: entry.word,
                    total: requestCounter
                }
                );
        } else if (result.affectedRows == "0") {
            res.status(404).json(
                {
                    error: stringDictionary.error(404, stringDictionary.wordNotExist(word)),
                    entry: entry,
                    total: requestCounter
                }
                );
        } else {
            res.status(200).json({
                message: stringDictionary.wordDeletedMessage(word),
                total: requestCounter

            });
        }
    })
})

app.get('/api/v1/definition', (req, res) => {
    res.status(400).json({
        message: stringDictionary.BadRequestMessage,
        total: requestCounter
    });
    return;
})

app.get('/api/v1/definition/:word', (req, res) => {
    const word = req.params.word
    console.log(word)

    if (word.length == 0 || !word) {
        res.status(400).json({
            message: stringDictionary.BadRequestMessage,
            total: requestCounter
        });
        return;
    }

    const sql = stringDictionary.sqlGet(word);
    pool.query(sql, (err, result) => {  
        if (err) {
            res.status(404).json(
{               error: stringDictionary.error(404, err),
    total: requestCounter

}                );
        } else if (result == "") {
            res.status(404).json(
                {error: stringDictionary.error(404, stringDictionary.notFound(word)),
                    total: requestCounter
                }
            );   
        }
        else {
            res.status(200).json({
                definition: stringDictionary.found(result[0].word, result[0].definition),
                entry: result,
                total: requestCounter

            });

        }
    })
})


app.get('/api/v1/languages', (req, res) => {
    const sql = `SELECT * FROM languages;`
    pool.query(sql, (err, result) => {
        if (err) {
            res.status(404).json(
                {
                    error: stringDictionary.error(404, JSON.stringify(err)),
                    total: requestCounter

                }
               
            );
        } else {
            res.status(200).json({
                message: "Languages Found",
                languages: result,
                total: requestCounter

            }
                );
        }
    })
});



app.listen(PORT, () => "Server is running on port 3000")