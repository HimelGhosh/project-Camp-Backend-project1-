import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail=async(options)=>{
    const transporter=nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth:{
        user:process.env.MAILTRAP_SMTP_USERNAME,
            pass:process.env.MAILTRAP_SMTP_PASSWORD
        }
    });
    const mailGenerator=new Mailgen({
        theme:"default",
        product:{
            name:"Mailgen",
            link:"https://mailgen.js/"
        }
    });
    const emailTextual=mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml=mailGenerator.generate(options.mailgenContent);


    const mail={
        from:"mail.taskmanager@email.com",
        to:options.email,
        subject:options.subject,
        html:emailHtml,
        text:emailTextual
    };
    try {
        await transporter.sendMail(mail);
        console.log("Email sent successfully");
    } catch (error) {
        console.log("Error sending email",error);
    }
}
const emailverificationMailgenContent=(username,verificationUrl)=>{
    return {
        body:{
            name:username,
            intro:"Welcome to our platform! We're very excited to have you on board.",
            action:{
                instructions:"To get started, please click here:",
                button:{
                    color:"#22BC66",
                    text:"Confirm your email",
                    link:verificationUrl
                }                
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
            }
        }
    }

const forgotPasswordMailgenContent=(username,resetPasswordUrl)=>{
    return {
        body:{
            name:username,
            intro:"You have requested to reset your password for your account.",
            action:{
                instructions:"To reset your password, please click here:",
                button:{
                    color:"#22BC66",
                    text:"Reset your password",
                    link:resetPasswordUrl
                }                
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."  
        }
    }
}

export {emailverificationMailgenContent,forgotPasswordMailgenContent,sendEmail};
    
