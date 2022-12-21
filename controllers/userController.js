const mysql = require('./connection');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const { query } = require('express');

exports.getDoctors = catchAsync(async (req, res, next) => {
  let query = 'select * from doctors';
  let result = await mysqlQuery(query);
  query = `SELECT date_ as mdate ,doctorId from opd_schedule where DATE(date_)>=CURDATE()`;
  let result1 = await mysqlQuery(query);
  query = `SELECT * from rooms`;
  let result2 = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    doctors: result,
    opds: result1,
    rooms: result2,
  });
});

exports.getDepartments = catchAsync(async (req, res, next) => {
  let query = 'select * from departments';
  let result = await mysqlQuery(query);
  query =
    'select a.doctorId,a.deptId,a.dname,a.roleId,b.role from doctors a inner join roles b on a.roleId=b.roleId';
  let result1 = await mysqlQuery(query);
  query = `select a.opdId,a.time_,a.availability,b.mdate,b.doctorId from opd_tokens a inner join (select date_ as mdate ,doctorId,opdID from opd_schedule where date(date_)>=curdate()) b on a.opdId=b.opdId`;
  let result2 = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    departments: result,
    doctors: result1,
    opds: result2,
  });
});

exports.getDepartmentById = catchAsync(async (req, res, next) => {
  let query = `select * from departments where deptId=${req.params.id}`;
  let result = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    data: { result },
  });
});

exports.getDoctorsByDeptId = catchAsync(async (req, res, next) => {
  let query = `select * from doctors where deptId=${req.params.id}`;
  let result = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    data: { result },
  });
});

exports.getDoctorById = catchAsync(async (req, res, next) => {
  let query = `select * from doctors where doctorId=${req.params.id}`;
  let result = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    data: { result },
  });
});

exports.getOpdSchedule = catchAsync(async (req, res, next) => {
  let query = `delete from opdSchedule where date(date_)<curdate()`;
  let result = mysqlQuery(query);
  query = `select * from opdSchedule`;
  res.status(200).json({
    status: 'success',
    opds: result,
  });
});

exports.bookAppointment = catchAsync(async (req, res, next) => {
  let data = req.body;
  let query = `select opdId,room_no from opd_schedule where doctorId=${data.doctorId} and date_="${data.date_}"`;
  let result = await mysqlQuery(query);
  // console.log(result, 'fuck');
  query = `update opd_tokens set availability="Allotted" where opdId=${result[0].opdId} and time_="${data.time_}"`;
  let result1 = await mysqlQuery(query);
  query = `insert into appointments (doctorId,patientId,date_,time_,room_no) values (${data.doctorId},${data.patientId},"${data.date_}","${data.time_}",${result[0].room_no})`;
  result1 = await mysqlQuery(query);
  console.log(result1, 'fuck');
  res.status(200).json({
    status: 'success',
    room_no: result[0].room_no,
  });
});

convertDateTimeToDate = (dateArray) => {
  try {
    dateArray = dateArray.map((el) => {
      var day = ('0' + el.date_.getDate()).slice(-2);
      var month = ('0' + (el.date_.getMonth() + 1)).slice(-2);
      var year = el.date_.getFullYear();

      el.date_ = year + '-' + month + '-' + day;
      return el;
    });
    return dateArray;
  } catch (err) {
    console.log(err.message);
  }
};

exports.getDoctorAppointmentsbyId = catchAsync(async (req, res, next) => {
  let query1 = `select a.dname,b.aptId,b.doctorId,b.patientId,b.prescription,b.date_,b.time_,c.pname,b.room_no from doctors a, appointments b, patients c where a.doctorId=${req.params.id} and a.doctorId=b.doctorId and b.patientId=c.patientId order by b.date_ desc`;
  let result = await mysqlQuery(query1);
  result = convertDateTimeToDate(result);
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.getPatientAppointmentsbyId = catchAsync(async (req, res, next) => {
  console.log(req.params.id);
  let query = `select a.pname,b.aptId,b.doctorId,b.patientId,b.prescription,b.date_,b.time_,c.dname,b.room_no from patients a ,appointments b, doctors c where a.patientId=${req.params.id} and a.patientId=b.patientId and b.doctorId=c.doctorId order by b.date_ desc`;
  let result = await mysqlQuery(query);
  result = convertDateTimeToDate(result);
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.getAppointmentById = catchAsync(async (req, res, next) => {
  let query = `select * from appointments where aptid=${req.params.id}`;
  let result = await mysqlQuery(query);
  result = convertDateTimeToDate(result);
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.cancelAppointmentById = catchAsync(async (req, res, next) => {
  let query = `select * from appointments where aptId=${req.params.id}`;
  let result1 = await mysqlQuery(query);
  result1 = convertDateTimeToDate(result1);
  query = `select opdId from opd_schedule where doctorId = ${result1[0].doctorId} and date_ = "${result1[0].date_}"`;
  let result2 = await mysqlQuery(query);
  console.log(result1[0].time_);
  query = `update opd_tokens set availability = "Free" where opdId = ${result2[0].opdId} and time_ = "${result1[0].time_}" `;
  result2 = await mysqlQuery(query);
  query = `delete from appointments where aptId = ${req.params.id}`;
  result2 = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
  });
});

exports.givePrescription = catchAsync(async (req, res, next) => {
  let data = req.body,
    query,
    result1,
    result2;
  for (let i = 0; i < data.meds.length; i++) {
    query = `select medId[i] from medicines where medName = "${data.meds[i].medName}"`;
    result1 = await mysqlQuery(query);
    if (result1.length == 0) {
      query = `insert into medicines (medName) values ("${data.meds[i].medName}")`;
      result2 = await mysqlQuery(query);
    }
    query = `select count(*) as no_ from medicines`;
    let result3 = await mysqlQuery(query);
    query = `insert into aptmedicines (aptId,medId,quantity,days,description,disease) values (${data.aptId},${result3[0].no_},${data.meds[i].quantity},${data.meds[i].days},"${data.meds[i].description}","${data.disease}")`;
    result1 = await mysqlQuery(query4);
  }
  query = `insert into appointments (prescription) values "${data.prescription}" where aptId=${data.aptId}`;
  result1 = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
  });
});
