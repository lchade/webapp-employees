/*********************************************************************************
* WEB322 – Assignment06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Chade Li    Student ID: 143381184    Date: 2019-08-07
*
* Online (Heroku) URL: https://young-plateau-39817.herokuapp.com/
********************************************************************************/

const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");

//TODO: require new "client-sessions" module
const clientSessions = require("client-sessions");

const fs = require("fs");
const exphbs = require("express-handlebars");
const app = express();
const path = require("path");
const dataService = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth.js");
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.urlencoded({ extended: true }));

// TODO: setup client-sessions
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_a6",
    duration: 5 * 60 * 1000, // duration of the session 5 minutes
    activeDuration: 1000 * 60 // the session will be extended by 1 minute
}));

// TODO: incorporate 
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

var ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");
app.use((req, res, next) => {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});


//--------------adding routes--------------

/* "GET" routes */

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.get("/images", ensureLogin, (req, res) => {
    fs.readdir("./public/images/uploaded", (err, imageFile) => {
        res.render("images", {
            data: imageFile,
            title: "Images"
        });
    })
});

app.get("/images/add", ensureLogin, (req, res) => {
    res.render("addImage");
});

app.get("/employees", ensureLogin, (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status)
        .then((data) => {
            if (data.length >= 1) res.render("employees", { employees: data });
            else res.render("employees", { message: "no results" })
        })
        .catch(() => res.render("employees", { message: "no results" }))
    } else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager)
        .then((data) => {
            if (data.length >= 1) res.render("employees", { employees: data });
            else res.render("employees", { message: "no results" })
        })
        .catch(() => res.render("employees", { message: "no results" }))
    } else if(req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department)
        .then((data) => {
            if (data.length >= 1) res.render("employees", { employees: data });
            else res.render("employees", { message: "no results" })
        })
        .catch(() => res.render("employees", { message: "no results" }))
    } else {
        dataService.getAllEmployees()
        .then((data) => {
            if (data.length >= 1) res.render("employees", { employees: data });
            else res.render("employees", { message: "no results" })
        })
        .catch(() => res.render("employees", { message: "no results" }))
    }
});

app.get("/employee/:employeeNum", ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};

    dataService.getEmployeeByNum(req.params.employeeNum)
    .then((data) => {
        if (data) viewData.employee = data; // store employee data in the "viewData" object as "data"
        else viewData.employee = null;
    })
    .catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    })
    .then(dataService.getDepartments)
    .catch(() => res.status(500).send("Unable to get department"))
    .then((data) => {
        viewData.departments = data; // store department data in the "viewData" object as "departments"
        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching
        // viewData.departments object
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }
    })
    .catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    })
    .then(() => {
        if (viewData.employee == null) {
            res.status(404).send("Employee Not Found"); // if no employee - return an error
        } else {
            res.render("employee", { viewData: viewData }); // render "employee" view
        }
    })
    .catch(() => {
        res.status(500).send("Unable to view the Employee");
    });
});

app.get("/employees/add", ensureLogin, (req, res) => {
    dataService.getDepartments()
    .then((data) => res.render("addEmployee", { departments: data }))
    .catch(() => res.render("addEmployee", { departments: [] }))
});

app.get("/departments", ensureLogin, (req, res) => {
    dataService.getDepartments()
    .then((data) => {
        if (data.length >= 1) res.render("departments", { departments: data });
        else res.render("departments", { message: "no results" })
    })
    .catch(() => res.render("departments", { message: "no results" }));
});

app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment");
});

app.get("/department/:departmentId", ensureLogin, (req, res) => {
    dataService.getDepartmentById(req.params.departmentId)
    .then((data) => res.render("department", { department: data }))
    .catch(() => res.status(404).send("Department Not Found"))
});

app.get("/employees/delete/:employeeNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.employeeNum)
    .then(() => res.redirect("/employees"))
    .catch(() => res.status(500).send("Unable to Remove Employee / Employee not found"))
});

app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
    dataService.deleteDepartmentById(req.params.departmentId)
    .then(() => res.redirect("/departments"))
    .catch(() => res.status(500).send("Unable to Remove Department / Department not found"))
});

/* "POST" routes */

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch((err) => res.render("register", { errorMessage: err, userName:req.body.userName }))
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    dataServiceAuth.checkUser(req.body)
    .then((user) => {
        // add the returned user's userName, email and loginHistory to the session
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        // redirect the user to the "/employees" view
        res.redirect("/employees");
    })
    .catch((err) => {
        // return the user back to the page and leave the user value that was used to attempt to login
        res.render("login", { errorMessage: err, userName: req.body.userName })
    })
})

app.post("/images/add", upload.single("imageFile"), ensureLogin, (req, res) => {
    res.redirect("/images");
});


app.post("/employees/add", ensureLogin, (req, res) => {
    dataService.addEmployee(req.body)
    .then(res.redirect('/employees'))
    .catch((err) => res.json({ message: err }))   
});

app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body)
    .then(res.redirect('/employees'))
    .catch((err) => console.log(err))
});

app.post("/departments/add", ensureLogin, (req, res) => {
    dataService.addDepartment(req.body)
    .then(res.redirect('/departments'))
    .catch((err) => res.json({"message": err}))   
});

app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body)
    .then(res.redirect('/departments'))
    .catch((err) => console.log(err))
});


/* no route */

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

//--------------setup http server to listen on HTTP_PORT--------------

dataService.initialize()
.then(dataServiceAuth.initialize)
.then(() => {
    app.listen(HTTP_PORT, () => {
        console.log("app listening on: " + HTTP_PORT)
    });
})
.catch((err) => {
    console.log("unable to start server: " + err);
});