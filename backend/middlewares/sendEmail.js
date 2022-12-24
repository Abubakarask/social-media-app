const nodemailer = require('nodemailer');

// const msg = {
//     from: 'darkluciferpg@gmail.com',
//     to: 'reklessgamerff@gmail.com',
//     subject: 'NodeMailer Testing',
//     text: 'Hi there this is testing of mail'
// };

// nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'darkluciferpg@gmail.com',
//         pass: 'inxfqltkfcorsuuj         '
//     },
//     port: 465,
//     host: 'smtp.gmail.com'
// })

exports.sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
        port: process.env.SMTP_PORT,
        host: process.env.SMTP_HOST
    })


    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    await transporter.sendMail(mailOptions);
}