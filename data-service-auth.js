// calling mongoose module
var mongoose = require("mongoose");

// create Schema varaible pointing to mongoose schema
var Schema = mongoose.Schema;

// calling bcrypt module
const bcrypt = require("bcryptjs");

// create a user schema
let userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User; // to be defined on new connection (see initialize)
/*
bcrypt.genSalt(10, (err, salt) => { // generate a "salt" using 10 rounds
    bcrypt.hash(userData.password, salt, (err, hash) => { // encrpyt the password
        // store the resulting "hash" value in the db

    })
})
*/

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://cli227:WEBthreetw0tw0app@senecaweb-nyzww.mongodb.net/test?retryWrites=true&w=majority");
        db.on("error", (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once("open", () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = (userData) => {
    return new Promise ((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.genSalt(10, (err, salt) => { // generate a "salt" using 10 rounds
                bcrypt.hash(userData.password, salt, (err, hash) => { // encrpyt the password
                // report error if an error occurs
                    if (err) {
                        reject("There was an error encrypting the password: " + err);
                    } else {
                        // store the resulting "hash" value in the db, replace the user-entered password
                        userData.password = hash;
                        let newUser = new User(userData);
                        newUser.save((err) => {
                            if (err) {
                                if (err.code === 11000) {
                                    reject("User Name already taken");
                                } else {
                                    reject("There was an error creating the user: " + err);
                                }
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        }
    });
};

module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
        .exec()
        .then((users) => {
            if (!users) {
                reject("Unable to find user: " + userData.userName);
            } else {
                bcrypt.compare(userData.password, users[0].password)
                .then((res) => {
                    if (res === false) {
                        reject("Incorrect Password for user: " + userData.userName);
                    } else if (res === true) {
                        users[0].loginHistory.push({
                            dateTime: (new Date()).toString(),
                            userAgent: userData.userAgent
                        });
                        User.update({ userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } },
                            { multi: false })
                        .exec()
                        .then(() => resolve(users[0]))
                        .catch((err) => reject("There was an error verifying the user: " + err))
                    }
                });
            }
        })
        .catch(() => reject("Unable to find user: " + userData.userName))
    });
};