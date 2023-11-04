const express = require('express');

const pool = require('./database.js');
const defaultHeader = {"Access-Control-Allow-Origin": "*"}
let requestCounter = 0;


const app = express();
app.use(express.json());
app.use((req, res, next) => {
    requestCounter++;
    res.header(defaultHeader);
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

const stringDictionary = {
    found: (word, message) => `Definition found for ${word} : ${message}`,
    error: (code, message) => `Status code ${code}: ${message}`,
    notFound: (word) => `No definition found for ${word}`,
    wordNotExist: (word) => `The word ${word} does not exist in the dictionary`,
    sqlGet: (word) => `SELECT * FROM dictionary WHERE word = '${word}'`,
    sqlDelete: (word) => `DELETE FROM dictionary WHERE word = '${word}'`,
    sqlInsert: (entry) => `INSERT INTO dictionary (word, definition, wordLanguage, defLanguage) VALUES ('${entry.word}', '${entry.definition}', '${entry.wordLanguage}', '${entry.defLanguage}');`,
    entryCreated: "Entry Created Successfully",
    entryExistsError: "Word Conflict",
    entryExistsMessage: (word) => `The word ${word} already exists in the dictionary`,
    internalServerError: "Internal Server Error",
    BadRequestMessage: "One of the Fields are missing!",
    definitionUpdated: (word) => `Definition for ${word} updated successfully`,
    wordDeletedMessage: (word) => `The word ${word} was deleted successfully`,


};

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
    // Either or
    const word = req.params.word || req.body.word;
    const definition = req.body.definition;
    const wordLanguage = req.body.wordLanguage;
    const defLanguage = req.body.defLanguage;
    const entry = new Entry(word, definition, wordLanguage, defLanguage);
    const sqlGet = stringDictionary.sqlGet(word);

    // If Any fields Empty, then return 400
    if (!word || !definition || !wordLanguage || !defLanguage) {
        res.status(400).json({
            message: stringDictionary.BadRequestMessage,
            total: requestCounter
        });
        return;
    }

    pool.query(sqlGet, (err, result) => {
        if (err) {
            res.status(404).json(
                {
                    error: stringDictionary.error(404, stringDictionary.wordNotExist(word)),
                    total: requestCounter

                }
            );
        } else {
        res.status(201).json({
            message: stringDictionary.definitionUpdated(word),
            entry: entry,
            total: requestCounter
        });
        }
    });
})

app.delete('/api/v1/definition/:word', (req, res) => {
    const word = req.params.word;
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

app.get('/api/v1/definition/:word', (req, res) => {
    const word = req.params.word
    console.log(word)
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


// All done once DO NOT RUN
app.delete('/dropTable', (req,res) => {
    const sql = `DROP TABLE dictionary;`
    pool.query(sql, (err, result) => {
        if (err) {
            res.status(404).end(
                stringDictionary.error(404, JSON.stringify(err)
                ));
        } else {
            res.status(200).end(JSON.stringify(result));
        }
    })
});

app.post('/api/v1/createTable', (req,res) => {
    const sql = `CREATE TABLE dictionary (
        word VARCHAR(255) NOT NULL,
        definition VARCHAR(255) NOT NULL,
        wordLanguage VARCHAR(255) NOT NULL,
        defLanguage VARCHAR(255) NOT NULL,
        PRIMARY KEY (word)
    );`
    console.log(sql);
    pool.query(sql, (err, result) => {
        if (err) {
            res.status(404).end(
                stringDictionary.error(404, JSON.stringify(err),
                ));
        } else {
            res.status(200).end(JSON.stringify(result));
        }
    })
})



app.post('/api/v1/createTableLanguage', (req, res) => {
    const sql = `
        CREATE TABLE languages (
            code VARCHAR(2) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );

        INSERT INTO languages (code, name) VALUES
            ('en', 'English'),
            ('ko', 'Korean'),
            ('tl', 'Tagalog');
    `;

    console.log(sql);

    pool.query(sql, (err, result) => {
        if (err) {
            res.status(404).end(
                stringDictionary.error(404, JSON.stringify(err))
            );
        } else {
            res.status(200).end(JSON.stringify(result));
        }
    });
});





app.listen(PORT, () => "Server is running on port 3000")