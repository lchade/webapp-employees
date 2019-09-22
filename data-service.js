const Sequelize = require('sequelize');

var sequelize = new Sequelize('d10vtakk5li1q1', 'ekztymkjrbpnvf', '0331f4912f94ecfe3e30ac456a9cc1979c1cc678705c8fa79aef8b8ea46ea1be', {
    host: 'ec2-23-21-109-177.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: true
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(() => resolve())
        .catch(() => reject("unable to sync the database"));
    });
};

module.exports.getAllEmployees = function() {
    return new Promise((resolve, reject) => {
        Employee.findAll()
        .then(() => resolve(Employee.findAll()))
        .catch(() => reject("no results returned"))
    });
};

module.exports.getEmployeesByStatus = function(status) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {status: status}
        })
        .then(() => resolve(Employee.findAll({
            where: {status: status}
        })))
        .catch(() => reject("no results returned"))
    });
};

module.exports.getEmployeesByDepartment = function(department) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {department: department}
        })
        .then(() => resolve(Employee.findAll({
            where: {department: department}
        })))
        .catch(() => reject("no results returned"))
    });
};

module.exports.getEmployeesByManager = function(manager) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {employeeManagerNum: manager}
        })
        .then(() => resolve(Employee.findAll({
            where: {employeeManagerNum: manager}
        })))
        .catch(() => reject("no results returned"))
    });
};

module.exports.getEmployeeByNum = function(num) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {employeeNum: num}
        })
        .then((data) => resolve(data[0]))
        .catch(() => reject("no results returned"))
    });
};

module.exports.addEmployee = function(employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (let i in employeeData) {
            if (employeeData[i] == "") employeeData[i] = null;
        }
        Employee.create(employeeData)
        .then(() => resolve())
        .catch(() => reject("unable to create employee"))
    });
};

module.exports.updateEmployee = function(employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (let i in employeeData) {
            if (employeeData[i] == "") employeeData[i] = null;
        }
        Employee.update(employeeData, {
            where: {employeeNum: employeeData.employeeNum}
        })
        .then(() => resolve())
        .catch(() => reject("unable to update employee"))
    });
};

module.exports.getDepartments = function() {
    return new Promise((resolve, reject) => {
        Department.findAll()
        .then(() => resolve(Department.findAll()))
        .catch(() => reject("no results returned"))
    });
};

module.exports.addDepartment = function(departmentData) {
    for (prop in departmentData) {
        if (prop == "") {prop = null;}
    }
    return new Promise((resolve, reject) => {
        Department.create(departmentData)
        .then(() => resolve(departmentData))
        .catch(() => reject("unable to create department"))
    });
};

module.exports.updateDepartment = function(departmentData) {
    for (prop in departmentData) {
        if (prop == "") prop = null;
    }
    return new Promise((resolve, reject) => {
        Department.update(departmentData, {
            where: {departmentId: departmentData.departmentId}
        })
        .then(() => resolve())
        .catch(() => reject("unable to update department"))
    });
};

module.exports.getDepartmentById = function(id) {
    return new Promise((resolve, reject) => {
        Department.findAll({
            where: {departmentId: id}
        })
        .then((data) => resolve(data[0]))
        .catch(() => reject("no results returned"))
    });
};

module.exports.deleteEmployeeByNum = function(num) {
    return new Promise((resolve, reject) => {
        Employee.destroy({
            where: {employeeNum: num}
        })
        .then(() => resolve())
        .catch(() => reject("unable to delete employee"))
    });
};

module.exports.deleteDepartmentById = function(id) {
    return new Promise((resolve, reject) => {
        Department.destroy({
            where: {departmentId: id}
        })
        .then(() => resolve())
        .catch(() => reject("unable to delete department"))
    });
};