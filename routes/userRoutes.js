const { Router } = require('express');
const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const router = express.Router();

router.use(authController.verifyJwtToken);

router
  .route('/appointments')
  .post(authController.restrictTo('patient'), userController.bookAppointment);

router
  .route('/appointments/:id')
  .get(userController.getAppointmentById)
  .delete(
    authController.restrictTo('patient'),
    userController.cancelAppointmentById
  );

router.route('/doctor/:id').get(userController.getDoctorsByDeptId);

router.route('/departments').get(userController.getDepartments);

router
  .route('/appointments/patients/:id')
  .get(
    authController.restrictTo('patient'),
    userController.getPatientAppointmentsbyId
  );

router
  .route('/opdSchedule/:id')
  .get(authController.restrictTo('doctor', 'admin'));

router
  .route('/appointments/doctors/:id')
  .get(
    authController.restrictTo('doctor'),
    userController.getDoctorAppointmentsbyId
  );

// router.route('/prescriptions').post(userController.addPrescription);
module.exports = router;
