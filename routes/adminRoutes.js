const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

router.use(authController.verifyJwtToken);

router.use(authController.restrictTo('admin'));

router
  .route('/doctors')
  .post(adminController.createDoctor)
  .get(userController.getDoctors);

router
  .route('/departments')
  .post(adminController.createDepartment)
  .get(userController.getDepartments);

router.route('/roles').get(adminController.getRoles);

router
  .route('/opd_schedule')
  .get(userController.getOpdSchedule)
  .post(adminController.createOpdSchedule)
  .patch(adminController.editOpdSchedule);

router.route('/appointments').get(adminController.getAppointments);

router.route('/departments/:id').get(userController.getDepartmentById);
router.route('/doctors/:id').get(userController.getDoctorById);
router
  .route('/appointments/doctors/:id')
  .get(userController.getDoctorAppointmentsbyId);

router
  .route('/appointments/patients/:id')
  .get(userController.getPatientAppointmentsbyId);
//router.route('/schedule').get()

module.exports = router;
