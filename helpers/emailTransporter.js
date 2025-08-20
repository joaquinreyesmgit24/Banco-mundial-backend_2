import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// Create a reusable transporter object using SMTP transport
export const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',  // Servidor SMTP de Outlook
    port: 587,                   // Puerto para TLS
    secure: false,               // Usamos TLS, no SSL
    auth: {
        user: process.env.OUTLOOK_EMAIL,     // Tu correo de Outlook
        pass: process.env.OUTLOOK_PASSWORD,  // Contraseña de la aplicación
    },

});

