var nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'fashionfit720@gmail.com',
      pass: 'wnacttoydfpjafdp',
    },
  });

  const mailOptions = {
    from: 'fashionfit@gmail.com', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.text,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
