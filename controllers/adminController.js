const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');
const mysqlQuery = require('./connection');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const authController = require('./authController');
const sendEmail = require('../utils/email.js');

let time_ = [
  '09:00:00',
  '09:30:00',
  '10:00:00',
  '10:30:00',
  '11:00:00',
  '11:30:00',
  '15:00:00',
  '15:30:00',
  '16:00:00',
  '16:30:00',
  '17:00:00',
  '17:30:00',
];

let emailSend = catchAsync(async (data, res) => {
  try {
    await sendEmail({
      email: data.email,
      subject: data.subject,
      text: data.text,
    });

    res.status(200).json({
      status: data.status,
      message: data.message,
    });
  } catch (err) {
    console.log(err);
    return next(new appError(data.errorMessage), 500);
  }
});

exports.getAppointments = catchAsync(async (req, res, next) => {
  let query = `select * from appointments a, patients b, doctors c where a.patientId=b.patientId and a.doctorId=c.doctorId order by date_ desc ,time_ desc`;
  let result = await mysqlQuery(query);
  result = convertDateTimeToDate(result);
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.getRoles = catchAsync(async (req, res, next) => {
  //console.log('res');
  let query = `select * from roles inner join departments on departments.deptId = roles.deptId`;
  let result = await mysqlQuery(query);
  console.log(result, 'roles fucked');
  query = `select * from departments`;
  let result1 = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    roles: result,
    departments: result1,
  });
});

exports.getDepts = catchAsync(async (req, res, next) => {
  let query = `select * from departments`;
  let result = await mysqlQuery(query);
  res.status(200).json({
    status: 'success',
    departments: result,
  });
});

exports.createDoctor = catchAsync(async (req, res, next) => {
  let data = req.body;
  if (!validator.isEmail(data.email)) {
    return new appError('Provide a valid email-id');
  }
  let length = 20,
    wishlist =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
  password = await Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('');
  pass = await bcrypt.hash(password, 12);
  let query = `insert into users (username,password,role) values("${data.email}","${pass}","doctor")`;
  let result = await mysqlQuery(query);
  query = `insert into doctors (dname,email,phno,deptId,roleId,experience,description,modifiedAt) values("${data.dname}","${data.email}","${data.phno}",${data.deptId},"${data.role}",${data.experience},"${data.description}",current_date())`;
  console.log(query);
  result = await mysqlQuery(query);
  await emailSend(
    {
      email: data.email,
      subject: 'Edit your profile',
      text: `Your username is ${data.email} and password is ${password}`,
      status: 'success',
      message: 'New doctor created. Username and password sent to email!',
      errorMessage: 'There was an error sending the email. Try again later!',
    },
    res
  );
});

exports.createDepartment = catchAsync(async (req, res, next) => {
  let data = req.body;
  let query = `insert into departments (deptId,deptName,headId) values (${data.deptId},"${data.deptName}",${data.headId})`;
  let result = await mysqlQuery(query);
  res.status(200).json({
    status: 'New department created',
  });
});

exports.createOpdSchedule = catchAsync(async (req, res, next) => {
  let data = req.body;
  var p;
  let query = `insert into opd_schedule (doctorId,date_,room_no) values (${data.doctorId} ,"${data.date_}",${data.room_no})`;
  let result = await mysqlQuery(query);
  query = `select opdId from opd_schedule where doctorId=${data.doctorId} and date_="${data.date_}"`;
  let result2 = await mysqlQuery(query);
  for (let i = 0; i < data.availability.length; i++) {
    p = data.availability[i] ? 'Free' : 'Absent';
    query = `insert into opd_tokens (opdId,time_,availability) values (${result2[0].opdId},"${time_[i]}","${p}")`;
    result = await mysqlQuery(query);
  }
  res.status(200).json({
    status: 'Opd-schedule and Opd-tokens are created',
  });
});

exports.editOpdSchedule = catchAsync(async (req, res, next) => {
  data = req.body;
  let query = `select opdId from opd_schedule where doctorId = ${req.body.doctorId} and date_ = "${req.body.date_}"`;
  let result1 = await mysqlQuery(query);
  var result, result3, result5;
  query = `select availability from opd_tokens where opdId=${result1[0].opdId}`;
  let result2 = await mysqlQuery(query);
  query = `select dname from doctors where doctorId=${req.body.doctorId}`;
  result4 = await mysqlQuery(query);
  for (let i = 0; i < 12; i++) {
    //console.log(result2[i].availability, data.availability[i]);
    if (
      (result2[i].availability == 'Absent' && data.availabilty[i] == 'Free') ||
      (result2[i].availability == 'Free' && data.availability[i] == 'Absent')
    ) {
      query = `update opd_tokens set availability = "${data.availability[i]}" where opdId = ${result1[0].opdId} and time_ = "${time_[i]}" `;
      result = await mysqlQuery(query);
    } else if (
      result2[i].availability == 'Allotted' &&
      data.availability[i] == 'Absent'
    ) {
      query = `update opd_tokens set availability = "${data.availability[i]}" where opdId = ${result1[0].opdId} and time_ = "${time_[i]}" `;
      result = await mysqlQuery(query);
      query = `select patientId from appointments where doctorId = ${req.body.doctorId} and date_ ="${req.body.date_}" and time_="${time_[i]}"`;
      result3 = await mysqlQuery(query);
      //console.log(result3);
      query = `select email from patients where patientId=${result3[0].patientId}`;
      result5 = await mysqlQuery(query);
      query = `delete from appointments where doctorId = ${req.body.doctorId} and date_ ="${req.body.date_}" and time_="${time_[i]}"`;
      result = await mysqlQuery(query);
      await emailSend(
        {
          email: result5[0].email,
          subject: `Regarding your appointment with ${result4[0].dname} on ${req.body.date_}`,
          text: `Your appointment with ${result4[0].dname} has been cancelled due to unavoidable circumstances.`,
          status: 'success',
          message: 'Opd Schedule edit successfully',
          errorMessage:
            'There was an error sending the email. Try again later!',
        },
        res
      );
    }
  }
  // res.status(200).json({
  //   status: 'Appointment cancelled successfully',
  // });
});
