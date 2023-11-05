const stringDictionary = {
    found: (word, message) => `Definition found for ${word} : ${message} `,
    error: (code, message) => `Status code ${code}:  ${message}`,
    notFound: (word) => `No definition found for ${word}`,
    wordNotExist: (word) => `The word ${word} does not exist in the dictionary`,
    sqlGet: (word) => `SELECT * FROM dictionary WHERE word = '${word}'`,
    sqlDelete: (word) => `DELETE FROM dictionary WHERE word = '${word}'`,
    sqlInsert: (entry) => `INSERT INTO dictionary (word, definition, wordLanguage, defLanguage) VALUES ('${entry.word}', '${entry.definition}', '${entry.wordLanguage}', '${entry.defLanguage}');`,
    sqlUpdate: (entry) => `UPDATE dictionary SET definition = '${entry.definition}', wordLanguage = '${entry.wordLanguage}', defLanguage = '${entry.defLanguage}' WHERE word = '${entry.word}';`,
    entryCreated: "Entry Created Successfully",
    entryExistsError: "Word Conflict",
    entryExistsMessage: (word) => `The word ${word} already exists in the dictionary`,
    internalServerError: "Internal Server Error, please try again later",
    BadRequestMessage: "One of the Fields are missing!",
    definitionUpdated: (word) => `Definition for ${word} updated successfully`,
    wordDeletedMessage: (word) => `The word ${word} was deleted successfully`,
};

module.exports = stringDictionary;