const dirSearch = require('./dirDFS.js');

dirSearch.dirDFS(process.env.DIR_PATH, function (err, data) {
    if (err) {
        throw err;
    }
    console.log(data);
});

